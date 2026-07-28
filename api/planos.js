import { verifyAuthorizationHeader, verifyFirebaseAuthorizationHeader } from './_lib/auth.js';
import { PLAN_OPTIONS } from './_lib/constants.js';
import {
  createPlan,
  deletePlan,
  getClientProfile,
  getPlanAttendances,
  listAppointments,
  listBlockedPeriods,
  listPlans,
  updatePlan,
  upsertCompletedPlan,
} from './_lib/firestore.js';
import { getCurrentReportMonthKey } from './_lib/reports.js';
import { methodNotAllowed, sendJson } from './_lib/response.js';
import { normalizePhone, validatePlanPayload } from './_lib/validation.js';
import { sendPlanDatesWhatsAppNotification } from './_lib/whatsapp.js';

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function buildChecklist(limit, attendances = []) {
  return Array.from({ length: limit }, (_, index) => ({
    id: String(index + 1),
    label: `${index + 1}º atendimento`,
    date: String(attendances[index]?.date || '').trim(),
    time: String(attendances[index]?.time || '').trim(),
    done: false,
    doneAt: '',
    reminderSentAt: '',
  }));
}

function appendAttendancesToChecklist(checklist = [], attendances = []) {
  const nextChecklist = checklist.map((item) => ({ ...item }));
  let attendanceIndex = 0;

  for (let index = 0; index < nextChecklist.length && attendanceIndex < attendances.length; index += 1) {
    if (nextChecklist[index].date || nextChecklist[index].time) {
      continue;
    }

    nextChecklist[index] = {
      ...nextChecklist[index],
      date: String(attendances[attendanceIndex].date || '').trim(),
      time: String(attendances[attendanceIndex].time || '').trim(),
    };
    attendanceIndex += 1;
  }

  return {
    checklist: nextChecklist,
    addedCount: attendanceIndex,
  };
}

function getQueryValue(request, key) {
  const value = request.query?.[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

async function notifyBarber(appointment) {
  try {
    const delivery = await sendPlanDatesWhatsAppNotification(appointment);

    if (!delivery.sent) {
      console.warn('Notificacao de WhatsApp do plano ignorada: provedor nao configurado.');
    }

    return delivery;
  } catch (error) {
    console.error('Falha ao enviar notificacao de WhatsApp do plano:', error);
    return { sent: false, error: error.message || 'Falha ao enviar WhatsApp.' };
  }
}

function publicClientPlan(plan) {
  return {
    id: plan.id,
    uid: plan.uid,
    nome: plan.nome,
    telefone: plan.telefone,
    planoOpcao: plan.planoOpcao,
    plano: plan.plano,
    servico: plan.servico,
    preco: plan.preco,
    limite: plan.limite,
    assinaturaEm: plan.assinaturaEm,
    expiraEm: plan.expiraEm,
    observacao: plan.observacao,
    checklist: plan.checklist,
    status: plan.status,
    criadoEm: plan.criadoEm,
  };
}

async function listAdminPlans(response) {
  try {
    const plans = await listPlans();
    plans.sort((first, second) =>
      `${first.expiraEm} ${first.nome}`.localeCompare(`${second.expiraEm} ${second.nome}`),
    );

    return sendJson(response, 200, {
      plans,
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível carregar os planos.',
    });
  }
}

async function listClientPlans(request, response) {
  try {
    const user = await verifyFirebaseAuthorizationHeader(request.headers.authorization || '');

    if (!user) {
      return sendJson(response, 401, {
        message: 'Entre na sua conta para ver seus planos.',
      });
    }

    const plans = await listPlans();
    const userPlans = plans
      .filter((plan) => plan.uid === user.uid)
      .sort((first, second) =>
        `${second.criadoEm} ${second.id}`.localeCompare(`${first.criadoEm} ${first.id}`),
      );

    return sendJson(response, 200, {
      plans: userPlans.map(publicClientPlan),
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível carregar seus planos.',
    });
  }
}

async function createClientPlan(request, response) {
  try {
    const user = await verifyFirebaseAuthorizationHeader(request.headers.authorization || '');

    if (!user) {
      return sendJson(response, 401, {
        message: 'Para assinar um plano, crie uma conta.',
      });
    }

    const validationError = validatePlanPayload(request.body);

    if (validationError) {
      return sendJson(response, 400, {
        message: validationError,
      });
    }

    const option = PLAN_OPTIONS[request.body.planoOpcao];
    const now = new Date();
    const attendances = Array.isArray(request.body.atendimentos) ? request.body.atendimentos : [];
    const [profile, appointments, blockedPeriods, plans] = await Promise.all([
      getClientProfile(user.uid),
      listAppointments(),
      listBlockedPeriods(),
      listPlans(),
    ]);
    const activeDuplicate = plans.find((plan) =>
      plan.uid === user.uid &&
      plan.planoOpcao === option.id &&
      plan.checklist.some((item) => !item.done)
    );

    const occupiedSlots = new Set([
      ...appointments.map((appointment) => `${appointment.data} ${appointment.horario}`),
      ...getPlanAttendances(plans)
        .filter((attendance) => !attendance.done)
        .map((attendance) => `${attendance.data} ${attendance.horario}`),
    ]);
    const blockedDates = new Set(
      blockedPeriods.filter((item) => !item.time).map((item) => item.date),
    );
    const blockedSlots = new Set(
      blockedPeriods.filter((item) => item.time).map((item) => `${item.date} ${item.time}`),
    );

    for (const attendance of attendances) {
      const slotKey = `${attendance.date} ${attendance.time}`;

      if (
        occupiedSlots.has(slotKey) ||
        blockedDates.has(attendance.date) ||
        blockedSlots.has(slotKey)
      ) {
        return sendJson(response, 409, {
          message: 'Um dos horários do plano acabou de ficar indisponível. Escolha outro horário.',
        });
      }
    }

    if (activeDuplicate) {
      const openSlots = activeDuplicate.checklist.filter((item) => !item.date && !item.time).length;

      if (openSlots < attendances.length) {
        return sendJson(response, 409, {
          message: 'Este plano já está com todas as datas escolhidas.',
        });
      }

      const merged = appendAttendancesToChecklist(activeDuplicate.checklist, attendances);

      if (merged.addedCount === 0) {
        return sendJson(response, 400, {
          message: 'Escolha ao menos uma nova data para o plano.',
        });
      }

      await updatePlan(activeDuplicate.id, {
        uid: activeDuplicate.uid,
        clientEmail: activeDuplicate.clientEmail,
        nome: activeDuplicate.nome,
        telefone: activeDuplicate.telefone,
        planoOpcao: activeDuplicate.planoOpcao,
        plano: activeDuplicate.plano,
        servico: activeDuplicate.servico,
        preco: activeDuplicate.preco,
        limite: activeDuplicate.limite,
        assinaturaEm: activeDuplicate.assinaturaEm,
        expiraEm: activeDuplicate.expiraEm,
        observacao: activeDuplicate.observacao,
        checklist: JSON.stringify(merged.checklist),
        status: activeDuplicate.status || 'ativo',
        criadoEm: activeDuplicate.criadoEm,
      });

      const newItems = merged.checklist.filter((item) =>
        attendances.some((attendance) =>
          attendance.date === item.date && attendance.time === item.time,
        ),
      );
      const whatsapp = await notifyBarber({
        id: activeDuplicate.id,
        name: activeDuplicate.nome,
        plan: option.plano.replace('Plano ', ''),
        dates: newItems.map((item) => ({
          label: item.label,
          date: item.date,
          time: item.time,
        })),
      });

      return sendJson(response, 200, {
        id: activeDuplicate.id,
        whatsapp,
        attendances: newItems.map((item) => ({
          id: item.id,
          date: item.date,
          time: item.time,
        })),
        message: 'Novas datas adicionadas ao seu plano mensal.',
      });
    }

    const assinaturaEm = String(request.body.dataInicio || attendances[0]?.date || '')
      .trim() || now.toISOString().slice(0, 10);
    const clientName = String(request.body.nome || profile?.fullName || user.name || '').trim();
    const clientPhone = normalizePhone(String(request.body.telefone || profile?.phone || ''));
    const payload = {
      uid: user.uid,
      clientEmail: user.email || profile?.email || '',
      nome: clientName,
      telefone: clientPhone,
      planoOpcao: option.id,
      plano: option.plano,
      servico: option.servico,
      preco: option.preco,
      limite: option.limite,
      assinaturaEm,
      expiraEm: addDays(new Date(`${assinaturaEm}T00:00:00`), 30),
      observacao: String(request.body.observacao || '').trim(),
      checklist: JSON.stringify(buildChecklist(option.limite, attendances)),
      status: 'ativo',
      criadoEm: now.toISOString(),
    };

    const id = await createPlan(payload);
    const whatsapp = await notifyBarber({
      id,
      name: clientName,
      plan: option.plano.replace('Plano ', ''),
      dates: buildChecklist(option.limite, attendances)
        .filter((item) => item.date)
        .map((item) => ({
          label: item.label,
          date: item.date,
          time: item.time,
        })),
    });

    return sendJson(response, 201, {
      id,
      whatsapp,
      attendances: buildChecklist(option.limite, attendances).map((item) => ({
        id: item.id,
        date: item.date,
        time: item.time,
      })),
      message: 'Plano mensal criado com sucesso.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível criar o plano.',
    });
  }
}

async function updateAdminPlan(request, response, id) {
  if (!id) {
    return sendJson(response, 400, {
      message: 'Identificador do plano não informado.',
    });
  }

  try {
    if (request.method === 'DELETE') {
      await deletePlan(id);
      return sendJson(response, 200, {
        message: 'Plano removido com sucesso.',
      });
    }

    const itemId = String(request.body?.itemId || '').trim();
    const plans = await listPlans();
    const plan = plans.find((item) => item.id === id);

    if (!plan) {
      return sendJson(response, 404, {
        message: 'Plano não encontrado.',
      });
    }

    const checklist = plan.checklist.map((item) =>
      item.id === itemId
        ? { ...item, done: true, doneAt: new Date().toISOString() }
        : item,
    );

    if (!checklist.some((item) => item.id === itemId)) {
      return sendJson(response, 400, {
        message: 'Item do checklist não encontrado.',
      });
    }

    if (checklist.every((item) => item.done)) {
      const now = new Date().toISOString();
      await upsertCompletedPlan({
        id,
        planId: id,
        nome: plan.nome,
        planoOpcao: plan.planoOpcao,
        plano: plan.plano,
        servico: plan.servico,
        preco: plan.preco,
        limite: plan.limite,
        atendimentosConcluidos: checklist.filter((item) => item.done).length,
        concluidoEm: now,
        criadoEm: now,
        reportMonth: getCurrentReportMonthKey(new Date(now)),
      });
      await deletePlan(id);
      return sendJson(response, 200, {
        deleted: true,
        message: 'Todos os atendimentos do plano foram concluídos e enviados ao relatório mensal.',
      });
    }

    await updatePlan(id, {
      nome: plan.nome,
      uid: plan.uid,
      clientEmail: plan.clientEmail,
      telefone: plan.telefone,
      planoOpcao: plan.planoOpcao,
      plano: plan.plano,
      servico: plan.servico,
      preco: plan.preco,
      limite: plan.limite,
      assinaturaEm: plan.assinaturaEm,
      expiraEm: plan.expiraEm,
      observacao: plan.observacao,
      checklist: JSON.stringify(checklist),
      status: plan.status || 'ativo',
      criadoEm: plan.criadoEm,
    });

    return sendJson(response, 200, {
      message: 'Atendimento do plano marcado como concluído.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível atualizar o plano.',
    });
  }
}

export default async function handler(request, response) {
  const id = getQueryValue(request, 'id');
  const mine = getQueryValue(request, 'mine');

  if (request.method === 'GET' && mine === '1') {
    return listClientPlans(request, response);
  }

  if (id || request.method === 'GET') {
    if (!verifyAuthorizationHeader(request.headers.authorization || '')) {
      return sendJson(response, 401, {
        message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
      });
    }
  }

  if (id) {
    if (!['DELETE', 'PATCH'].includes(request.method)) {
      return methodNotAllowed(response);
    }

    return updateAdminPlan(request, response, id);
  }

  if (request.method === 'GET') {
    return listAdminPlans(response);
  }

  if (request.method === 'POST') {
    return createClientPlan(request, response);
  }

  return methodNotAllowed(response);
}

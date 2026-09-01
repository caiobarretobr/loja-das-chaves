import { verifyAuthorizationHeader, verifyFirebaseAuthorizationHeader } from '../server/lib/auth.js';
import { SERVICES } from '../server/lib/constants.js';
import {
  createAppointment,
  createCanceledService,
  createFinishedService,
  deleteAppointment,
  getPlanAttendances,
  listAppointments,
  listBlockedPeriods,
  listPlans,
  updateAppointment,
} from '../server/lib/firestore.js';
import { getCurrentReportMonthKey } from '../server/lib/reports.js';
import { methodNotAllowed, sendJson } from '../server/lib/response.js';
import { normalizePhone, validateAppointmentPayload } from '../server/lib/validation.js';
import { sendBarberWhatsAppNotification } from '../server/lib/whatsapp.js';

function getQueryValue(request, key) {
  const value = request.query?.[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

async function notifyBarber(appointment) {
  try {
    const delivery = await sendBarberWhatsAppNotification(appointment);

    if (!delivery.sent) {
      console.warn('Notificacao de WhatsApp ignorada: provedor nao configurado.');
    }

    return delivery;
  } catch (error) {
    console.error('Falha ao enviar notificacao de WhatsApp:', error);
    return { sent: false, error: error.message || 'Falha ao enviar WhatsApp.' };
  }
}

function getAppointmentConflictData(appointments = [], blockedPeriods = [], plans = [], appointmentId = '', targetDate = '', targetTime = '') {
  const occupiedItems = [
    ...appointments.filter((item) => item.id !== appointmentId),
    ...getPlanAttendances(plans).filter((item) => !item.done),
  ];
  const hasConflict = occupiedItems.some(
    (item) => item.data === targetDate && item.horario === targetTime,
  );
  const hasBlockedDate = blockedPeriods.some(
    (item) => item.date === targetDate && !item.time,
  );
  const hasBlockedTime = blockedPeriods.some(
    (item) => item.date === targetDate && item.time === targetTime,
  );

  return {
    hasConflict,
    hasBlockedDate,
    hasBlockedTime,
  };
}

async function listAdminAppointments(request, response) {
  if (!verifyAuthorizationHeader(request.headers.authorization || '')) {
    return sendJson(response, 401, {
      message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
    });
  }

  try {
    const appointments = await listAppointments();
    appointments.sort((first, second) =>
      `${first.data} ${first.horario}`.localeCompare(`${second.data} ${second.horario}`),
    );

    return sendJson(response, 200, {
      appointments,
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível carregar a agenda.',
    });
  }
}

async function createClientAppointment(request, response) {
  try {
    const validationError = validateAppointmentPayload(request.body);

    if (validationError) {
      return sendJson(response, 400, {
        message: validationError,
      });
    }

    const user = await verifyFirebaseAuthorizationHeader(request.headers.authorization || '')
      .catch(() => null);
    const [appointments, blockedPeriods, plans] = await Promise.all([
      listAppointments(),
      listBlockedPeriods(),
      listPlans(),
    ]);
    const occupiedItems = [
      ...appointments,
      ...getPlanAttendances(plans).filter((item) => !item.done),
    ];
    const hasConflict = occupiedItems.some(
      (item) =>
        item.data === request.body.data &&
        item.horario === request.body.horario,
    );
    const hasBlockedDate = blockedPeriods.some(
      (item) => item.date === request.body.data && !item.time,
    );
    const hasBlockedTime = blockedPeriods.some(
      (item) =>
        item.date === request.body.data &&
        item.time === request.body.horario,
    );

    if (hasConflict) {
      return sendJson(response, 409, {
        message: 'Esse horário acabou de ser reservado. Escolha outro para continuar.',
      });
    }

    if (hasBlockedDate || hasBlockedTime) {
      return sendJson(response, 409, {
        message: 'Esse horário foi fechado pela loja. Escolha outra data ou horário.',
      });
    }

    const service = SERVICES[request.body.servico];
    const payload = {
      uid: user?.uid || '',
      clientEmail: user?.email || '',
      nome: String(request.body.nome || '').trim(),
      telefone: normalizePhone(String(request.body.telefone || '')),
      servico: service.id,
      servicoNome: service.nome,
      categoria: service.categoria,
      data: String(request.body.data || '').trim(),
      horario: String(request.body.horario || '').trim(),
      observacao: String(request.body.observacao || '').trim(),
      preco: service.preco,
      criadoEm: new Date().toISOString(),
    };

    const id = await createAppointment(payload);
    const whatsapp = await notifyBarber({ id, ...payload });

    return sendJson(response, 201, {
      id,
      whatsapp,
      message: 'Agendamento criado com sucesso.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível criar o agendamento.',
    });
  }
}

async function updateAdminAppointment(request, response, id) {
  if (!verifyAuthorizationHeader(request.headers.authorization || '')) {
    return sendJson(response, 401, {
      message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
    });
  }

  if (!id) {
    return sendJson(response, 400, {
      message: 'Identificador do agendamento não informado.',
    });
  }

  try {
    const appointments = await listAppointments();
    const appointment = appointments.find((item) => item.id === id);

    if (!appointment) {
      return sendJson(response, 404, {
        message: 'Agendamento não encontrado.',
      });
    }

    if (request.method === 'PATCH') {
      if (request.body?.action === 'reschedule') {
        const nextDate = String(request.body?.data || '').trim();
        const nextTime = String(request.body?.horario || '').trim();

        if (!nextDate || !nextTime) {
          return sendJson(response, 400, {
            message: 'Escolha uma nova data e um novo horário.',
          });
        }

        const [blockedPeriods, plans] = await Promise.all([
          listBlockedPeriods(),
          listPlans(),
        ]);
        const conflictData = getAppointmentConflictData(
          appointments,
          blockedPeriods,
          plans,
          id,
          nextDate,
          nextTime,
        );

        if (conflictData.hasConflict) {
          return sendJson(response, 409, {
            message: 'Esse horário acabou de ser reservado. Escolha outro para continuar.',
          });
        }

        if (conflictData.hasBlockedDate || conflictData.hasBlockedTime) {
          return sendJson(response, 409, {
            message: 'Esse horário foi fechado pela loja. Escolha outra data ou horário.',
          });
        }

        await updateAppointment(id, {
          uid: appointment.uid,
          clientEmail: appointment.clientEmail,
          nome: appointment.nome,
          telefone: appointment.telefone,
          servico: appointment.servico,
          data: nextDate,
          horario: nextTime,
          observacao: appointment.observacao,
          preco: appointment.preco,
          criadoEm: appointment.criadoEm,
          lembreteEnviadoEm: appointment.lembreteEnviadoEm || '',
          clienteLembreteCanal: appointment.clienteLembreteCanal || '',
          ultimoErroLembrete: appointment.ultimoErroLembrete || '',
        });

        return sendJson(response, 200, {
          message: 'Data do atendimento atualizada com sucesso.',
        });
      }

      const now = new Date().toISOString();
      await createFinishedService({
        id,
        appointmentId: id,
        nome: appointment.nome,
        servico: appointment.servico,
        data: appointment.data,
        horario: appointment.horario,
        preco: appointment.preco,
        finalizadoEm: now,
        reportMonth: getCurrentReportMonthKey(new Date(now)),
      });
      await deleteAppointment(id);

      return sendJson(response, 200, {
        message: 'Atendimento finalizado e enviado para o relatório mensal.',
      });
    }

    const now = new Date().toISOString();
    await createCanceledService({
      id,
      appointmentId: id,
      nome: appointment.nome,
      servico: appointment.servico,
      data: appointment.data,
      horario: appointment.horario,
      preco: appointment.preco,
      canceladoEm: now,
      reportMonth: getCurrentReportMonthKey(new Date(now)),
    });
    await deleteAppointment(id);

    return sendJson(response, 200, {
      message: 'Atendimento cancelado e removido da agenda.',
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível atualizar o agendamento.',
    });
  }
}

export default async function handler(request, response) {
  const id = getQueryValue(request, 'id');

  if (id) {
    if (!['DELETE', 'PATCH'].includes(request.method)) {
      return methodNotAllowed(response);
    }

    return updateAdminAppointment(request, response, id);
  }

  if (request.method === 'GET') {
    return listAdminAppointments(request, response);
  }

  if (request.method === 'POST') {
    return createClientAppointment(request, response);
  }

  return methodNotAllowed(response);
}

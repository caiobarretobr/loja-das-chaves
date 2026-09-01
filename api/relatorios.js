import { verifyAuthorizationHeader } from '../server/lib/auth.js';
import {
  deleteCanceledService,
  deleteCompletedPlan,
  deleteFinishedService,
  listCanceledServices,
  listCompletedPlans,
  listFinishedServices,
} from '../server/lib/firestore.js';
import { buildMonthlyReports } from '../server/lib/reports.js';
import { methodNotAllowed, sendJson } from '../server/lib/response.js';

function getQueryValue(request, key) {
  const value = request.query?.[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

async function listMonthlyReports(response) {
  try {
    const [finishedServices, canceledServices, completedPlans] = await Promise.all([
      listFinishedServices(),
      listCanceledServices(),
      listCompletedPlans(),
    ]);

    return sendJson(
      response,
      200,
      buildMonthlyReports(finishedServices, canceledServices, completedPlans),
    );
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível carregar os relatórios.',
    });
  }
}

async function deleteMonthlyReport(response, month) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return sendJson(response, 400, {
      message: 'Mês do relatório inválido.',
    });
  }

  try {
    const [finishedServices, canceledServices, completedPlans] = await Promise.all([
      listFinishedServices(),
      listCanceledServices(),
      listCompletedPlans(),
    ]);
    const matchingFinished = finishedServices.filter((item) => item.reportMonth === month);
    const matchingCanceled = canceledServices.filter((item) => item.reportMonth === month);
    const matchingPlans = completedPlans.filter((item) => item.reportMonth === month);

    await Promise.all([
      ...matchingFinished.map((item) => deleteFinishedService(item.id)),
      ...matchingCanceled.map((item) => deleteCanceledService(item.id)),
      ...matchingPlans.map((item) => deleteCompletedPlan(item.id)),
    ]);

    return sendJson(response, 200, {
      message: 'Relatório mensal deletado com sucesso.',
      deleted: matchingFinished.length + matchingCanceled.length + matchingPlans.length,
    });
  } catch (error) {
    return sendJson(response, 500, {
      message: error.message || 'Não foi possível deletar o relatório mensal.',
    });
  }
}

export default async function handler(request, response) {
  if (!verifyAuthorizationHeader(request.headers.authorization || '')) {
    return sendJson(response, 401, {
      message: 'Sua sessão administrativa expirou. Entre novamente para continuar.',
    });
  }

  const month = getQueryValue(request, 'month');

  if (month) {
    if (request.method !== 'DELETE') {
      return methodNotAllowed(response);
    }

    return deleteMonthlyReport(response, month);
  }

  if (request.method === 'GET') {
    return listMonthlyReports(response);
  }

  return methodNotAllowed(response);
}

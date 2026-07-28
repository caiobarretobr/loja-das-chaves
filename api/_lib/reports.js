const REPORT_TIME_ZONE = 'America/Recife';

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function getRecifeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function previousMonthKey(year, month) {
  const previous = new Date(Date.UTC(Number(year), Number(month) - 2, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentReportMonthKey(date = new Date()) {
  const parts = getRecifeParts(date);

  if (parts.day === '01' && Number(parts.hour) < 8) {
    return previousMonthKey(parts.year, parts.month);
  }

  return `${parts.year}-${parts.month}`;
}

export function getMonthLabel(monthKey = '') {
  const [year, month] = monthKey.split('-');
  const monthIndex = Number(month) - 1;

  if (!year || monthIndex < 0 || monthIndex > 11) {
    return monthKey;
  }

  return `${MONTH_LABELS[monthIndex]} de ${year}`;
}

function sortReportItems(first, second) {
  return `${first.data} ${first.horario}`.localeCompare(`${second.data} ${second.horario}`);
}

function sortCompletedPlans(first, second) {
  return `${first.concluidoEm} ${first.nome}`.localeCompare(`${second.concluidoEm} ${second.nome}`);
}

function buildReport(monthKey, finishedServices, canceledServices, completedPlans) {
  const finished = finishedServices
    .filter((item) => item.reportMonth === monthKey)
    .sort(sortReportItems);
  const canceled = canceledServices
    .filter((item) => item.reportMonth === monthKey)
    .sort(sortReportItems);
  const plans = completedPlans
    .filter((item) => item.reportMonth === monthKey)
    .sort(sortCompletedPlans);

  return {
    monthKey,
    label: getMonthLabel(monthKey),
    finishedServices: finished,
    completedPlans: plans,
    canceledServices: canceled,
    total:
      finished.reduce((sum, item) => sum + Number(item.preco || 0), 0) +
      plans.reduce((sum, item) => sum + Number(item.preco || 0), 0),
  };
}

export function buildMonthlyReports(
  finishedServices,
  canceledServices,
  completedPlans = [],
  now = new Date(),
) {
  const currentMonthKey = getCurrentReportMonthKey(now);
  const monthKeys = new Set([
    ...finishedServices.map((item) => item.reportMonth),
    ...canceledServices.map((item) => item.reportMonth),
    ...completedPlans.map((item) => item.reportMonth),
  ]);
  const current = buildReport(currentMonthKey, finishedServices, canceledServices, completedPlans);
  const pastReports = [...monthKeys]
    .filter((monthKey) => monthKey && monthKey !== currentMonthKey)
    .sort((first, second) => second.localeCompare(first))
    .map((monthKey) => buildReport(monthKey, finishedServices, canceledServices, completedPlans))
    .filter(
      (report) =>
        report.finishedServices.length > 0 ||
        report.completedPlans.length > 0 ||
        report.canceledServices.length > 0,
    );

  return {
    currentMonthKey,
    current,
    pastReports,
  };
}

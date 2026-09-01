import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import UpdateRoundedIcon from '@mui/icons-material/UpdateRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTranslation } from 'react-i18next';
import { SERVICES, TIME_SLOTS, getTimeSlotsForDate } from '../../shared/constants/schedule';
import { formatFullDate, sortAppointments } from '../../shared/utils/formatters';
import {
  cancelAppointment,
  clearAdminToken,
  completeAppointment,
  completePlanChecklistItem,
  createBlockedPeriod,
  deleteMonthlyReport,
  fetchAdminAppointments,
  fetchAdminPlans,
  fetchBlockedPeriods,
  fetchMonthlyReports,
  getAdminToken,
  loginAdmin,
  removeBlockedPeriod,
  removePlan,
  rescheduleAppointment,
  reschedulePlanAttendance,
} from '../services/adminApi';

function currency(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

function getServiceName(serviceId) {
  const service = SERVICES.find((item) => item.id === serviceId);
  return service ? service.name : serviceId;
}

function getReportFileName(report) {
  return `relatorio-${report.monthKey}.pdf`;
}

function getCompletedPlans(report) {
  return Array.isArray(report?.completedPlans) ? report.completedPlans : [];
}

function formatCompletedPlan(item) {
  return `${item.plano}${item.servico ? ` - ${item.servico}` : ''}`;
}

function isEconomicPlan(optionId = '') {
  return optionId.startsWith('economico-');
}

function isEconomicAllowedDate(date = '') {
  const parsed = new Date(`${date}T00:00:00-03:00`);
  return !Number.isNaN(parsed.getTime()) && [1, 2, 3].includes(parsed.getDay());
}

function isFutureAttendance(date = '', time = '') {
  const parsed = new Date(`${date}T${time}:00-03:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
}

function buildClientWhatsAppUrl(phone = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  const nationalNumber = digits.startsWith('55') ? digits : `55${digits}`;

  return `https://wa.me/${nationalNumber}`;
}

async function imageToDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadReportPdf(report) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  const margin = 14;
  let y = 16;

  try {
    const logo = await imageToDataUrl('/favicon.jpeg');
    pdf.addImage(logo, 'JPEG', margin, y, 36, 22);
  } catch {
    pdf.setFontSize(14);
    pdf.text('Loja das Chaves', margin, y + 8);
  }

  pdf.setFontSize(16);
  pdf.text('Relatório mensal - Loja das Chaves', margin + 44, y + 8);
  pdf.setFontSize(11);
  pdf.text(report.label, margin + 44, y + 16);
  y += 34;

  pdf.setFontSize(13);
  pdf.text('Atendimentos finalizados', margin, y);
  y += 8;
  pdf.setFontSize(10);

  if (report.finishedServices.length === 0) {
    pdf.text('Nenhum atendimento finalizado neste mês.', margin, y);
    y += 8;
  } else {
    report.finishedServices.forEach((item) => {
      const line = `${item.nome} | ${getServiceName(item.servico)} | ${item.data} ${item.horario} | ${currency(item.preco)}`;
      const lines = pdf.splitTextToSize(line, 180);
      pdf.text(lines, margin, y);
      y += lines.length * 6;

      if (y > 270) {
        pdf.addPage();
        y = 16;
      }
    });
  }

  y += 6;
  pdf.setFontSize(13);
  pdf.text('Planos concluídos', margin, y);
  y += 8;
  pdf.setFontSize(10);

  const completedPlans = getCompletedPlans(report);

  if (completedPlans.length === 0) {
    pdf.text('Nenhum plano concluído neste mês.', margin, y);
    y += 8;
  } else {
    completedPlans.forEach((item) => {
      const line = `${item.nome} | ${formatCompletedPlan(item)} | ${item.atendimentosConcluidos}/${item.limite} atendimentos | ${currency(item.preco)}`;
      const lines = pdf.splitTextToSize(line, 180);
      pdf.text(lines, margin, y);
      y += lines.length * 6;

      if (y > 270) {
        pdf.addPage();
        y = 16;
      }
    });
  }

  y += 6;
  pdf.setFontSize(13);
  pdf.text(`Total do mês: ${currency(report.total)}`, margin, y);
  y += 12;
  pdf.text('Cancelados / no-show (sem receita)', margin, y);
  y += 8;
  pdf.setFontSize(10);

  if (report.canceledServices.length === 0) {
    pdf.text('Nenhum atendimento cancelado neste mês.', margin, y);
  } else {
    report.canceledServices.forEach((item) => {
      const line = `${item.nome} | ${getServiceName(item.servico)} | ${item.data} ${item.horario}`;
      const lines = pdf.splitTextToSize(line, 180);
      pdf.text(lines, margin, y);
      y += lines.length * 6;

      if (y > 270) {
        pdf.addPage();
        y = 16;
      }
    });
  }

  pdf.save(getReportFileName(report));
}

function ReportDetails({ report, emptyText }) {
  if (!report) {
    return null;
  }

  const completedPlans = getCompletedPlans(report);
  const isEmpty =
    report.finishedServices.length === 0 &&
    completedPlans.length === 0 &&
    report.canceledServices.length === 0;

  if (isEmpty) {
    return (
      <Typography sx={{ p: 2 }} color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <List disablePadding>
        {report.finishedServices.map((item, index) => (
          <div key={item.id}>
            <ListItem sx={{ py: 1.6, alignItems: 'flex-start' }}>
              <ListItemText
                primary={<Typography fontWeight={800}>{item.nome}</Typography>}
                secondary={(
                  <Stack spacing={0.5} mt={0.8}>
                    <Typography variant="body2">{getServiceName(item.servico)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFullDate(item.data)} às {item.horario}
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      {currency(item.preco)}
                    </Typography>
                  </Stack>
                )}
              />
            </ListItem>
            {index < report.finishedServices.length - 1 ? <Divider component="li" /> : null}
          </div>
        ))}
      </List>

      <Box>
        <Typography variant="subtitle1" fontWeight={800} px={2} pb={1}>
          Planos concluídos
        </Typography>
        {completedPlans.length === 0 ? (
          <Typography sx={{ px: 2, pb: 1 }} color="text.secondary">
            Nenhum plano concluído neste mês.
          </Typography>
        ) : (
          <List disablePadding>
            {completedPlans.map((item, index) => (
              <div key={item.id}>
                <ListItem sx={{ py: 1.4, alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={(
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={800}>{item.nome}</Typography>
                        <Chip size="small" color="secondary" label="Plano concluído" />
                      </Stack>
                    )}
                    secondary={(
                      <Stack spacing={0.5} mt={0.8}>
                        <Typography variant="body2">{formatCompletedPlan(item)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Atendimentos concluídos: {item.atendimentosConcluidos} de {item.limite}
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {currency(item.preco)}
                        </Typography>
                      </Stack>
                    )}
                  />
                </ListItem>
                {index < completedPlans.length - 1 ? <Divider component="li" /> : null}
              </div>
            ))}
          </List>
        )}
      </Box>

      <Alert severity="success">Total de receita: {currency(report.total)}</Alert>

      <Box>
        <Typography variant="subtitle1" fontWeight={800} px={2} pb={1}>
          Cancelados / no-show
        </Typography>
        {report.canceledServices.length === 0 ? (
          <Typography sx={{ px: 2, pb: 1 }} color="text.secondary">
            Nenhum atendimento cancelado neste mês.
          </Typography>
        ) : (
          <List disablePadding>
            {report.canceledServices.map((item, index) => (
              <div key={item.id}>
                <ListItem sx={{ py: 1.4 }}>
                  <ListItemText
                    primary={<Typography fontWeight={800}>{item.nome}</Typography>}
                    secondary={`${getServiceName(item.servico)} - ${formatFullDate(item.data)} às ${item.horario}`}
                  />
                </ListItem>
                {index < report.canceledServices.length - 1 ? <Divider component="li" /> : null}
              </div>
            ))}
          </List>
        )}
      </Box>
    </Stack>
  );
}

function AdminPanel({ open, onClose, onDataChanged, availability }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [blockedPeriods, setBlockedPeriods] = useState([]);
  const [reports, setReports] = useState({
    current: { finishedServices: [], canceledServices: [], total: 0 },
    pastReports: [],
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [authenticated, setAuthenticated] = useState(Boolean(getAdminToken()));
  const [finishingId, setFinishingId] = useState('');
  const [cancelingId, setCancelingId] = useState('');
  const [updatingPlanItem, setUpdatingPlanItem] = useState('');
  const [editingAppointmentId, setEditingAppointmentId] = useState('');
  const [editingAppointmentData, setEditingAppointmentData] = useState({
    date: '',
    time: '',
    originalDate: '',
    originalTime: '',
  });
  const [editingPlanAttendance, setEditingPlanAttendance] = useState(null);
  const [removingPlanId, setRemovingPlanId] = useState('');
  const [reopeningId, setReopeningId] = useState('');
  const [deletingReportMonth, setDeletingReportMonth] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);
  const [reportMode, setReportMode] = useState('current');
  const [selectedPastMonth, setSelectedPastMonth] = useState('');
  const [blockForm, setBlockForm] = useState({
    date: '',
    time: '',
  });

  const blockedCount = t('adminBlockedCount', { count: blockedPeriods.length });
  const appointmentCount = t('adminAppointmentCount', { count: appointments.length });
  const planCount = `${plans.length} ${plans.length === 1 ? 'plano mensal' : 'planos mensais'}`;
  const blockTimeSlots = useMemo(
    () => (blockForm.date ? getTimeSlotsForDate(blockForm.date) : TIME_SLOTS),
    [blockForm.date],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [appointmentsData, blockedPeriodsData, plansData, reportsData] = await Promise.all([
        fetchAdminAppointments(),
        fetchBlockedPeriods(),
        fetchAdminPlans(),
        fetchMonthlyReports(),
      ]);
      setAppointments(sortAppointments(appointmentsData.appointments || []));
      setPlans(plansData.plans || []);
      setReports({
        current: reportsData.current || {
          finishedServices: [],
          completedPlans: [],
          canceledServices: [],
          total: 0,
        },
        pastReports: reportsData.pastReports || [],
      });
      setSelectedPastMonth((current) => {
        const pastReports = reportsData.pastReports || [];
        return pastReports.some((report) => report.monthKey === current)
          ? current
          : pastReports[0]?.monthKey || '';
      });
      setBlockedPeriods(
        [...(blockedPeriodsData.blockedPeriods || [])].sort((first, second) =>
          `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`),
        ),
      );
      setAuthenticated(true);
    } catch (loadError) {
      const message = loadError.message || t('adminErrorFallback');
      setError(message);
      if (message === t('adminSessionExpired')) {
        clearAdminToken();
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open && authenticated) {
      const timerId = window.setTimeout(() => {
        loadDashboard();
      }, 0);

      return () => window.clearTimeout(timerId);
    }
  }, [open, authenticated, loadDashboard]);

  async function handleLogin() {
    setLoggingIn(true);
    setError('');

    try {
      await loginAdmin(password);
      setPassword('');
      setAuthenticated(true);
      await loadDashboard();
    } catch (loginError) {
      setError(loginError.message || t('adminLoginError'));
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setAuthenticated(false);
    setAppointments([]);
    setPlans([]);
    setBlockedPeriods([]);
    setReports({
      current: { finishedServices: [], completedPlans: [], canceledServices: [], total: 0 },
      pastReports: [],
    });
    setPassword('');
    setError('');
    setInfo('');
    setBlockForm({
      date: '',
      time: '',
    });
  }

  function startEditingAppointment(appointment) {
    setEditingAppointmentId(appointment.id);
    setEditingAppointmentData({
      date: appointment.data,
      time: appointment.horario,
      originalDate: appointment.data,
      originalTime: appointment.horario,
    });
    setError('');
    setInfo('');
  }

  function updateEditingAppointment(field, value) {
    setEditingAppointmentData((current) => ({
      ...current,
      [field]: value,
      ...(field === 'date' ? { time: '' } : {}),
    }));
    setError('');
    setInfo('');
  }

  async function saveEditedAppointment() {
    if (!editingAppointmentId) {
      return;
    }

    if (!editingAppointmentData.date || !editingAppointmentData.time) {
      setError('Escolha a nova data e o novo horário.');
      return;
    }

    try {
      await rescheduleAppointment(editingAppointmentId, {
        data: editingAppointmentData.date,
        horario: editingAppointmentData.time,
      });
      setInfo('Data do atendimento atualizada com sucesso.');
      setEditingAppointmentId('');
      setEditingAppointmentData({ date: '', time: '', originalDate: '', originalTime: '' });
      await loadDashboard();
      await onDataChanged?.();
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível atualizar a data do atendimento.');
    }
  }

  function startEditingPlanAttendance(plan, item) {
    setEditingPlanAttendance({
      planId: plan.id,
      itemId: item.id,
      date: item.date,
      time: item.time,
      originalDate: item.date,
      originalTime: item.time,
    });
    setError('');
    setInfo('');
  }

  function updateEditingPlanAttendance(field, value) {
    setEditingPlanAttendance((current) => ({
      ...current,
      [field]: value,
      ...(field === 'date' ? { time: '' } : {}),
    }));
    setError('');
    setInfo('');
  }

  async function saveEditedPlanAttendance() {
    if (!editingPlanAttendance?.planId || !editingPlanAttendance?.itemId) {
      return;
    }

    if (!editingPlanAttendance.date || !editingPlanAttendance.time) {
      setError('Escolha a nova data e o novo horário.');
      return;
    }

    try {
      await reschedulePlanAttendance(editingPlanAttendance.planId, editingPlanAttendance.itemId, {
        date: editingPlanAttendance.date,
        time: editingPlanAttendance.time,
      });
      setInfo('Data do plano atualizada com sucesso.');
      setEditingPlanAttendance(null);
      await loadDashboard();
      await onDataChanged?.();
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível atualizar a data do plano.');
    }
  }

  async function handleDelete(id) {
    setFinishingId(id);
    setError('');
    setInfo('');

    try {
      await completeAppointment(id);
      setInfo('Atendimento finalizado e enviado para o relatório mensal.');
      await loadDashboard();
      await onDataChanged();
    } catch (deleteError) {
      setError(deleteError.message || t('adminErrorFallback'));
    } finally {
      setFinishingId('');
    }
  }

  async function handleCancelAppointment(id) {
    setCancelingId(id);
    setError('');
    setInfo('');

    try {
      await cancelAppointment(id);
      setInfo('Atendimento cancelado e removido da agenda.');
      await loadDashboard();
      await onDataChanged();
    } catch (cancelError) {
      setError(cancelError.message || t('adminErrorFallback'));
    } finally {
      setCancelingId('');
    }
  }

  async function handleDeleteReport(monthKey) {
    const report = reports.pastReports.find((item) => item.monthKey === monthKey);
    const confirmed = window.confirm(`Deletar permanentemente o relatório de ${report?.label || monthKey}?`);

    if (!confirmed) {
      return;
    }

    setDeletingReportMonth(monthKey);
    setError('');
    setInfo('');

    try {
      await deleteMonthlyReport(monthKey);
      setInfo('Relatório mensal deletado com sucesso.');
      await loadDashboard();
    } catch (deleteError) {
      setError(deleteError.message || t('adminErrorFallback'));
    } finally {
      setDeletingReportMonth('');
    }
  }

  async function handleCompletePlanItem(planId, itemId) {
    setUpdatingPlanItem(`${planId}:${itemId}`);
    setError('');
    setInfo('');

    try {
      const data = await completePlanChecklistItem(planId, itemId);
      setInfo(data.message || 'Atendimento do plano marcado como concluído.');
      await loadDashboard();
    } catch (updateError) {
      setError(updateError.message || t('adminErrorFallback'));
    } finally {
      setUpdatingPlanItem('');
    }
  }

  async function handleRemovePlan(planId) {
    setRemovingPlanId(planId);
    setError('');
    setInfo('');

    try {
      const data = await removePlan(planId);
      setInfo(data.message || 'Plano removido com sucesso.');
      await loadDashboard();
    } catch (removeError) {
      setError(removeError.message || t('adminErrorFallback'));
    } finally {
      setRemovingPlanId('');
    }
  }

  async function handleCreateBlock() {
    if (!blockForm.date) {
      setError(t('adminBlockValidationDate'));
      return;
    }

    setSavingBlock(true);
    setError('');
    setInfo('');

    try {
      const data = await createBlockedPeriod(blockForm);
      setInfo(data.message || t('adminBlockedSuccess'));
      setBlockForm({
        date: '',
        time: '',
      });
      await loadDashboard();
      await onDataChanged();
    } catch (saveError) {
      setError(saveError.message || t('adminErrorFallback'));
    } finally {
      setSavingBlock(false);
    }
  }

  async function handleReopenBlock(id) {
    setReopeningId(id);
    setError('');
    setInfo('');

    try {
      const data = await removeBlockedPeriod(id);
      setInfo(data.message || t('adminUnblockSuccess'));
      await loadDashboard();
      await onDataChanged();
    } catch (removeError) {
      setError(removeError.message || t('adminErrorFallback'));
    } finally {
      setReopeningId('');
    }
  }

  const blockButtonLabel = useMemo(
    () => (blockForm.time ? t('adminBlockSubmitTime') : t('adminBlockSubmitDate')),
    [blockForm.time, t],
  );

  return (
    <Dialog fullScreen={fullScreen} fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle sx={{ pr: 7 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <VerifiedUserRoundedIcon color="secondary" />
            <Typography variant="h5">{t('adminPanelTitle')}</Typography>
          </Stack>
          <IconButton onClick={onClose} aria-label={t('closeButton')}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        {!authenticated ? (
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Typography color="text.secondary">{t('adminPanelDescription')}</Typography>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <TextField
                label={t('adminPassword')}
                placeholder={t('adminPasswordPlaceholder')}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
              />
              <Button
                variant="contained"
                onClick={handleLogin}
                disabled={!password.trim() || loggingIn}
              >
                {loggingIn ? t('adminLoginLoading') : t('adminLoginButton')}
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={2}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Stack spacing={1}>
                  <Typography variant="h5">{t('adminWelcome')}</Typography>
                  <Stack direction="column" spacing={1} alignItems="flex-start">
                    <Chip
                      icon={<EventAvailableRoundedIcon />}
                      color="secondary"
                      label={appointmentCount}
                    />
                    <Chip
                      icon={<BlockRoundedIcon />}
                      color="warning"
                      label={blockedCount}
                    />
                    <Chip
                      icon={<VerifiedUserRoundedIcon />}
                      color="primary"
                      label={planCount}
                    />
                  </Stack>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<UpdateRoundedIcon />}
                    onClick={loadDashboard}
                    disabled={loading}
                  >
                    {t('adminRefreshButton')}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<LogoutRoundedIcon />}
                    onClick={handleLogout}
                  >
                    {t('adminLogoutButton')}
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {info ? <Alert severity="success">{info}</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">{t('adminBlockSectionTitle')}</Typography>
                  <Typography color="text.secondary" mt={0.5}>
                    {t('adminBlockSectionText')}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label={t('adminBlockDateLabel')}
                    type="date"
                    value={blockForm.date}
                    onChange={(event) =>
                      setBlockForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                  <TextField
                    select
                    fullWidth
                    label={t('adminBlockTimeLabel')}
                    value={blockForm.time}
                    onChange={(event) =>
                      setBlockForm((current) => ({
                        ...current,
                        time: event.target.value,
                      }))}
                  >
                    <MenuItem value="">{t('adminBlockTimeAllDay')}</MenuItem>
                    {blockTimeSlots.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<BlockRoundedIcon />}
                  disabled={savingBlock}
                  onClick={handleCreateBlock}
                >
                  {savingBlock ? t('loadingText') : blockButtonLabel}
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: { xs: 1, md: 2 } }}>
              <Stack spacing={1} sx={{ px: 1, pt: 1 }}>
                <Typography variant="h6">{t('adminBlockedTitle')}</Typography>
                <Typography color="text.secondary">{t('adminBlockedDescription')}</Typography>
              </Stack>
              {loading ? (
                <Typography sx={{ p: 2 }}>{t('loadingText')}</Typography>
              ) : blockedPeriods.length === 0 ? (
                <Typography sx={{ p: 2 }} color="text.secondary">
                  {t('adminBlockedEmpty')}
                </Typography>
              ) : (
                <List disablePadding>
                  {blockedPeriods.map((blockedPeriod, index) => (
                    <div key={blockedPeriod.id}>
                      <ListItem
                        sx={{ py: 2, alignItems: 'flex-start' }}
                        secondaryAction={(
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<RestartAltRoundedIcon />}
                            disabled={reopeningId === blockedPeriod.id}
                            onClick={() => handleReopenBlock(blockedPeriod.id)}
                          >
                            {t('adminBlockedUndo')}
                          </Button>
                        )}
                      >
                        <ListItemText
                          primary={(
                            <Typography fontWeight={800}>
                              {formatFullDate(blockedPeriod.date)}
                            </Typography>
                          )}
                          secondary={(
                            <Stack spacing={0.6} mt={1} pr={{ xs: 0, md: 12 }}>
                              <Typography variant="body2" color="text.secondary">
                                {blockedPeriod.time || t('adminBlockTimeAllDay')}
                              </Typography>
                              <Chip
                                size="small"
                                color="warning"
                                sx={{ width: 'fit-content' }}
                                label={blockedPeriod.time
                                  ? t('adminSlotClosed')
                                  : t('adminDateClosed')}
                              />
                            </Stack>
                          )}
                        />
                      </ListItem>
                      {index < blockedPeriods.length - 1 ? <Divider component="li" /> : null}
                    </div>
                  ))}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: { xs: 1, md: 2 } }}>
              <Stack spacing={1} sx={{ px: 1, pt: 1 }}>
                <Typography variant="h6">{t('adminAppointmentsTitle')}</Typography>
              </Stack>
              {loading ? (
                <Typography sx={{ p: 2 }}>{t('loadingText')}</Typography>
              ) : appointments.length === 0 ? (
                <Stack spacing={1} sx={{ p: 2 }}>
                  <Typography variant="h6">{t('adminEmptyTitle')}</Typography>
                  <Typography color="text.secondary">{t('adminEmptyText')}</Typography>
                </Stack>
              ) : (
                <List disablePadding>
                  {appointments.map((appointment, index) => {
                    const service = SERVICES.find((item) => item.id === appointment.servico);
                    const isEditingAppointment = editingAppointmentId === appointment.id;
                    const canEditAppointment = Boolean(
                      appointment.data &&
                      appointment.horario &&
                      isFutureAttendance(appointment.data, appointment.horario),
                    );
                    const appointmentSlots = (availability?.slotsByDate?.[editingAppointmentData.date] || [])
                      .filter((slot) =>
                        slot.available || (
                          editingAppointmentData.originalDate === editingAppointmentData.date &&
                          editingAppointmentData.originalTime === slot.time
                        ),
                      );

                    return (
                      <div key={appointment.id}>
                        <ListItem
                          sx={{ py: 2, alignItems: 'flex-start' }}
                        >
                          <ListItemText
                            primary={(
                              <Stack spacing={0.7}>
                                <Typography fontWeight={800}>
                                  {appointment.nome}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatFullDate(appointment.data)} às {appointment.horario}
                                </Typography>
                              </Stack>
                            )}
                            secondary={(
                              <Stack spacing={0.7} mt={1.2}>
                                <Typography variant="body2">
                                  <strong>{t('adminClientService')}:</strong>{' '}
                                  {service ? service.name : appointment.servico}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>{t('bookingServicePriceLabel')}:</strong>{' '}
                                  {t('labelCurrency', { value: appointment.preco })}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>{t('adminClientPhone')}:</strong>{' '}
                                  {appointment.telefone || t('fieldOptional')}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>{t('adminClientNotes')}:</strong>{' '}
                                  {appointment.observacao || t('notesFallback')}
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} pt={1}>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircleRoundedIcon />}
                                    disabled={finishingId === appointment.id || cancelingId === appointment.id}
                                    onClick={() => handleDelete(appointment.id)}
                                  >
                                    {finishingId === appointment.id
                                      ? t('adminMarkLoading')
                                      : 'Finalizar pedido'}
                                  </Button>
                                  {appointment.telefone ? (
                                    <Button
                                      variant="outlined"
                                      startIcon={<WhatsAppIcon />}
                                      href={buildClientWhatsAppUrl(appointment.telefone)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Entrar em contato
                                    </Button>
                                  ) : null}
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelRoundedIcon />}
                                    disabled={finishingId === appointment.id || cancelingId === appointment.id}
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                  >
                                    {cancelingId === appointment.id
                                      ? t('adminMarkLoading')
                                      : 'Cancelar pedido'}
                                  </Button>
                                  {canEditAppointment && !isEditingAppointment ? (
                                    <Button
                                      variant="outlined"
                                      color="secondary"
                                      startIcon={<EditCalendarRoundedIcon />}
                                      disabled={finishingId === appointment.id || cancelingId === appointment.id}
                                      onClick={() => startEditingAppointment(appointment)}
                                    >
                                      Editar data
                                    </Button>
                                  ) : null}
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                  OBS: O botão notificar cliente serve para aqueles que fizeram o pedido de um produto
                                </Typography>
                                {isEditingAppointment ? (
                                  <Stack spacing={1.2} mt={1.2}>
                                    <Typography variant="body2" color="text.secondary">
                                      Escolha a nova data e horário para este atendimento.
                                    </Typography>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                                      <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Nova data"
                                        value={editingAppointmentData.date}
                                        onChange={(event) => updateEditingAppointment('date', event.target.value)}
                                      >
                                        {(availability?.dates || []).filter((item) => item.status !== 'blocked').map((item) => (
                                          <MenuItem key={item.date} value={item.date}>
                                            {formatFullDate(item.date)}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                      <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Novo horário"
                                        value={editingAppointmentData.time}
                                        onChange={(event) => updateEditingAppointment('time', event.target.value)}
                                      >
                                        {appointmentSlots.map((slot) => (
                                          <MenuItem key={slot.time} value={slot.time}>
                                            {slot.time}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                      <Button
                                        variant="contained"
                                        startIcon={<SaveRoundedIcon />}
                                        onClick={saveEditedAppointment}
                                      >
                                        Salvar nova data
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        onClick={() => {
                                          setEditingAppointmentId('');
                                          setEditingAppointmentData({ date: '', time: '', originalDate: '', originalTime: '' });
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                    </Stack>
                                  </Stack>
                                ) : null}
                              </Stack>
                            )}
                          />
                        </ListItem>
                        {index < appointments.length - 1 ? <Divider component="li" /> : null}
                      </div>
                    );
                  })}
                </List>
              )}
            </Paper>

            <Paper sx={{ p: { xs: 1, md: 2 } }}>
              <Stack spacing={1.5} sx={{ px: 1, pt: 1, pb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ReceiptLongRoundedIcon color="primary" />
                  <Typography variant="h6">Relatórios mensais</Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant={reportMode === 'current' ? 'contained' : 'outlined'}
                    onClick={() => setReportMode('current')}
                  >
                    Mês atual
                  </Button>
                  <Button
                    variant={reportMode === 'past' ? 'contained' : 'outlined'}
                    onClick={() => setReportMode('past')}
                  >
                    Meses passados
                  </Button>
                </Stack>
              </Stack>

              {reportMode === 'current' ? (
                <Stack spacing={1.5} sx={{ px: 1, pb: 1 }}>
                  <Typography fontWeight={800}>
                    {reports.current?.label || 'Mês atual'}
                  </Typography>
                  <ReportDetails
                    report={reports.current}
                    emptyText="À espera de clientes satisfeitos"
                  />
                </Stack>
              ) : reports.pastReports.length === 0 ? (
                <Typography sx={{ p: 2 }} color="text.secondary">
                  Nenhum relatório mensal passado disponível.
                </Typography>
              ) : (
                <Stack spacing={1.5} sx={{ px: 1, pb: 1 }}>
                  <TextField
                    select
                    fullWidth
                    label="Mês"
                    value={selectedPastMonth}
                    onChange={(event) => setSelectedPastMonth(event.target.value)}
                  >
                    {reports.pastReports.map((report) => (
                      <MenuItem key={report.monthKey} value={report.monthKey}>
                        {report.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {reports.pastReports
                    .filter((report) => report.monthKey === selectedPastMonth)
                    .map((report) => (
                      <Stack key={report.monthKey} spacing={1.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <Button
                            variant="contained"
                            startIcon={<DownloadRoundedIcon />}
                            onClick={() => downloadReportPdf(report)}
                          >
                            Baixar relatório
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteRoundedIcon />}
                            disabled={deletingReportMonth === report.monthKey}
                            onClick={() => handleDeleteReport(report.monthKey)}
                          >
                            {deletingReportMonth === report.monthKey ? 'Deletando...' : 'Deletar mês'}
                          </Button>
                        </Stack>
                        <ReportDetails report={report} emptyText="Nenhum item neste mês." />
                      </Stack>
                    ))}
                </Stack>
              )}
            </Paper>

            <Paper sx={{ p: { xs: 1, md: 2 } }}>
              <Stack spacing={1} sx={{ px: 1, pt: 1 }}>
                <Typography variant="h6">Planos mensais</Typography>
                <Typography color="text.secondary">
                  Clientes com plano ativo e atendimentos restantes.
                </Typography>
              </Stack>
              {loading ? (
                <Typography sx={{ p: 2 }}>{t('loadingText')}</Typography>
              ) : plans.length === 0 ? (
                <Stack spacing={1} sx={{ p: 2 }}>
                  <Typography variant="h6">Nenhum plano mensal ativo</Typography>
                  <Typography color="text.secondary">
                    Quando um cliente escolher um plano, ele aparecerá aqui.
                  </Typography>
                </Stack>
              ) : (
                <List disablePadding>
                  {plans.map((plan, index) => {
                    const completed = plan.checklist.filter((item) => item.done).length;
                    const availableDates = (availability?.dates || []).filter((item) =>
                      isEconomicPlan(plan.planoOpcao)
                        ? isEconomicAllowedDate(item.date) && item.status !== 'blocked'
                        : item.status !== 'blocked',
                    );

                    return (
                      <div key={plan.id}>
                        <ListItem sx={{ py: 2, alignItems: 'flex-start' }}>
                          <ListItemText
                            primary={(
                              <Stack spacing={0.7}>
                                <Stack
                                  direction={{ xs: 'column', sm: 'row' }}
                                  justifyContent="space-between"
                                  spacing={1}
                                >
                                  <Box>
                                    <Typography fontWeight={800}>{plan.nome}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {plan.plano} - {plan.servico}
                                    </Typography>
                                  </Box>
                                  <Button
                                    variant="outlined"
                                    color="secondary"
                                    disabled={removingPlanId === plan.id}
                                    onClick={() => handleRemovePlan(plan.id)}
                                  >
                                    Remover plano
                                  </Button>
                                </Stack>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  <Chip size="small" label={`${completed}/${plan.limite} concluídos`} />
                                  <Chip size="small" color="primary" label={`R$ ${plan.preco}`} />
                                </Stack>
                              </Stack>
                            )}
                            secondary={(
                              <Stack spacing={1.1} mt={1.2}>
                                <Typography variant="body2">
                                  <strong>{t('adminClientPhone')}:</strong>{' '}
                                  {plan.telefone || t('fieldOptional')}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Assinatura:</strong>{' '}
                                  {plan.assinaturaEm ? formatFullDate(plan.assinaturaEm) : '-'}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Expira em:</strong>{' '}
                                  {plan.expiraEm ? formatFullDate(plan.expiraEm) : '-'}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>{t('adminClientNotes')}:</strong>{' '}
                                  {plan.observacao || t('notesFallback')}
                                </Typography>
                                <Stack spacing={0.7}>
                                  {plan.checklist.map((item) => {
                                    const isEditingPlanAttendance = Boolean(
                                      editingPlanAttendance?.planId === plan.id &&
                                      editingPlanAttendance?.itemId === item.id,
                                    );
                                    const canEditPlanAttendance = Boolean(
                                      item.date &&
                                      item.time &&
                                      !item.done &&
                                      isFutureAttendance(item.date, item.time),
                                    );
                                    const planAttendanceSlots = (availability?.slotsByDate?.[editingPlanAttendance?.date] || [])
                                      .filter((slot) =>
                                        slot.available || (
                                          editingPlanAttendance?.originalDate === editingPlanAttendance?.date &&
                                          editingPlanAttendance?.originalTime === slot.time
                                        ),
                                      );

                                    return (
                                      <Stack key={item.id} spacing={1}>
                                        <Button
                                          variant={item.done ? 'contained' : 'outlined'}
                                          color={item.done ? 'success' : 'secondary'}
                                          disabled={item.done || updatingPlanItem === `${plan.id}:${item.id}`}
                                          onClick={() => handleCompletePlanItem(plan.id, item.id)}
                                          sx={{ justifyContent: 'flex-start', borderRadius: 1.5 }}
                                          startIcon={<Checkbox checked={Boolean(item.done)} />}
                                        >
                                          {item.label}
                                          {item.date && item.time
                                            ? ` - ${formatFullDate(item.date)} às ${item.time}`
                                            : ''}
                                          {item.doneAt ? ` - concluído em ${formatFullDate(item.doneAt.slice(0, 10))}` : ''}
                                        </Button>
                                        {canEditPlanAttendance && !isEditingPlanAttendance ? (
                                          <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditCalendarRoundedIcon />}
                                            onClick={() => startEditingPlanAttendance(plan, item)}
                                            sx={{ justifyContent: 'flex-start' }}
                                          >
                                            Editar data
                                          </Button>
                                        ) : null}
                                        {isEditingPlanAttendance ? (
                                          <Stack spacing={1}>
                                            <Typography variant="body2" color="text.secondary">
                                              Escolha a nova data e horário para esta data do plano.
                                            </Typography>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                                              <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label="Nova data"
                                                value={editingPlanAttendance.date}
                                                onChange={(event) => updateEditingPlanAttendance('date', event.target.value)}
                                              >
                                                {availableDates.map((dateItem) => (
                                                  <MenuItem key={dateItem.date} value={dateItem.date}>
                                                    {formatFullDate(dateItem.date)}
                                                  </MenuItem>
                                                ))}
                                              </TextField>
                                              <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                label="Novo horário"
                                                value={editingPlanAttendance.time}
                                                onChange={(event) => updateEditingPlanAttendance('time', event.target.value)}
                                              >
                                                {planAttendanceSlots.map((slot) => (
                                                  <MenuItem key={slot.time} value={slot.time}>
                                                    {slot.time}
                                                  </MenuItem>
                                                ))}
                                              </TextField>
                                            </Stack>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                              <Button
                                                variant="contained"
                                                startIcon={<SaveRoundedIcon />}
                                                onClick={saveEditedPlanAttendance}
                                              >
                                                Salvar nova data
                                              </Button>
                                              <Button
                                                variant="outlined"
                                                onClick={() => setEditingPlanAttendance(null)}
                                              >
                                                Cancelar
                                              </Button>
                                            </Stack>
                                          </Stack>
                                        ) : null}
                                      </Stack>
                                    );
                                  })}
                                </Stack>
                              </Stack>
                            )}
                          />
                        </ListItem>
                        {index < plans.length - 1 ? <Divider component="li" /> : null}
                      </div>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AdminPanel;

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { useTranslation } from 'react-i18next';
import { BOOKING_SERVICES, PLAN_TYPES } from '../../shared/constants/schedule';
import { formatFullDate, formatPhone, isValidPhone } from '../../shared/utils/formatters';
import {
  createAppointment,
  createPlan,
  prepareClientPushSubscription,
  registerClientReminder,
} from '../services/bookingApi';
import DateSelector from './DateSelector';
import TimeSelector from './TimeSelector';

const initialServiceForm = {
  nome: '',
  telefone: '',
  servico: '',
  data: '',
  horario: '',
  observacao: '',
};

const initialPlanForm = {
  nome: '',
  telefone: '',
  planoOpcao: '',
  atendimentos: [],
  observacao: '',
};

function currency(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function durationText(service) {
  if (service.durationLabel) {
    return service.durationLabel;
  }

  if (service.duration >= 60) {
    const hours = Math.floor(service.duration / 60);
    const minutes = service.duration % 60;
    return minutes ? `${hours}h${String(minutes).padStart(2, '0')}` : `${hours}h`;
  }

  return `${service.duration} min`;
}

function isEconomicPlan(optionId = '') {
  return optionId.startsWith('economico-');
}

function isEconomicAllowedDate(date = '') {
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && [1, 2, 3].includes(parsed.getDay());
}

function BookingForm({ availability, initialTab = 'services', account, onOpenAccount, onSuccess }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(initialTab);
  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [planForm, setPlanForm] = useState(initialPlanForm);
  const [errors, setErrors] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmType, setConfirmType] = useState('services');
  const [successMessage, setSuccessMessage] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const slots = availability.slotsByDate?.[serviceForm.data] || [];
  const isPlanLocked = activeTab === 'plans' && !account?.isAuthenticated;
  const planClientName = planForm.nome || account?.profile?.fullName || '';
  const planClientPhone = planForm.telefone || formatPhone(account?.profile?.phone || '');

  const selectedService = BOOKING_SERVICES.find((service) => service.id === serviceForm.servico);
  let selectedPlan = null;

  for (const plan of PLAN_TYPES) {
    const service = plan.services.find((item) => item.id === planForm.planoOpcao);
    if (service) {
      selectedPlan = { plan, service };
      break;
    }
  }

  function updateServiceField(field, value) {
    setServiceForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'data' ? { horario: '' } : {}),
    }));
    setErrors((current) => ({
      ...current,
      [field]: '',
      ...(field === 'data' ? { horario: '' } : {}),
    }));
    setSubmitError('');
  }

  function updatePlanField(field, value) {
    setPlanForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'planoOpcao' ? { atendimentos: [] } : {}),
    }));
    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
    setSubmitError('');
  }

  function updatePlanAttendance(index, field, value) {
    setPlanForm((current) => {
      const attendances = Array.from({ length: selectedPlan?.plan.limit || 0 }, (_, itemIndex) => ({
        date: current.atendimentos[itemIndex]?.date || '',
        time: current.atendimentos[itemIndex]?.time || '',
      }));

      attendances[index] = {
        ...attendances[index],
        [field]: value,
        ...(field === 'date' ? { time: '' } : {}),
      };

      return {
        ...current,
        atendimentos: attendances,
      };
    });
    setErrors((current) => ({
      ...current,
      atendimentos: '',
    }));
    setSubmitError('');
  }

  function validateServiceForm() {
    const nextErrors = {};

    if (serviceForm.nome.trim().length < 3) {
      nextErrors.nome = serviceForm.nome.trim().length > 0
        ? t('validationNameLength')
        : t('validationRequiredName');
    }

    if (!serviceForm.servico) {
      nextErrors.servico = t('validationRequiredService');
    }

    if (!serviceForm.data) {
      nextErrors.data = t('validationRequiredDate');
    }

    if (!serviceForm.horario) {
      nextErrors.horario = t('validationRequiredTime');
    }

    if (!isValidPhone(serviceForm.telefone)) {
      nextErrors.telefone = t('validationInvalidPhone');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validatePlanForm() {
    const nextErrors = {};

    if (!account?.isAuthenticated) {
      nextErrors.conta = 'Para assinar um plano, crie uma conta.';
      setErrors(nextErrors);
      return false;
    }

    if (planClientName.trim().length < 3) {
      nextErrors.nome = planClientName.trim().length > 0
        ? t('validationNameLength')
        : t('validationRequiredName');
    }

    if (!planForm.planoOpcao) {
      nextErrors.planoOpcao = 'Selecione um plano mensal.';
    }

    const requiredAttendances = selectedPlan?.plan.limit || 0;
    const attendances = Array.from({ length: requiredAttendances }, (_, index) => ({
      date: planForm.atendimentos[index]?.date || '',
      time: planForm.atendimentos[index]?.time || '',
    }));
    const filledAttendances = attendances.filter((item) => item.date && item.time);
    const incompleteAttendances = attendances.filter((item) =>
      (item.date && !item.time) || (!item.date && item.time),
    );
    const uniqueSlots = new Set(filledAttendances.map((item) => `${item.date} ${item.time}`));

    if (requiredAttendances > 0 && filledAttendances.length < 1) {
      nextErrors.atendimentos = `Escolha pelo menos 1 data e horário. Você pode completar as ${requiredAttendances} datas depois.`;
    } else if (incompleteAttendances.length > 0) {
      nextErrors.atendimentos = 'Complete data e horário de cada atendimento escolhido.';
    } else if (uniqueSlots.size !== filledAttendances.length) {
      nextErrors.atendimentos = 'Escolha horários diferentes para cada atendimento.';
    } else if (
      isEconomicPlan(planForm.planoOpcao) &&
      filledAttendances.some((item) => !isEconomicAllowedDate(item.date))
    ) {
      nextErrors.atendimentos = 'O Plano econômico só permite segunda, terça ou quarta-feira.';
    }

    if (!isValidPhone(planClientPhone)) {
      nextErrors.telefone = t('validationInvalidPhone');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function openConfirmation(type) {
    const isValid = type === 'plans' ? validatePlanForm() : validateServiceForm();

    if (!isValid) {
      return;
    }

    setConfirmType(type);
    setDialogOpen(true);
  }

  async function submitBooking() {
    setSubmitting(true);
    setSubmitError('');

    try {
      if (confirmType === 'plans') {
        let subscription = null;
        const attendances = Array.from({ length: selectedPlan?.plan.limit || 0 }, (_, index) => ({
          date: planForm.atendimentos[index]?.date || '',
          time: planForm.atendimentos[index]?.time || '',
        })).filter((attendance) => attendance.date && attendance.time);
        const idToken = await account.getIdToken();

        try {
          subscription = await prepareClientPushSubscription();
        } catch {
          subscription = null;
        }

        const data = await createPlan({
          nome: planClientName.trim(),
          telefone: planClientPhone.trim(),
          planoOpcao: planForm.planoOpcao,
          dataInicio: attendances[0]?.date || '',
          atendimentos: attendances,
          observacao: planForm.observacao.trim(),
        }, idToken);
        try {
          await Promise.all((data.attendances || attendances).map((attendance) =>
            registerClientReminder({
              appointmentId: `${data.id}:${attendance.id || `${attendance.date}-${attendance.time}`}`,
              nome: planClientName.trim(),
              servico: selectedPlan
                ? `${selectedPlan.plan.name} - ${selectedPlan.service.name}`
                : planForm.planoOpcao,
              data: attendance.date,
              horario: attendance.time,
            }, subscription),
          ));
          setReminderMessage(subscription ? 'Lembretes ativados neste dispositivo.' : '');
        } catch {
          setReminderMessage('');
        }
        setSuccessMessage(data.message || 'Seu plano mensal foi registrado com sucesso.');
        setPlanForm(initialPlanForm);
        await account.refreshProfile();
        await onSuccess();
      } else {
        const appointmentPayload = {
          nome: serviceForm.nome.trim(),
          telefone: serviceForm.telefone.trim(),
          servico: serviceForm.servico,
          data: serviceForm.data,
          horario: serviceForm.horario,
          observacao: serviceForm.observacao.trim(),
        };
        let subscription = null;

        try {
          subscription = await prepareClientPushSubscription();
        } catch {
          subscription = null;
        }

        const data = await createAppointment(appointmentPayload);
        try {
          const reminder = await registerClientReminder({
            appointmentId: data.id,
            nome: appointmentPayload.nome,
            servico: selectedService ? selectedService.name : appointmentPayload.servico,
            data: appointmentPayload.data,
            horario: appointmentPayload.horario,
          }, subscription);
          setReminderMessage(
            reminder.notificationActive ? 'Lembrete ativado neste dispositivo.' : '',
          );
        } catch {
          setReminderMessage('');
        }
        setSuccessMessage(t('bookingSuccessMessage'));
        setServiceForm(initialServiceForm);
        await onSuccess();
      }

      setDialogOpen(false);
      setErrors({});
    } catch (error) {
      setSubmitError(error.message || t('bookingErrorFallback'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Paper className="booking-panel" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography variant="h4" fontSize={{ xs: '1.6rem', md: '2rem' }}>
            Escolha como quer ficar na régua
          </Typography>
          <Typography color="text.secondary">
            Comece pelo tipo de atendimento. As próximas opções aparecem conforme sua escolha.
          </Typography>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_, value) => {
            setActiveTab(value);
            setErrors({});
            setSubmitError('');
          }}
          variant="fullWidth"
        >
          <Tab value="services" label="Serviços e Combos" />
          <Tab value="plans" label="Planos" />
        </Tabs>

        {successMessage ? (
          <Alert onClose={() => setSuccessMessage('')} severity="success">
            <Typography fontWeight={700}>{t('bookingSuccessTitle')}</Typography>
            <Typography variant="body2">{successMessage}</Typography>
          </Alert>
        ) : null}

        {reminderMessage ? (
          <Alert onClose={() => setReminderMessage('')} severity="info">
            {reminderMessage}
          </Alert>
        ) : null}

        {activeTab === 'services' ? (
          <Stack spacing={2.2}>
            {availability.error ? (
              <Alert severity="warning">{t('bookingAvailabilityError')}</Alert>
            ) : null}

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('formName')}
                  value={serviceForm.nome}
                  onChange={(event) => updateServiceField('nome', event.target.value)}
                  error={Boolean(errors.nome)}
                  helperText={errors.nome}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box component="span" sx={{ display: 'inline-flex', mr: 1, color: 'text.secondary' }}>
                          <PersonRoundedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('formPhone')}
                  value={serviceForm.telefone}
                  onChange={(event) => updateServiceField('telefone', formatPhone(event.target.value))}
                  error={Boolean(errors.telefone)}
                  helperText={errors.telefone || t('formPhoneHelper')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box component="span" sx={{ display: 'inline-flex', mr: 1, color: 'text.secondary' }}>
                          <PhoneInTalkRoundedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Stack spacing={1.2}>
              <Typography fontWeight={800}>Serviços e combos</Typography>
              <Grid container spacing={1.2}>
                {BOOKING_SERVICES.map((service) => {
                  const selected = serviceForm.servico === service.id;

                  return (
                    <Grid key={service.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Card
                        onClick={() => updateServiceField('servico', service.id)}
                        sx={{
                          cursor: 'pointer',
                          height: '100%',
                          border: selected ? '2px solid' : '1px solid',
                          borderColor: selected ? 'primary.main' : 'rgba(17, 17, 17, 0.12)',
                          transform: selected ? 'translateY(-2px)' : 'none',
                          transition: 'transform 160ms ease, border-color 160ms ease',
                        }}
                      >
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" gap={1}>
                              <Typography fontWeight={800}>{service.name}</Typography>
                              <ContentCutRoundedIcon color={selected ? 'primary' : 'action'} />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {service.description}
                            </Typography>
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Valor</Typography>
                              <Typography fontWeight={800} color="primary.main">
                                {currency(service.price)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">Duração</Typography>
                              <Typography fontWeight={700}>
                                {durationText(service)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              {errors.servico ? <Alert severity="error">{errors.servico}</Alert> : null}
            </Stack>

            <Stack spacing={1.2}>
              <Typography fontWeight={800}>{t('dateSectionTitle')}</Typography>
              <DateSelector
                dates={availability.dates}
                selectedDate={serviceForm.data}
                onSelect={(date) => updateServiceField('data', date)}
              />
              {errors.data ? <Alert severity="error">{errors.data}</Alert> : null}
            </Stack>

            <Stack spacing={1.2}>
              <Typography fontWeight={800}>{t('timeSectionTitle')}</Typography>
              <TimeSelector
                slots={slots}
                selectedTime={serviceForm.horario}
                onSelect={(time) => updateServiceField('horario', time)}
              />
              {errors.horario ? <Alert severity="error">{errors.horario}</Alert> : null}
            </Stack>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('formNotes')}
              placeholder={t('formNotesPlaceholder')}
              value={serviceForm.observacao}
              onChange={(event) => updateServiceField('observacao', event.target.value)}
            />

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Box className="mobile-submit-bar">
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={() => openConfirmation('services')}
                disabled={availability.loading || submitting}
                startIcon={<CalendarMonthRoundedIcon />}
              >
                {submitting ? t('bookingSubmitting') : t('bookingSubmit')}
              </Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2.2}>
            {isPlanLocked ? (
              <Alert
                severity="info"
                action={(
                  <Button color="inherit" size="small" onClick={onOpenAccount}>
                    Criar conta
                  </Button>
                )}
              >
                Para assinar um plano, crie uma conta
              </Alert>
            ) : null}

            {account?.isAuthenticated ? (
              <Alert severity="success">
                Conta conectada: {account.profile?.fullName || account.profile?.email || 'usuário'}.
              </Alert>
            ) : null}

            {account?.plans?.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Typography fontWeight={800}>Seus planos mensais</Typography>
                  {account.plans.map((plan) => (
                    <Typography key={plan.id} variant="body2" color="text.secondary">
                      {plan.plano} - {plan.servico}: {plan.checklist.filter((item) => item.date).length}/{plan.limite} datas escolhidas.
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            ) : null}

            <Grid container spacing={1.5}>
              {PLAN_TYPES.map((plan) => (
                <Grid key={plan.id} size={{ xs: 12, md: 6 }}>
                  <Paper className="plan-table" sx={{ p: 2, height: '100%' }}>
                    <Stack spacing={1.2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Box>
                          <Typography variant="h6">{plan.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{plan.subtitle}</Typography>
                        </Box>
                        <WorkspacePremiumRoundedIcon color="primary" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{plan.description}</Typography>
                      <Divider />
                      <Stack spacing={0.8}>
                        {plan.services.map((service) => (
                          <Button
                            key={service.id}
                            variant={planForm.planoOpcao === service.id ? 'contained' : 'outlined'}
                            color="secondary"
                            onClick={() => updatePlanField('planoOpcao', service.id)}
                            disabled={isPlanLocked}
                            sx={{
                              color: '#111111',
                              justifyContent: 'space-between',
                              borderRadius: 1.5,
                            }}
                          >
                            <span>{service.name}</span>
                            <strong>{currency(service.price)}</strong>
                          </Button>
                        ))}
                      </Stack>
                      {plan.note ? (
                        <Typography variant="caption" color="text.secondary">{plan.note}</Typography>
                      ) : null}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            {errors.planoOpcao ? <Alert severity="error">{errors.planoOpcao}</Alert> : null}

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('formName')}
                  value={planClientName}
                  onChange={(event) => updatePlanField('nome', event.target.value)}
                  disabled={isPlanLocked}
                  error={Boolean(errors.nome)}
                  helperText={errors.nome}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('formPhone')}
                  value={planClientPhone}
                  onChange={(event) => updatePlanField('telefone', formatPhone(event.target.value))}
                  disabled={isPlanLocked}
                  error={Boolean(errors.telefone)}
                  helperText={errors.telefone || t('formPhoneHelper')}
                />
              </Grid>
            </Grid>

            <TextField
              select
              fullWidth
              label="Plano selecionado"
              value={planForm.planoOpcao}
              onChange={(event) => updatePlanField('planoOpcao', event.target.value)}
              disabled={isPlanLocked}
            >
              {PLAN_TYPES.map((plan) =>
                plan.services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {plan.name} - {service.name} - {currency(service.price)}
                  </MenuItem>
                )),
              )}
            </TextField>

            {selectedPlan ? (
              <Stack spacing={1.2}>
                <Typography fontWeight={800}>Datas e horários do plano</Typography>
                <Grid container spacing={1.2}>
                  {Array.from({ length: selectedPlan.plan.limit }, (_, index) => {
                    const currentAttendance = planForm.atendimentos[index] || {};
                    const availableDates = (availability.dates || []).filter((item) =>
                      isEconomicPlan(planForm.planoOpcao)
                        ? isEconomicAllowedDate(item.date) && item.status !== 'blocked'
                        : item.status !== 'blocked',
                    );
                    const selectedSlots = new Set(
                      (planForm.atendimentos || [])
                        .map((item, itemIndex) =>
                          itemIndex === index || !item?.date || !item?.time
                            ? ''
                            : `${item.date} ${item.time}`,
                        )
                        .filter(Boolean),
                    );
                    const availableSlots = (availability.slotsByDate?.[currentAttendance.date] || [])
                      .filter((slot) => (
                        slot.available ||
                        `${currentAttendance.date} ${slot.time}` ===
                          `${currentAttendance.date} ${currentAttendance.time}`
                      ))
                      .filter((slot) => !selectedSlots.has(`${currentAttendance.date} ${slot.time}`));

                    return (
                      <Grid key={index} size={{ xs: 12, md: 6 }}>
                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={1}>
                            <Typography fontWeight={800}>
                              {index + 1}º atendimento
                            </Typography>
                            <TextField
                              select
                              fullWidth
                              label="Data"
                              value={currentAttendance.date || ''}
                              onChange={(event) => updatePlanAttendance(index, 'date', event.target.value)}
                              disabled={isPlanLocked}
                            >
                              {availableDates.map((item) => (
                                <MenuItem key={item.date} value={item.date}>
                                  {formatFullDate(item.date)}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              select
                              fullWidth
                              label="Horário"
                              value={currentAttendance.time || ''}
                              onChange={(event) => updatePlanAttendance(index, 'time', event.target.value)}
                              disabled={isPlanLocked || !currentAttendance.date}
                            >
                              {availableSlots.map((slot) => (
                                <MenuItem key={slot.time} value={slot.time}>
                                  {slot.time}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
                {errors.atendimentos ? <Alert severity="error">{errors.atendimentos}</Alert> : null}
              </Stack>
            ) : null}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('formNotes')}
              placeholder="Opcional. Exemplo: prefiro atendimento pela manhã."
              value={planForm.observacao}
              onChange={(event) => updatePlanField('observacao', event.target.value)}
              disabled={isPlanLocked}
            />

            {errors.conta ? <Alert severity="error">{errors.conta}</Alert> : null}
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Box className="mobile-submit-bar">
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={() => {
                  if (isPlanLocked) {
                    onOpenAccount?.();
                    return;
                  }

                  openConfirmation('plans');
                }}
                disabled={submitting}
                startIcon={<LocalOfferRoundedIcon />}
              >
                {submitting ? t('bookingSubmitting') : isPlanLocked ? 'Criar conta para assinar' : 'Confirmar plano mensal'}
              </Button>
            </Box>
          </Stack>
        )}
      </Stack>

      <Dialog
        fullScreen={fullScreenDialog}
        fullWidth
        maxWidth="sm"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>{t('bookingConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} mt={0.5}>
            {confirmType === 'plans' ? (
              <>
                <Typography><strong>{t('dialogResumeName')}:</strong> {planClientName}</Typography>
                <Typography><strong>{t('dialogResumePhone')}:</strong> {planClientPhone || t('fieldOptional')}</Typography>
                <Typography><strong>Plano:</strong> {selectedPlan ? selectedPlan.plan.name : '-'}</Typography>
                <Typography><strong>Serviço:</strong> {selectedPlan ? selectedPlan.service.name : '-'}</Typography>
                <Typography><strong>Limite:</strong> {selectedPlan ? `${selectedPlan.plan.limit} atendimentos por mês` : '-'}</Typography>
                {selectedPlan ? (
                  <Stack spacing={0.5}>
                    {Array.from({ length: selectedPlan.plan.limit }, (_, index) => {
                      const attendance = planForm.atendimentos[index] || {};

                      return (
                        <Typography key={index} variant="body2">
                          <strong>{index + 1}º atendimento:</strong>{' '}
                          {attendance.date ? formatFullDate(attendance.date) : '-'} às {attendance.time || '-'}
                        </Typography>
                      );
                    })}
                  </Stack>
                ) : null}
                <Alert severity="info">
                  Valor: {selectedPlan ? currency(selectedPlan.service.price) : '-'}
                </Alert>
              </>
            ) : (
              <>
                <Typography><strong>{t('dialogResumeName')}:</strong> {serviceForm.nome}</Typography>
                <Typography><strong>{t('dialogResumePhone')}:</strong> {serviceForm.telefone || t('fieldOptional')}</Typography>
                <Typography><strong>{t('dialogResumeService')}:</strong> {selectedService ? selectedService.name : '-'}</Typography>
                <Typography><strong>{t('dialogResumeDate')}:</strong> {serviceForm.data ? formatFullDate(serviceForm.data) : '-'}</Typography>
                <Typography><strong>{t('dialogResumeTime')}:</strong> {serviceForm.horario || '-'}</Typography>
                <Typography><strong>{t('dialogResumeNotes')}:</strong> {serviceForm.observacao || t('notesFallback')}</Typography>
                {selectedService ? (
                  <Alert severity="info">
                    Valor: {currency(selectedService.price)} | Duração: {durationText(selectedService)}
                  </Alert>
                ) : null}
              </>
            )}
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('cancelButton')}</Button>
          <Button variant="contained" onClick={submitBooking} disabled={submitting}>
            {submitting ? t('bookingSubmitting') : t('confirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default BookingForm;

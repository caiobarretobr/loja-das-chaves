import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useTranslation } from 'react-i18next';
import { SERVICE_CATEGORIES, SERVICES } from '../../shared/constants/schedule';
import { formatFullDate, formatPhone, isValidPhone } from '../../shared/utils/formatters';
import {
  createAppointment,
  prepareClientPushSubscription,
  registerClientReminder,
} from '../services/bookingApi';
import DateSelector from './DateSelector';
import TimeSelector from './TimeSelector';

const initialForm = {
  nome: '',
  telefone: '',
  servico: '',
  data: '',
  horario: '',
  observacao: '',
};

function currency(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

function getFirstAvailableStepError(form) {
  if (!form.servico) {
    return 'Selecione um serviço antes de continuar.';
  }

  if (form.nome.trim().length < 3) {
    return 'Informe seu nome completo.';
  }

  if (!isValidPhone(form.telefone)) {
    return 'Informe um telefone válido com DDD.';
  }

  if (!form.data) {
    return 'Escolha uma data disponível.';
  }

  if (!form.horario) {
    return 'Escolha um horário disponível.';
  }

  return '';
}

function BookingForm({ availability, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [form, setForm] = useState(initialForm);
  const isProductCategory = selectedCategoryId && ['linha-trodat', 'linha-nykon', 'diversos', 'tintas-e-almofadas-para-carimbo'].includes(selectedCategoryId);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = SERVICE_CATEGORIES.find((category) => category.id === selectedCategoryId);
  const selectedService = SERVICES.find((service) => service.id === form.servico);
  const slots = availability.slotsByDate?.[form.data] || [];

  const heading = useMemo(() => {
    const headings = {
      category: 'Selecione o serviço que você precisa',
      service: selectedCategory ? selectedCategory.name : 'Escolha o serviço',
      details: 'Para continuar, complete os dados abaixo',
      date: 'Escolha data e hora',
      time: 'Escolha seu horário',
      success: 'Pronto!',
    };

    return headings[step];
  }, [selectedCategory, step]);

  function updateField(field, value) {
    setForm((current) => ({
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

  function chooseCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setForm((current) => ({
      ...current,
      servico: '',
      data: '',
      horario: '',
    }));
    setErrors({});
    setSubmitError('');

    const category = SERVICE_CATEGORIES.find((item) => item.id === categoryId);
    if (category?.services.length === 1) {
      setTimeout(() => {
        updateField('servico', category.services[0].id);
        setStep('details');
      }, 0);
      return;
    }

    setStep('service');
  }

  function goBack() {
    const previousStep = {
      service: 'category',
      details: 'service',
      date: 'details',
      time: 'date',
    }[step];

    if (previousStep) {
      setStep(previousStep);
      setSubmitError('');
    }
  }

  function confirmService() {
    if (!form.servico) {
      setErrors({ servico: t('validationRequiredService') });
      return;
    }

    setErrors({});
    setStep('details');
  }

  function handleServiceSelect(serviceId) {
    updateField('servico', serviceId);
    setStep('details');
  }

  function confirmDetails() {
    const nextErrors = {};

    if (form.nome.trim().length < 3) {
      nextErrors.nome = form.nome.trim() ? t('validationNameLength') : t('validationRequiredName');
    }

    if (!isValidPhone(form.telefone)) {
      nextErrors.telefone = t('validationInvalidPhone');
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setStep('date');
    }
  }

  function confirmDate() {
    if (!form.data) {
      setErrors({ data: t('validationRequiredDate') });
      return;
    }

    setErrors({});
    setStep('time');
  }

  async function submitBooking() {
    const validationError = getFirstAvailableStepError(form);

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const data = await createAppointment({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        servico: form.servico,
        data: form.data,
        horario: form.horario,
        observacao: form.observacao.trim(),
      });
      const subscription = await prepareClientPushSubscription().catch(() => null);

      await registerClientReminder({
        appointmentId: data.id,
        nome: form.nome.trim(),
        servico: selectedService?.name || form.servico,
        data: form.data,
        horario: form.horario,
      }, subscription).catch(() => null);

      await onSuccess?.();
      setStep('success');
    } catch (error) {
      setSubmitError(error.message || t('bookingErrorFallback'));
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    setStep('category');
    setSelectedCategoryId('');
    setForm(initialForm);
    setErrors({});
    setSubmitError('');
  }

  function renderHeaderAction() {
    if (step === 'service') {
      return (
        <Button variant="contained" onClick={confirmService} disabled={!form.servico}>
          Confirmar
        </Button>
      );
    }

    if (step === 'details') {
      return <Button variant="contained" onClick={confirmDetails}>Confirmar</Button>;
    }

    if (step === 'date') {
      return <Button variant="contained" onClick={confirmDate} disabled={!form.data}>Confirmar</Button>;
    }

    if (step === 'time') {
      return (
        <Button
          variant="contained"
          onClick={submitBooking}
          disabled={!form.horario || submitting}
          startIcon={<CalendarMonthRoundedIcon />}
        >
          {submitting ? t('bookingSubmitting') : 'Confirmar'}
        </Button>
      );
    }

    return null;
  }

  return (
    <Paper className="booking-panel" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.4}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1.2}
        >
          <Stack spacing={0.6}>
            <Typography variant="h4" fontSize={{ xs: '1.45rem', md: '1.9rem' }}>
              {heading}
            </Typography>
            {selectedService ? (
              <Typography color="text.secondary">
                {selectedService.name} - {currency(selectedService.price)}
              </Typography>
            ) : null}
          </Stack>
          <Stack direction="row" spacing={1} justifyContent={{ xs: 'space-between', sm: 'flex-end' }}>
            {step !== 'category' && step !== 'success' ? (
              <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={goBack}>
                Voltar
              </Button>
            ) : null}
            {renderHeaderAction()}
          </Stack>
        </Stack>

        {availability.error ? (
          <Alert severity="warning">{t('bookingAvailabilityError')}</Alert>
        ) : null}

        {step === 'category' ? (
          <Stack spacing={2.2}>
            <Stack spacing={0.8}>
              <Typography variant="h6">Agende um serviço:</Typography>
              <Grid container spacing={1.4}>
                {SERVICE_CATEGORIES.filter((category) => !['linha-trodat', 'linha-nykon', 'diversos', 'tintas-e-almofadas-para-carimbo'].includes(category.id)).map((category) => (
                  <Grid key={category.id} size={{ xs: 12, sm: 6 }}>
                    <Card
                      onClick={() => chooseCategory(category.id)}
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        borderColor: 'rgba(17, 17, 17, 0.12)',
                        transition: 'transform 160ms ease, border-color 160ms ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1.2}>
                          {category.image ? (
                            <Box
                              component="img"
                              src={category.image}
                              alt={category.name}
                              sx={{
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: 1.5,
                                border: '1px solid rgba(17, 17, 17, 0.08)',
                              }}
                            />
                          ) : null}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Typography variant="h6">{category.name}</Typography>
                            <CategoryRoundedIcon color="primary" />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {category.description}
                          </Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {category.services.length} opções
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>

            <Stack spacing={0.8}>
              <Typography variant="h6">Produtos disponíveis:</Typography>
              <Grid container spacing={1.4}>
                {SERVICE_CATEGORIES.filter((category) => ['linha-trodat', 'linha-nykon', 'diversos', 'tintas-e-almofadas-para-carimbo'].includes(category.id)).map((category) => (
                  <Grid key={category.id} size={{ xs: 12, sm: 6 }}>
                    <Card
                      onClick={() => chooseCategory(category.id)}
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        borderColor: 'rgba(17, 17, 17, 0.12)',
                        transition: 'transform 160ms ease, border-color 160ms ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1.2}>
                          {category.image ? (
                            <Box
                              component="img"
                              src={category.image}
                              alt={category.name}
                              sx={{
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: 1.5,
                                border: '1px solid rgba(17, 17, 17, 0.08)',
                              }}
                            />
                          ) : null}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Typography variant="h6">{category.name}</Typography>
                            <CategoryRoundedIcon color="secondary" />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {category.description}
                          </Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {category.services.length} opções
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Stack>
        ) : null}

        {step === 'service' && selectedCategory ? (
          <Stack spacing={1.2}>
            {selectedCategory.services.map((service) => {
              const selected = form.servico === service.id;

              return (
                <Paper
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  sx={{
                    p: 1.2,
                    cursor: 'pointer',
                    border: selected ? '2px solid #111111' : '1px solid rgba(17, 17, 17, 0.12)',
                    boxShadow: selected ? '0 12px 28px rgba(17, 17, 17, 0.12)' : 'none',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      component="img"
                      src={service.image}
                      alt=""
                      sx={{
                        width: { xs: 58, sm: 76 },
                        height: { xs: 58, sm: 76 },
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid rgba(17, 17, 17, 0.1)',
                      }}
                    />
                    <Stack spacing={0.4} flex={1}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography fontWeight={900}>{service.name}</Typography>
                        {selected ? <CheckCircleRoundedIcon color="primary" /> : <KeyRoundedIcon color="action" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {service.description}
                      </Typography>
                      <Typography fontWeight={800} color="primary.main">
                        {currency(service.price)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
            {errors.servico ? <Alert severity="error">{errors.servico}</Alert> : null}
          </Stack>
        ) : null}

        {step === 'details' ? (
          <Stack spacing={1.6}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('formName')}
                  value={form.nome}
                  onChange={(event) => updateField('nome', event.target.value)}
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
                  value={form.telefone}
                  onChange={(event) => updateField('telefone', formatPhone(event.target.value))}
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
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={t('formNotes')}
              placeholder={t('formNotesPlaceholder')}
              value={form.observacao}
              onChange={(event) => updateField('observacao', event.target.value)}
            />
          </Stack>
        ) : null}

        {step === 'date' ? (
          <Stack spacing={1.2}>
            <Typography color="text.secondary">
              {isProductCategory
                ? 'Escolha o dia e horário que você vai para retirada:'
                : 'Agende a data e hora disponíveis'}
            </Typography>
            <DateSelector
              dates={availability.dates}
              selectedDate={form.data}
              onSelect={(date) => updateField('data', date)}
            />
            {errors.data ? <Alert severity="error">{errors.data}</Alert> : null}
          </Stack>
        ) : null}

        {step === 'time' ? (
          <Stack spacing={1.2}>
            <Typography color="text.secondary">
              {form.data ? `${formatFullDate(form.data)} - escolha um dos horários livres.` : ''}
            </Typography>
            <TimeSelector
              slots={slots}
              selectedTime={form.horario}
              onSelect={(time) => updateField('horario', time)}
            />
            {errors.horario ? <Alert severity="error">{errors.horario}</Alert> : null}
          </Stack>
        ) : null}

        {step === 'success' ? (
          <Stack spacing={2} alignItems="stretch">
            <Alert severity="success">
              Agendamento confirmado e a loja notificada! 5 min antes do horário do serviço que você marcou, você será notificado com uma mensagem!
            </Alert>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={0.8}>
                <Typography fontWeight={900}>{selectedService?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {form.nome} - {formatFullDate(form.data)} às {form.horario}
                </Typography>
                <Divider />
                <Typography fontWeight={800}>{selectedService ? currency(selectedService.price) : ''}</Typography>
              </Stack>
            </Paper>
            <Button variant="contained" size="large" onClick={resetFlow}>
              OK
            </Button>
          </Stack>
        ) : null}

        {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      </Stack>
    </Paper>
  );
}

export default BookingForm;

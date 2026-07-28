import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { formatPhone, isValidPhone } from '../../shared/utils/formatters';

const initialLoginForm = {
  email: '',
  password: '',
};

const initialRegisterForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function validateRegister(form) {
  if (form.fullName.trim().length < 3) {
    return 'Informe seu nome completo.';
  }

  if (!isValidPhone(form.phone)) {
    return 'Informe um telefone válido com DDD.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Informe um e-mail válido.';
  }

  if (form.password.length < 6) {
    return 'Use uma senha com pelo menos 6 caracteres.';
  }

  if (form.password !== form.confirmPassword) {
    return 'As senhas não conferem.';
  }

  return '';
}

function validateLogin(form) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Informe um e-mail válido.';
  }

  if (!form.password) {
    return 'Informe sua senha.';
  }

  return '';
}

function AccountDialog({ account, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateLoginField(field, value) {
    setLoginForm((current) => ({ ...current, [field]: value }));
    setError('');
    setMessage('');
  }

  function updateRegisterField(field, value) {
    setRegisterForm((current) => ({ ...current, [field]: value }));
    setError('');
    setMessage('');
  }

  async function runAction(action, successText) {
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await action();
      setMessage(successText);
      await account.refreshProfile();
    } catch (actionError) {
      setError(actionError.message || 'Não foi possível acessar sua conta.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    runAction(account.loginWithGoogle, 'Conta conectada com Google.');
  }

  function handleEmailLogin() {
    const validationError = validateLogin(loginForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    runAction(
      () => account.loginWithEmail({
        email: loginForm.email.trim(),
        password: loginForm.password,
      }),
      'Conta acessada com sucesso.',
    );
  }

  function handleRegister() {
    const validationError = validateRegister(registerForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    runAction(
      () => account.registerWithEmail({
        fullName: registerForm.fullName.trim(),
        phone: registerForm.phone.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      }),
      'Conta criada com sucesso.',
    );
  }

  function handleSaveProfile() {
    const fullName = registerForm.fullName.trim() || account.profile?.fullName || '';
    const phone = registerForm.phone.trim() || account.profile?.phone || '';

    if (fullName.length < 3) {
      setError('Informe seu nome completo.');
      return;
    }

    if (!isValidPhone(phone)) {
      setError('Informe um telefone válido com DDD.');
      return;
    }

    runAction(
      () => account.saveProfile({
        fullName,
        phone,
        email: account.profile?.email || account.firebaseUser?.email || '',
        photoURL: account.profile?.photoURL || account.firebaseUser?.photoURL || '',
      }),
      'Dados atualizados com sucesso.',
    );
  }

  function handleLogout() {
    runAction(account.logout, 'Conta desconectada.');
  }

  const profile = account.profile;

  return (
    <Dialog fullScreen={fullScreen} fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={{ pr: 7 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <PersonRoundedIcon color="primary" />
            <Typography variant="h5">Conta do usuário</Typography>
          </Stack>
          <IconButton onClick={onClose} aria-label="Fechar">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Stack spacing={2}>
          {!account.configured ? (
            <Alert severity="warning">
              Firebase Auth ainda não está configurado. Defina as variáveis VITE_FIREBASE_* para ativar contas de usuário.
            </Alert>
          ) : null}

          {account.error ? <Alert severity="warning">{account.error}</Alert> : null}
          {message ? <Alert severity="success">{message}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {account.isAuthenticated ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.4} alignItems="center">
                  <Avatar src={profile?.photoURL || ''}>
                    {(profile?.fullName || profile?.email || 'U').slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={800}>
                      {profile?.fullName || 'Usuário conectado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile?.email || account.firebaseUser?.email}
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Nome completo"
                      value={registerForm.fullName || profile?.fullName || ''}
                      onChange={(event) => updateRegisterField('fullName', event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Telefone"
                      value={registerForm.phone || formatPhone(profile?.phone || '')}
                      onChange={(event) => updateRegisterField('phone', formatPhone(event.target.value))}
                      helperText="Usado para seus planos mensais."
                    />
                  </Grid>
                </Grid>

                {account.plans.length > 0 ? (
                  <Stack spacing={1}>
                    <Typography fontWeight={800}>Seus planos ativos</Typography>
                    {account.plans.map((plan) => (
                      <Paper key={plan.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Typography fontWeight={800}>
                          {plan.plano} - {plan.servico}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plan.checklist.filter((item) => item.date).length} de {plan.limite} datas escolhidas
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Seus planos mensais aparecerão aqui depois da assinatura.
                  </Typography>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<SaveRoundedIcon />}
                    disabled={submitting}
                    onClick={handleSaveProfile}
                  >
                    Salvar dados
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<LogoutRoundedIcon />}
                    disabled={submitting}
                    onClick={handleLogout}
                  >
                    Sair da conta
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                disabled={!account.configured || submitting}
                onClick={handleGoogleLogin}
              >
                Entrar com Google
              </Button>

              <Divider>ou</Divider>

              <Tabs
                value={mode}
                onChange={(_, value) => {
                  setMode(value);
                  setError('');
                  setMessage('');
                }}
                variant="fullWidth"
              >
                <Tab value="login" label="Entrar" />
                <Tab value="register" label="Criar conta" />
              </Tabs>

              {mode === 'login' ? (
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => updateLoginField('email', event.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Senha"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => updateLoginField('password', event.target.value)}
                  />
                  <Button
                    variant="contained"
                    disabled={!account.configured || submitting}
                    onClick={handleEmailLogin}
                  >
                    Entrar
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    label="Nome completo"
                    value={registerForm.fullName}
                    onChange={(event) => updateRegisterField('fullName', event.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={registerForm.phone}
                    onChange={(event) => updateRegisterField('phone', formatPhone(event.target.value))}
                  />
                  <TextField
                    fullWidth
                    label="E-mail"
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => updateRegisterField('email', event.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Senha"
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => updateRegisterField('password', event.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Confirmar senha"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(event) => updateRegisterField('confirmPassword', event.target.value)}
                  />
                  <Button
                    variant="contained"
                    disabled={!account.configured || submitting}
                    onClick={handleRegister}
                  >
                    Criar conta
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AccountDialog;

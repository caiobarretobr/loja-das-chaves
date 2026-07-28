import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Link,
  Typography,
} from '@mui/material';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useTranslation } from 'react-i18next';
import AccountDialog from '../features/account/components/AccountDialog';
import { useClientAccount } from '../features/account/hooks/useClientAccount';
import AdminPanel from '../features/admin/components/AdminPanel';
import BookingForm from '../features/booking/components/BookingForm';
import { useAvailability } from '../features/booking/hooks/useAvailability';

function App() {
  const { t } = useTranslation();
  const [adminOpen, setAdminOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [bookingTab, setBookingTab] = useState('services');
  const account = useClientAccount();
  const availability = useAvailability();

  function chooseTab(tab) {
    setBookingTab(tab);
    window.setTimeout(() => {
      document.querySelector('#agendamento')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  return (
    <Box className="app-shell">
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Paper className="hero-panel phone-first-shell" sx={{ overflow: 'hidden' }}>
            <Stack spacing={2.4}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Chip color="secondary" label="Barber GS" />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width={{ xs: '100%', sm: 'auto' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PersonRoundedIcon />}
                    onClick={() => setAccountOpen(true)}
                  >
                    Conta do usuário
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={() => setAdminOpen(true)}>
                    {t('heroSecondaryAction')}
                  </Button>
                </Stack>
              </Stack>
              <Box
                component="img"
                src="/barbergs.jpeg"
                alt="Barber GS"
                sx={{
                  width: '100%',
                  maxHeight: { xs: 260, md: 360 },
                  objectFit: 'contain',
                  borderRadius: 2,
                }}
              />
              <Typography color="text.secondary" maxWidth={680}>
                Agende um horário ou escolha um plano mensal para ficar sempre na régua.
              </Typography>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <Paper className="choice-card" sx={{ p: 2, flex: 1 }}>
                  <Stack spacing={1.4}>
                    <ContentCutRoundedIcon color="primary" />
                    <Typography variant="h5">Serviços e Combos</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Corte, barba, sobrancelha, platinado, luzes e combos com preços fechados.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<ArrowDownwardRoundedIcon />}
                      onClick={() => chooseTab('services')}
                    >
                      Escolher serviço
                    </Button>
                  </Stack>
                </Paper>

                <Paper className="choice-card" sx={{ p: 2, flex: 1 }}>
                  <Stack spacing={1.4}>
                    <LocalOfferRoundedIcon color="primary" />
                    <Box>
                      <Typography variant="h5">Planos mensais</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Cansado de pagar avulso e ficar sem horários? Escolha um plano e fique sempre na régua
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<ArrowDownwardRoundedIcon />}
                      onClick={() => chooseTab('plans')}
                    >
                      Ver planos
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </Paper>

          <Box id="agendamento">
            <BookingForm
              key={bookingTab}
              availability={availability}
              initialTab={bookingTab}
              account={account}
              onOpenAccount={() => setAccountOpen(true)}
              onSuccess={availability.refresh}
            />
          </Box>

          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={1.4}>
              <Typography variant="h5">{t('adminCardTitle')}</Typography>
              <Typography color="text.secondary">{t('adminCardDescription')}</Typography>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={() => setAdminOpen(true)}
              >
                {t('adminOpenButton')}
              </Button>
              {availability.error ? (
                <Alert severity="warning">{t('bookingAvailabilityError')}</Alert>
              ) : null}
            </Stack>
          </Paper>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{ pb: 1 }}
          >
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
              <InstagramIcon color="primary" />
              <Link
                href="https://www.instagram.com/barbergs.gs/"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
                fontWeight={800}
              >
                @barbergs.gs (página da barbearia)
              </Link>
            </Stack>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
              <InstagramIcon color="primary" />
              <Link
                href="https://www.instagram.com/caio.websolutions/"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
                fontWeight={800}
              >
                @caio.websolutions (Criador do site)
              </Link>
            </Stack>
          </Stack>
        </Stack>
      </Container>

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onDataChanged={availability.refresh}
      />
      <AccountDialog
        open={accountOpen}
        account={account}
        onClose={() => setAccountOpen(false)}
      />
    </Box>
  );
}

export default App;

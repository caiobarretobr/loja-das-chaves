import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AdminPanel from '../features/admin/components/AdminPanel';
import BookingForm from '../features/booking/components/BookingForm';
import { useAvailability } from '../features/booking/hooks/useAvailability';
import InstagramIcon from '@mui/icons-material/Instagram';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import logoUrl from '../../lojarafa.jpg';

function App() {
  const [adminOpen, setAdminOpen] = useState(false);
  const availability = useAvailability();

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
                spacing={1.2}
              >
                <Chip color="primary" icon={<KeyRoundedIcon />} label="Agenda online" />
                <Button variant="outlined" color="primary" onClick={() => setAdminOpen(true)}>
                  Painel administrativo
                </Button>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.4} alignItems="center">
                <Box
                  component="img"
                  src={logoUrl}
                  alt="Loja das Chaves"
                  sx={{
                    width: { xs: '100%', md: 280 },
                    maxHeight: { xs: 260, md: 320 },
                    objectFit: 'contain',
                    borderRadius: 1,
                    background: '#ffffff',
                  }}
                />
                <Stack spacing={1.2} flex={1}>
                  <Typography
                    variant="h1"
                    fontSize={{ xs: '2.25rem', md: '3.4rem' }}
                    sx={{ color: 'primary.main', letterSpacing: '-0.04em' }}
                  >
                    Loja das Chaves
                  </Typography>
                  <Typography color="text.secondary" fontSize={{ xs: '1rem', md: '1.1rem' }}>
                    Agende serviços de chaves, fechaduras, portões, amolação e produtos de carimbo em poucos passos.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label="Terça a quinta" />
                    <Chip label="08:00 e 10:00" color="primary" />
                    <Chip label="Notificação por WhatsApp" color="secondary" />
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </Paper>

          <Box id="agendamento">
            <BookingForm
              availability={availability}
              onSuccess={availability.refresh}
            />
          </Box>

          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={1.4}>
              <Typography variant="h5">Administração da agenda</Typography>
              <Typography color="text.secondary">
                Acompanhe pedidos agendados, cancelados e finalizados com a senha da loja.
              </Typography>
              <Button fullWidth variant="contained" color="secondary" onClick={() => setAdminOpen(true)}>
                Entrar no painel
              </Button>
              {availability.error ? (
                <Alert severity="warning">
                  Não conseguimos atualizar a disponibilidade no momento. Recarregue a página para tentar novamente.
                </Alert>
              ) : null}
            </Stack>
          </Paper>

          <Paper component="footer" sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={1.6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocationOnRoundedIcon color="primary" />
                <Link
                  href="https://www.google.com/maps/search/?api=1&query=Av.%20Dr.%20Cl%C3%A1udio%20Jos%C3%A9%20Gueiros%20Leite%2C%203225%20-%20Janga%2C%20Paulista%20-%20PE%2C%2053437-000"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  underline="hover"
                  fontWeight={800}
                >
                  Av. Dr. Cláudio José Gueiros Leite, 3225 - Janga, Paulista - PE, 53437-000
                </Link>
              </Stack>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(12, 174, 179, 0.25)',
                  background: 'linear-gradient(135deg, rgba(12,174,179,0.08), rgba(15,124,129,0.04))',
                }}
              >
                <Stack spacing={1.2}>
                  <Stack spacing={0.3}>
                    <Typography variant="subtitle1" fontWeight={800}>Vídeo da loja</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assista ao vídeo institucional da Loja das Chaves.
                    </Typography>
                  </Stack>
                  <Box
                    component="video"
                    src="/imagens/lojadaschaves.mp4"
                    controls
                    playsInline
                    sx={{
                      width: '100%',
                      borderRadius: 2,
                      background: '#000',
                      maxHeight: 340,
                    }}
                  />
                </Stack>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={<WhatsAppIcon />}
                  href="https://api.whatsapp.com/send?phone=5581994623352"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fale comigo pelo nosso WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<InstagramIcon />}
                  href="https://www.instagram.com/lojadaschavesjangaoficial?igsi=dDAxcW11bGh5cGk1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram da loja
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<InstagramIcon />}
                  href="https://www.instagram.com/caio.websolutions?igsi=bjI4MjdqNWJ2cnBk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @caio.websolutions (Criador do app de agendamento)
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                Horário de funcionamento:
                Segunda a Sexta: 9h às 12h | 13h às 18h
                Sábado: 8h às 12h
                Obs: Não abrimos aos Domingos.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Telefone: 81 9462-3352
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onDataChanged={availability.refresh}
        availability={availability}
      />
    </Box>
  );
}

export default App;

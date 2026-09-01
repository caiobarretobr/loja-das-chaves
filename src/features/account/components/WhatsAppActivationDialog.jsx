import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import callMeBotGuideImage from '../../../../images/callmebot-1.jpeg';
import {
  fetchClientWhatsAppStatus,
  saveClientWhatsAppActivation,
} from '../services/accountApi';

const PERMISSION_TEXT = 'I allow callmebot to send me messages';

function WhatsAppActivationDialog({ account, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [pastedMessage, setPastedMessage] = useState('');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !account?.isAuthenticated) {
      return undefined;
    }

    let active = true;

    async function loadStatus() {
      setLoading(true);
      setError('');

      try {
        const idToken = await account.getIdToken();
        const data = await fetchClientWhatsAppStatus(idToken);

        if (active) {
          setStatus(data.whatsapp || null);
        }
      } catch (statusError) {
        if (active) {
          setError(statusError.message || 'Não foi possível carregar o status do WhatsApp.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, [account, open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PERMISSION_TEXT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setError('Não foi possível copiar automaticamente. Copie o texto manualmente.');
    }
  }

  async function handleSubmit() {
    if (!account?.isAuthenticated) {
      setError('Entre na sua conta para ativar notificações via WhatsApp.');
      return;
    }

    if (!pastedMessage.includes('api.callmebot.com/whatsapp.php')) {
      setError('Cole a mensagem do CallMeBot com o link de ativação.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const idToken = await account.getIdToken();
      const data = await saveClientWhatsAppActivation({ message: pastedMessage }, idToken);
      setStatus(data.whatsapp || null);
      setMessage(data.message || 'Notificações via WhatsApp ativadas com sucesso.');
      setPastedMessage('');
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível ativar notificações via WhatsApp.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog fullScreen={fullScreen} fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={{ pr: 7 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <WhatsAppIcon color="success" />
            <Typography variant="h5">Ative notificações via WhatsApp!</Typography>
          </Stack>
          <IconButton onClick={onClose} aria-label="Fechar">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Stack spacing={2}>
          {!account?.isAuthenticated ? (
            <Alert severity="info">
              Entre na sua conta para salvar suas notificações via WhatsApp.
            </Alert>
          ) : null}

          {status?.enabled ? (
            <Alert severity="success">
              WhatsApp ativo para o telefone {status.phone || 'cadastrado'}.
            </Alert>
          ) : null}

          {message ? <Alert severity="success">{message}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Stack spacing={1}>
            <Typography fontWeight={800}>1º passo</Typography>
            <Typography color="text.secondary">
              Copie a mensagem abaixo e envie para o telefone +34 621 34 34 03. Assim você vai permitir receber notificações através de um robô:
            </Typography>
            <TextField
              fullWidth
              value={PERMISSION_TEXT}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleCopy} aria-label="Copiar mensagem">
                        <ContentCopyRoundedIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              helperText={copied ? 'Mensagem copiada.' : 'Envie exatamente essa mensagem no WhatsApp.'}
            />
            <Box
              component="img"
              src={callMeBotGuideImage}
              alt="Exemplo de conversa com o CallMeBot"
              sx={{
                width: '100%',
                maxHeight: 360,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid rgba(32, 26, 24, 0.12)',
                bgcolor: '#ffffff',
              }}
            />
          </Stack>

          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1.2}>
              <Typography fontWeight={800}>2º passo</Typography>
              <Typography color="text.secondary">
                Aguarde alguns minutos até receber essa mensagem como mostra a foto acima. Quando ela aparecer na conversa do WhatsApp, copie ela, cole na caixa de texto abaixo e clique em "Enviar".
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Mensagem do CallMeBot"
                value={pastedMessage}
                onChange={(event) => {
                  setPastedMessage(event.target.value);
                  setError('');
                }}
                placeholder="Cole aqui a mensagem com o link https://api.callmebot.com/whatsapp.php..."
              />
              <Button
                variant="contained"
                startIcon={<SendRoundedIcon />}
                disabled={loading || !account?.isAuthenticated}
                onClick={handleSubmit}
              >
                Enviar
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default WhatsAppActivationDialog;

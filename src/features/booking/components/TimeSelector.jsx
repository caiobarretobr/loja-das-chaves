import { Button, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

function TimeSelector({ slots, selectedTime, onSelect }) {
  const { t } = useTranslation();

  if (!slots?.length) {
    return (
      <Typography color="text.secondary">
        {t('chooseDateFirst')}
      </Typography>
    );
  }

  const availableCount = slots.filter((slot) => slot.available).length;

  if (availableCount === 0) {
    return (
      <Typography color="error.main">
        {t('noSlotsAvailable')}
      </Typography>
    );
  }

  return (
    <Grid container spacing={1.2}>
      {slots.map((slot) => (
        <Grid key={slot.time} size={{ xs: 6, sm: 4 }}>
          <Button
            fullWidth
            variant={selectedTime === slot.time ? 'contained' : 'outlined'}
            color={slot.available ? 'primary' : 'inherit'}
            disabled={!slot.available}
            onClick={() => onSelect(slot.time)}
            sx={{
              py: 1.25,
              borderColor: 'rgba(32, 26, 24, 0.12)',
              opacity: slot.available ? 1 : 0.45,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.2,
            }}
          >
            {slot.time}
            {!slot.available ? (
              <Typography
                component="span"
                variant="caption"
                color="inherit"
                sx={{ lineHeight: 1.1 }}
              >
                {slot.status === 'blocked' ? t('slotClosed') : t('slotBooked')}
              </Typography>
            ) : null}
          </Button>
        </Grid>
      ))}
    </Grid>
  );
}

export default TimeSelector;

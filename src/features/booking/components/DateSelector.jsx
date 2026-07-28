import { Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDateLabel } from '../../shared/utils/formatters';

const statusColorByType = {
  available: 'success',
  partial: 'warning',
  full: 'default',
  blocked: 'error',
};

const statusKeyByType = {
  available: 'statusAvailable',
  partial: 'statusPartial',
  full: 'statusFull',
  blocked: 'statusBlocked',
};

function DateSelector({ dates, selectedDate, onSelect }) {
  const { t } = useTranslation();

  return (
    <Grid container spacing={1.2}>
      {dates.map((item) => {
        const isSelected = selectedDate === item.date;
        const isDisabled = item.status === 'full' || item.status === 'blocked';

        return (
          <Grid key={item.date} size={{ xs: 6, sm: 4 }}>
            <Paper
              onClick={() => !isDisabled && onSelect(item.date)}
              sx={{
                p: 1.5,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.55 : 1,
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'rgba(32, 26, 24, 0.08)',
                transition: 'transform 160ms ease, border-color 160ms ease',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                '&:hover': !isDisabled
                  ? {
                      transform: 'translateY(-2px)',
                      borderColor: 'primary.light',
                    }
                  : undefined,
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={800}>
                    {formatDateLabel(item.date)}
                  </Typography>
                  {item.isToday ? (
                    <Chip size="small" label={t('statusToday')} color="secondary" />
                  ) : null}
                </Stack>
                <Chip
                  size="small"
                  color={statusColorByType[item.status]}
                  label={t(statusKeyByType[item.status])}
                  variant={item.status === 'full' ? 'outlined' : 'filled'}
                />
                <Typography variant="body2" color="text.secondary">
                  {item.blockedAllDay
                    ? t('blockedByBarber')
                    : item.remainingSlots > 0
                    ? t('remainingSlots', { count: item.remainingSlots })
                    : t('occupiedSlots', { count: item.occupiedSlots })}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default DateSelector;

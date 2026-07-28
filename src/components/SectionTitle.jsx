import { Box, Chip, Stack, Typography } from '@mui/material';

function SectionTitle({ eyebrow, title, description, align = 'left' }) {
  return (
    <Stack spacing={1.2} textAlign={align}>
      {eyebrow ? (
        <Box>
          <Chip label={eyebrow} color="secondary" variant="outlined" />
        </Box>
      ) : null}
      <Typography variant="h3" fontSize={{ xs: '1.8rem', md: '2.2rem' }}>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" maxWidth={align === 'center' ? 760 : 560}>
          {description}
        </Typography>
      ) : null}
    </Stack>
  );
}

export default SectionTitle;

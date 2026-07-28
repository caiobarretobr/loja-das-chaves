const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return dateFormatter.format(date);
}

export function formatFullDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return fullDateFormatter.format(date);
}

export function normalizePhone(value) {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function formatPhone(value) {
  const digits = normalizePhone(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value) {
  const digits = normalizePhone(value);
  return digits.length === 0 || digits.length === 10 || digits.length === 11;
}

export function sortAppointments(items) {
  return [...items].sort((a, b) => {
    const first = `${a.data} ${a.horario}`;
    const second = `${b.data} ${b.horario}`;
    return first.localeCompare(second);
  });
}

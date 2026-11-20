export const localDate = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const today = () => localDate(new Date());

export const addDays = (dateString, amount) => {
  const date = new Date(dateString + 'T12:00:00');
  date.setDate(date.getDate() + amount);
  return localDate(date);
};

export function calMonthDays(ym) {
  const first = new Date(ym + '-01T12:00:00');
  const start = addDays(ym + '-01', -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function calShiftMonth(ym, delta) {
  const [year, month] = ym.split('-').map(Number);
  return localDate(new Date(year, month - 1 + delta, 1, 12)).slice(0, 7);
}

export function calMonthLabel(ym) {
  const text = new Date(ym + '-01T12:00:00')
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function validAgendaDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number(value.slice(0, 4)) >= 1000 &&
    localDate(new Date(value + 'T12:00:00')) === value;
}

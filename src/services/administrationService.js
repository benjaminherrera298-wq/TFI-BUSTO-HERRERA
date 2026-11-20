import { requiredText, documentNumber, phoneNumber, emailAddress, clockTime, numericValue } from './validation.js';
import { today } from '../utils/dates.js';

export function createAdministrationService({ state, isAdmin, commit }) {
  function notifications() {
    return state.db.notifications.filter(notification =>
      !/\bturnos?\b/i.test(notification.message) && (
      isAdmin() ||
      (state.user.role === 'vet' && notification.vetId === state.user.vetId) ||
      (state.user.role === 'owner' && notification.ownerId === state.user.ownerId)
      )
    );
  }

  function unread() {
    return notifications()
    .filter(notification => !notification.readBy.includes(state.user.id))
    .length;
  }

  function publishedSchedule(schedule) {
    if (!schedule.active || !(state.db.config.days || []).map(Number).includes(Number(schedule.day))) return null;
    const start = schedule.start < state.db.config.start ? state.db.config.start : schedule.start;
    const end = schedule.end > state.db.config.end ? state.db.config.end : schedule.end;
    return start < end ? { ...schedule, start, end } : null;
  }

  function visibleNotices() {
    return state.db.notices.filter(notice =>
      notice.active &&
      notice.date <= today() &&
      (!notice.expires || notice.expires >= today())
    );
  }

  function updateConfiguration(config) {
    if (!isAdmin()) return;
    return commit(() => { state.db.config = config; });
  }

  function deleteNotice(id) {
    return isAdmin() && commit(() => { state.db.notices = state.db.notices.filter(notice => notice.id !== id); });
  }

  function markRead(id) {
    return commit(() => {
      const notification = notifications().find(item => item.id === id);
      if (notification && !notification.readBy.includes(state.user.id)) notification.readBy.push(state.user.id);
    });
  }

  function markAllRead() {
    return commit(() => { notifications().forEach(notification => { if (!notification.readBy.includes(state.user.id)) notification.readBy.push(state.user.id); }); });
  }
  return { notifications, unread, publishedSchedule, visibleNotices, updateConfiguration, deleteNotice, markRead, markAllRead };
}

export function validateClinicData(data, days) {
  data.name = requiredText(data.name, 'Nombre de la veterinaria');
  data.identifier = documentNumber(data.identifier, true);
  data.address = requiredText(data.address, 'Dirección', 300);
  data.phone = phoneNumber(data.phone);
  data.email = emailAddress(data.email);
  data.start = clockTime(data.start);
  data.end = clockTime(data.end);

  data.days = days
  .map(value => numericValue(value, 'Día', { max: 6, integer: true }));

  if (!data.days.length) {
    throw new Error('Seleccioná al menos un día de atención.');
  }

  if (data.start >= data.end) {
    throw new Error('El cierre debe ser posterior a la apertura.');
  }

  data.duration = numericValue(data.duration, 'Duración', { min: 5, max: 240, integer: true });

  return data;
}

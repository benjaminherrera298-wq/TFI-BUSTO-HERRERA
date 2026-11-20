<script setup>
import AgendaDaySection from '../../components/agenda/AgendaDaySection.vue';

defineProps({
  clinicName: { type: String, required: true },
  date: { type: String, required: true },
  today: { type: String, required: true },
  mode: { type: String, required: true },
  period: { type: String, required: true },
  month: { type: String, required: true },
  monthDays: { type: Array, required: true },
  daySections: { type: Array, required: true }
});
const emit = defineEmits(['action', 'date', 'mode']);
const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
</script>

<template>
  <div class="heading">
    <div><div class="eyebrow">{{ clinicName }}</div><h1>Mi agenda</h1><p>Tus anotaciones y recordatorios personales, organizados por fecha.</p></div>
    <div class="row"><button type="button" class="primary" data-action="agenda-new" data-id="" @click.stop="emit('action', 'agenda-new', '', $event.currentTarget)">+ Nueva anotación</button></div>
  </div>
  <section class="card personal-agenda">
    <div class="toolbar">
      <input id="agenda-date" type="date" aria-label="Fecha de agenda" :value="date" min="1000-01-01" max="9999-12-31" @change.stop="emit('date', $event.target.value)">
      <select id="agenda-mode" aria-label="Vista de agenda" :value="mode" @change.stop="emit('mode', $event.target.value)">
        <option value="month">Vista mensual</option><option value="week">Vista semanal</option><option value="day">Vista diaria</option>
      </select>
      <div class="row">
        <button type="button" class="small" data-action="agenda-period" data-id="-1" aria-label="Período anterior" @click.stop="emit('action', 'agenda-period', '-1', $event.currentTarget)">←</button>
        <button type="button" class="small" data-action="agenda-period" data-id="0" @click.stop="emit('action', 'agenda-period', '0', $event.currentTarget)">Hoy</button>
        <button type="button" class="small" data-action="agenda-period" data-id="1" aria-label="Período siguiente" @click.stop="emit('action', 'agenda-period', '1', $event.currentTarget)">→</button>
      </div>
    </div>
    <h2 class="personal-agenda-period">{{ period }}</h2>
    <div v-if="mode === 'month'" class="personal-agenda-calendar">
      <div v-for="day in weekdays" :key="day" class="personal-agenda-weekday">{{ day }}</div>
      <button v-for="day in monthDays" :key="day.date" type="button"
              :class="'personal-agenda-cell ' + (day.date.slice(0, 7) !== month ? 'outside' : '') + ' ' + (day.date === today ? 'today' : '')"
              data-action="agenda-day" :data-id="day.date" :aria-pressed="String(day.date === date)"
              :aria-label="day.label + ': ' + day.entries.length + ' ' + (day.entries.length === 1 ? 'anotación' : 'anotaciones')"
              @click.stop="emit('action', 'agenda-day', day.date, $event.currentTarget)">
        <b>{{ Number(day.date.slice(8)) }}</b>
        <span v-for="entry in day.entries.slice(0, 2)" :key="entry.id" :class="'personal-agenda-chip ' + (entry.done ? 'is-done' : '')">{{ entry.time ? entry.time + ' · ' : '' }}{{ entry.title }}</span>
        <small v-if="day.entries.length > 2">+{{ day.entries.length - 2 }} más</small>
      </button>
    </div>
    <div v-if="mode === 'week'" class="personal-agenda-week"><AgendaDaySection v-for="day in daySections" :key="day.date" :day="day" @action="(action, id, element) => emit('action', action, id, element)" /></div>
    <template v-else><AgendaDaySection v-for="day in daySections" :key="day.date" :day="day" @action="(action, id, element) => emit('action', action, id, element)" /></template>
  </section>
</template>

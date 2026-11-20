<script setup>
import AgendaEntryCard from './AgendaEntryCard.vue';

defineProps({ day: { type: Object, required: true } });
const emit = defineEmits(['action']);
</script>

<template>
  <section class="personal-agenda-day">
    <div class="row between"><h2>{{ day.label }}</h2><button type="button" class="small" data-action="agenda-new-day" :data-id="day.date" @click.stop="emit('action', 'agenda-new-day', day.date, $event.currentTarget)">+ Anotación</button></div>
    <!-- La aplicación anterior cambia el mismo objeto; el hijo recibe sus valores actuales en cada render. -->
    <AgendaEntryCard v-for="entry in day.entries" :key="entry.id" :entry="{ ...entry }" @action="(action, id, element) => emit('action', action, id, element)" />
    <div v-if="!day.entries.length" class="empty">No hay anotaciones para este día.</div>
  </section>
</template>

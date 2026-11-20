<script setup>
defineProps({
  clinicName: { type: String, required: true },
  rows: { type: Array, required: true },
  canManage: Boolean
});
const emit = defineEmits(['action']);
</script>

<template>
  <div class="heading">
    <div><div class="eyebrow">{{ clinicName }}</div><h1>Recordatorios</h1><p>Próximas vacunas, controles y cuidados.</p></div>
    <div class="row"><button v-if="canManage" type="button" class="primary" data-action="create" data-id="reminders" @click.stop="emit('action', 'create', 'reminders', $event.currentTarget)">+ Nuevo recordatorio</button></div>
  </div>
  <article v-for="row in rows" :key="row.reminder.id" class="card reminder">
    <div class="row between">
      <div>
        <h2>{{ row.reminder.title }}</h2>
        <p>{{ row.petName }} · {{ row.dateLabel }}</p>
        <span :class="'badge ' + (row.status === 'Pendiente' ? 'pending' : '')">{{ row.status }}</span>
      </div>
      <div class="row">
        <button type="button" class="" data-action="pet" :data-id="row.reminder.petId" @click.stop="emit('action', 'pet', row.reminder.petId, $event.currentTarget)">Ver mascota</button>
        <template v-if="canManage">
          <button type="button" class="" data-action="edit" :data-id="'reminders:' + row.reminder.id" @click.stop="emit('action', 'edit', 'reminders:' + row.reminder.id, $event.currentTarget)">Editar</button>
          <button type="button" class="" data-action="reminder-done" :data-id="row.reminder.id" @click.stop="emit('action', 'reminder-done', row.reminder.id, $event.currentTarget)">{{ row.reminder.done ? 'Reabrir' : 'Completar' }}</button>
        </template>
      </div>
    </div>
  </article>
</template>

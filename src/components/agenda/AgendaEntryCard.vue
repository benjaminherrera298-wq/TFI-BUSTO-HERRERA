<script setup>
defineProps({ entry: { type: Object, required: true } });
const emit = defineEmits(['action']);
</script>

<template>
  <article :class="'personal-agenda-entry ' + (entry.done ? 'is-done' : '')">
    <div class="row between"><h3>{{ entry.title }}</h3><span class="badge">{{ entry.done ? 'Completado' : 'Pendiente' }}</span></div>
    <p class="muted">{{ entry.time || 'Todo el día' }}</p>
    <p v-if="entry.note" class="personal-agenda-text">{{ entry.note }}</p>
    <div class="row">
      <button type="button" class="small" data-action="agenda-edit" :data-id="entry.id" @click.stop="emit('action', 'agenda-edit', entry.id, $event.currentTarget)">Editar</button>
      <button type="button" class="small" data-action="agenda-toggle" :data-id="entry.id" @click.stop="emit('action', 'agenda-toggle', entry.id, $event.currentTarget)">{{ entry.done ? 'Marcar pendiente' : 'Marcar completado' }}</button>
      <button type="button" class="small danger" data-action="agenda-delete" :data-id="entry.id" @click.stop="emit('action', 'agenda-delete', entry.id, $event.currentTarget)">Eliminar</button>
    </div>
  </article>
</template>

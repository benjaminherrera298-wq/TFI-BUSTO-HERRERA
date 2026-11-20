<script setup>
defineProps({
  clinicName: { type: String, required: true },
  notices: { type: Array, required: true },
  canManage: Boolean,
  inSettings: Boolean,
  query: { type: String, default: '' },
  formatDate: { type: Function, required: true }
});

const emit = defineEmits(['search', 'create', 'edit', 'toggle', 'delete']);
</script>

<template>
  <div class="heading">
    <div>
      <template v-if="inSettings">
        <h2>Avisos de la veterinaria</h2>
        <p>Informá cierres por fecha, feriados y cambios en los días u horarios de atención.</p>
      </template>
      <template v-else>
        <div class="eyebrow">{{ clinicName }}</div>
        <h1>Avisos</h1>
        <p>Información publicada por la veterinaria.</p>
      </template>
    </div>
    <div class="row">
      <button v-if="canManage" type="button" class="primary" data-action="create" data-id="notices"
              @click.stop="emit('create')">+ Nuevo aviso</button>
    </div>
  </div>

  <div class="toolbar">
    <input id="list-search" aria-label="Buscar registros" placeholder="Buscar por nombre o datos..."
           :value="query" @input.stop="emit('search', $event.target.value)">
  </div>

  <article v-for="notice in notices" :key="notice.id" class="card notice">
    <div class="row between">
      <h2>{{ notice.title }}</h2>
      <span class="badge">{{ notice.active ? 'Publicado' : 'Borrador' }}</span>
    </div>

    <p>{{ notice.message }}</p>

    <small>{{ clinicName }} · {{ formatDate(notice.date) }}{{ notice.expires ? ' · Hasta ' + formatDate(notice.expires) : '' }}</small>

    <div v-if="canManage" class="form-actions">
      <button type="button" class="" data-action="edit" :data-id="'notices:' + notice.id"
              @click.stop="emit('edit', notice.id)">Editar</button>
      <button type="button" class="" data-action="toggle" :data-id="'notices:' + notice.id"
              @click.stop="emit('toggle', notice.id)">{{ notice.active ? 'Desactivar' : 'Publicar' }}</button>
      <button type="button" class="danger" data-action="delete-notice" :data-id="notice.id"
              @click.stop="emit('delete', notice.id)">Eliminar</button>
    </div>
  </article>

  <div v-if="inSettings && !notices.length" class="empty">No hay avisos para mostrar.</div>
</template>

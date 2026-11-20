<script setup>
defineProps({
  clinic: { type: Object, required: true },
  openDays: { type: String, required: true },
  specialists: { type: Array, required: true }
});
</script>

<template>
  <div class="heading">
    <div><div class="eyebrow">{{ clinic.name }}</div><h1>Horarios de atención</h1><p>Horarios de la veterinaria y de cada especialista. Solo lectura.</p></div>
    <div class="row"></div>
  </div>
  <section class="card">
    <h2>{{ clinic.name }}</h2>
    <p class="muted">{{ clinic.address || '' }}{{ clinic.phone ? ' · Tel: ' + clinic.phone : '' }}</p>
    <p><b>Días de atención:</b> {{ openDays }}<br><b>Horario:</b> {{ clinic.start || '—' }} – {{ clinic.end || '—' }}</p>
  </section>
  <section v-for="row in specialists" :key="row.vet.id" class="card">
    <div class="row between">
      <div><h2>{{ row.vet.name }}</h2><p class="muted">{{ row.vet.specialty || '' }}{{ row.vet.license ? ' · ' + row.vet.license : '' }}</p></div>
      <span class="badge ">Especialista</span>
    </div>
    <div v-if="row.schedules.length" class="table-wrap">
      <table>
        <thead><tr><th>Servicio</th><th>Día</th><th>Franja</th><th>Duración</th></tr></thead>
        <tbody><tr v-for="entry in row.schedules" :key="entry.schedule.id"><td>{{ entry.serviceName }}</td><td>{{ entry.dayName }}</td><td>{{ entry.schedule.start }} – {{ entry.schedule.end }}</td><td>{{ entry.schedule.duration }} min</td></tr></tbody>
      </table>
    </div>
    <div v-else class="empty">Este especialista no tiene días de atención especial publicados por el momento.</div>
  </section>
  <div v-if="!specialists.length" class="empty">No hay atenciones especiales (ecos u operaciones) publicadas por el momento.</div>
</template>

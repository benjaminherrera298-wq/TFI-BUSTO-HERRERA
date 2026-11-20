<script setup>
defineProps({ rows: { type: Array, required: true } });
const emit = defineEmits(['action']);
</script>

<template>
  <section class="card pending-tickets-section">
    <div class="pending-tickets-heading">
      <div>
        <div class="eyebrow">Administración · Cobros</div>
        <h2>Tickets en espera</h2>
        <p class="muted">Atenciones finalizadas que todavía esperan el cobro.</p>
      </div>
      <button type="button" class="small" data-action="nav" data-id="waitingRoom" @click.stop="emit('action', 'nav', 'waitingRoom', $event.currentTarget)">Ver sala de espera</button>
    </div>
    <div v-if="rows.length" class="pending-ticket-grid">
      <article v-for="row in rows" :key="row.ticket.id" class="pending-ticket-card">
        <div class="pending-ticket-stub" aria-hidden="true">
          <span>EN ESPERA</span>
          <strong>{{ row.ticket.number }}</strong>
        </div>
        <div class="pending-ticket-content">
          <header class="pending-ticket-top">
            <div>
              <span class="pending-ticket-label">Ticket {{ row.ticket.number }}</span>
              <h3>{{ row.petName }}</h3>
            </div>
            <span class="badge pending">{{ row.ticket.status }}</span>
          </header>
          <div class="pending-ticket-meta">
            <span><small>Propietario</small>{{ row.ownerName }}</span>
            <span><small>Fecha y hora</small>{{ row.dateLabel }}{{ row.ticket.time ? ' · ' + row.ticket.time : '' }}</span>
            <span><small>Veterinario</small>{{ row.ticket.vetName || 'No disponible' }}</span>
          </div>
          <p class="pending-ticket-reason"><small>Motivo</small>{{ row.ticket.reason || '—' }}</p>
          <footer class="pending-ticket-footer">
            <div><small>Monto</small><strong>{{ row.amountLabel }}</strong></div>
            <div class="row">
              <button v-if="row.pet" type="button" class="small" data-action="pet" :data-id="row.pet.id" @click.stop="emit('action', 'pet', row.pet.id, $event.currentTarget)">Ver mascota</button>
              <button type="button" class="small primary" data-action="admin-charge" :data-id="row.ticket.id" @click.stop="emit('action', 'admin-charge', row.ticket.id, $event.currentTarget)">Abrir y cobrar</button>
            </div>
          </footer>
        </div>
      </article>
    </div>
    <div v-else class="empty">No hay tickets pendientes de cobro.</div>
  </section>
</template>

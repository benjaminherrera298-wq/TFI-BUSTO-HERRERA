<script setup>
defineProps({
  month: { type: String, required: true },
  monthLabel: { type: String, required: true },
  today: { type: String, required: true },
  todayLabel: { type: String, required: true },
  selectedDate: { type: String, required: true },
  selectedLabel: { type: String, required: true },
  days: { type: Array, required: true },
  categories: { type: Array, required: true },
  upcoming: { type: Array, required: true },
  selectedItems: { type: Array, required: true }
});
const emit = defineEmits(['action']);
const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
</script>

<template>
  <div class="cal-shell">
    <aside class="cal-side">
      <h4 class="cal-h4">Próximos</h4>
      <div class="cal-ups">
        <button v-for="item in upcoming" :key="item.id" type="button" class="cal-up" data-action="cal-day" :data-id="item.date" :style="{ '--c': item.color }"
                @click.stop="emit('action', 'cal-day', item.date, $event.currentTarget)">
          <i></i><span><b>{{ item.title }}</b><small>{{ item.petName }} · {{ item.date === today ? 'Hoy' : item.dateLabel }}{{ item.time ? ' · ' + item.time : '' }}</small></span>
        </button>
        <p v-if="!upcoming.length" class="cal-empty">No hay cuidados próximos.</p>
      </div>
      <button type="button" class="cal-new" data-action="cal-new" :data-id="selectedDate" @click.stop="emit('action', 'cal-new', selectedDate, $event.currentTarget)">+ Nuevo recordatorio</button>
    </aside>
    <main class="cal-main">
      <header class="cal-top">
        <div><h2>{{ monthLabel }}</h2><p>{{ todayLabel }}</p></div>
        <div class="cal-controls">
          <button type="button" class="cal-nav wide" data-action="cal-today" @click.stop="emit('action', 'cal-today', '', $event.currentTarget)">Hoy</button>
          <button type="button" class="cal-nav" data-action="cal-prev" aria-label="Mes anterior" @click.stop="emit('action', 'cal-prev', '', $event.currentTarget)">‹</button>
          <button type="button" class="cal-nav" data-action="cal-next" aria-label="Mes siguiente" @click.stop="emit('action', 'cal-next', '', $event.currentTarget)">›</button>
        </div>
      </header>
      <div class="cal-legend"><span v-for="category in categories" :key="category[0]" class="cal-leg" :style="{ '--c': category[1] }"><i></i>{{ category[0] }}</span></div>
      <div class="cal-grid-wrap">
        <div class="cal-grid">
          <span v-for="day in weekdays" :key="day" class="cal-wd">{{ day }}</span>
          <button v-for="day in days" :key="day.date" type="button" :class="'cal-cell ' + (day.date.slice(0, 7) !== month ? 'out' : '') + ' ' + (day.date === today ? 'today' : '') + ' ' + (day.date === selectedDate ? 'selected' : '')"
                  data-action="cal-day" :data-id="day.date" :aria-label="day.label + (day.items.length ? ' · ' + day.items.length + ' evento(s)' : '')"
                  @click.stop="emit('action', 'cal-day', day.date, $event.currentTarget)">
            <span class="cal-num">{{ Number(day.date.slice(8)) }}</span>
            <span class="cal-chips"><span v-for="item in day.items.slice(0, 3)" :key="item.id" class="cal-chip" :style="{ '--c': item.color }" :title="item.title + ' · ' + item.petName"><i></i><b>{{ item.category }}</b></span><em v-if="day.items.length > 3">+{{ day.items.length - 3 }}</em></span>
          </button>
        </div>
      </div>
      <section class="cal-detail">
        <div class="cal-detail-head"><h3>{{ selectedLabel }}</h3><button type="button" class="cal-new small" data-action="cal-new" :data-id="selectedDate" @click.stop="emit('action', 'cal-new', selectedDate, $event.currentTarget)">+ Agregar</button></div>
        <article v-for="item in selectedItems" :key="item.id" class="cal-item" :style="{ '--c': item.color }">
          <i></i>
          <div class="cal-item-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.petName }} · {{ item.category }}{{ item.time ? ' · ' + item.time : '' }}{{ item.done ? ' · Completado' : '' }}</p>
            <p v-if="item.note" class="cal-note">{{ item.note }}</p>
            <span v-if="item.kind === 'owner'" class="cal-tag">Agregado por vos</span>
            <span v-else class="cal-tag vet">Indicado por {{ item.by || 'tu veterinaria' }}</span>
          </div>
          <div v-if="item.kind === 'owner'" class="cal-item-actions">
            <button type="button" class="small" data-action="cal-edit" :data-id="item.id" @click.stop="emit('action', 'cal-edit', item.id, $event.currentTarget)">Editar</button>
            <button type="button" class="small danger" data-action="cal-delete" :data-id="item.id" @click.stop="emit('action', 'cal-delete', item.id, $event.currentTarget)">Eliminar</button>
          </div>
        </article>
        <p v-if="!selectedItems.length" class="cal-empty">No hay nada para este día.</p>
      </section>
    </main>
  </div>
</template>

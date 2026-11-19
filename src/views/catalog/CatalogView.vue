<script setup>
defineProps({
  clinicName: { type: String, required: true },
  clinicPhone: { type: String, required: true },
  products: { type: Array, required: true },
  categories: { type: Array, required: true },
  canManage: Boolean,
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  formatMoney: { type: Function, required: true }
});

const emit = defineEmits(['search', 'filter', 'create', 'edit', 'toggle']);
</script>

<template>
  <div class="heading">
    <div>
      <div class="eyebrow">{{ clinicName }}</div>
      <h1>Catálogo</h1>
      <p>Productos disponibles en {{ clinicName }}. Consultas: {{ clinicPhone }}.</p>
    </div>
    <div class="row">
      <button v-if="canManage" type="button" class="primary" data-action="create" data-id="products"
              @click.stop="emit('create')">+ Nuevo producto</button>
    </div>
  </div>

  <div class="toolbar">
    <input id="list-search" aria-label="Buscar registros" placeholder="Buscar por nombre o datos..."
           :value="query" @input.stop="emit('search', $event.target.value)">
    <select v-if="categories.length" id="list-filter" aria-label="Filtrar" :value="category"
            @change.stop="emit('filter', $event.target.value)">
      <option value="">Todos</option>
      <option v-for="option in categories" :key="option" :value="option">{{ option }}</option>
    </select>
  </div>

  <div class="grid">
    <article v-for="product in products" :key="product.id" class="card">
      <img v-if="product.photo" class="product-img" :src="product.photo" :alt="product.name">
      <div v-else class="product-img">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16l1 14H3zM8 7V5a4 4 0 0 1 8 0v2" />
        </svg>
      </div>

      <small>{{ product.category }}</small>
      <h2>{{ product.name }}</h2>
      <p class="muted">{{ product.description }}</p>

      <div class="row between">
        <b>{{ formatMoney(product.price) }}</b>
        <span class="badge">{{ product.stock > 0 ? 'Disponible' : 'Sin stock' }}</span>
      </div>

      <p>
        <small>{{ product.stock }} unidades · {{ product.active ? 'Publicado' : 'Inactivo' }}</small>
      </p>

      <template v-if="canManage">
        <button type="button" class="small" data-action="edit" :data-id="'products:' + product.id"
                @click.stop="emit('edit', product.id)">Editar</button>{{ ' ' }}<button
          type="button" class="small" data-action="toggle" :data-id="'products:' + product.id"
          @click.stop="emit('toggle', product.id)">{{ product.active ? 'Desactivar' : 'Activar' }}</button>
      </template>
    </article>
    <p v-if="!products.length" class="empty">No se encontraron productos.</p>
  </div>
</template>

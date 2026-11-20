<script setup>
import PetCard from '../../components/pets/PetCard.vue';

defineProps({
  clinicName: { type: String, required: true },
  isOwner: Boolean,
  rows: { type: Array, required: true },
  query: { type: String, default: '' },
  species: { type: String, default: '' },
  canCreate: Boolean,
  canScan: Boolean,
  canEdit: Boolean,
  canShowQr: Boolean,
  pageNumber: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  totalRecords: { type: Number, default: 0 },
  cardColors: { type: Array, default: () => [] },
  colorPickerId: { type: String, default: '' }
});

const emit = defineEmits(['search', 'filter', 'page', 'create', 'scan', 'open', 'owner', 'edit', 'toggle', 'qr', 'photo', 'color', 'pickColor']);
</script>

<template>
  <div class="heading">
    <div>
      <div class="eyebrow">{{ clinicName }}</div>
      <h1>{{ isOwner ? '¿Con qué mascota querés ingresar?' : 'Mascotas' }}</h1>
      <p>{{ isOwner ? 'Seleccioná un perfil para consultar sus cuidados e historia clínica.' : 'Todos los pacientes, con su información conectada.' }}</p>
    </div>
    <div class="row">
      <button v-if="!isOwner && canScan" type="button" class="" data-action="scan" data-id="" @click.stop="emit('scan')">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z" /></svg> Simular escaneo
      </button>
      <button v-if="!isOwner && canCreate" type="button" class="primary" data-action="create" data-id="pets"
              @click.stop="emit('create')">+ Nueva mascota</button>
    </div>
  </div>

  <template v-if="isOwner">
    <!-- El cambio de archivo sigue usando el manejador existente de la aplicación. -->
    <input id="owner-pet-photo-input" type="file" accept="image/png,image/jpeg,image/webp" style="display:none">
    <div class="grid owner-pets-grid">
      <PetCard v-for="row in rows" :key="row.pet.id" :pet="row.pet" :image="row.image" :background="row.background"
               :colors="cardColors" :picker-open="colorPickerId === row.pet.id"
               @open="emit('open', $event)" @qr="emit('qr', $event)" @photo="emit('photo', $event)"
               @color="emit('color', $event)" @pick-color="emit('pickColor', $event)" />
      <p v-if="!rows.length" class="empty">No tenés mascotas activas vinculadas. Consultá a la veterinaria.</p>
    </div>
  </template>

  <section v-else class="card">
    <div class="toolbar">
      <input id="list-search" aria-label="Buscar registros" placeholder="Buscar por nombre o datos..."
             :value="query" @input.stop="emit('search', $event.target.value)">
      <select id="list-filter" aria-label="Filtrar" :value="species" @change.stop="emit('filter', $event.target.value)">
        <option value="">Todos</option>
        <option v-for="option in ['Perro', 'Gato', 'Otro']" :key="option" :value="option">{{ option }}</option>
      </select>
    </div>
    <div v-if="rows.length" class="table-wrap">
      <table>
        <thead><tr><th>Mascota</th><th>Código</th><th>Especie / raza</th><th>Sexo</th><th>Propietario</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.pet.id">
            <td><div class="row">
              <img v-if="row.image.src" :class="['logo', { 'pet-illustration': row.image.isAvatar }]" :src="row.image.src" :alt="row.image.alt">
              <span v-else class="pet-avatar"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14c-1.3 1-3.5 3-3.5 4.5S6 21 7.5 21c1.7 0 2.6-1 4.5-1s2.8 1 4.5 1c1.5 0 2.5-1 2.5-2.5S16.8 15 15.5 14a5.5 5.5 0 0 0-7 0ZM5 7v3M10 3v4M15 3v4M20 7v3" /></svg></span>
              <b>{{ row.pet.name }}</b>
            </div></td>
            <td><b style="letter-spacing:0.2rem;">{{ row.pet.code || '—' }}</b></td>
            <td>{{ row.pet.species }}<br><small>{{ row.pet.breed }}</small></td>
            <td>{{ row.pet.sex }}</td>
            <td><button type="button" class="ghost small" data-action="owner" :data-id="row.pet.ownerId"
                        @click.stop="emit('owner', row.pet.ownerId)">{{ row.ownerName }}</button></td>
            <td><span :class="['badge', { pending: !row.pet.active }]">{{ row.pet.active ? 'Activo' : 'Inactivo' }}</span></td>
            <td>
              <button type="button" class="small" data-action="pet" :data-id="row.pet.id"
                      @click.stop="emit('open', row.pet.id)">Ver</button><template v-if="canEdit">{{ ' ' }}<button
                      type="button" class="small" data-action="edit" :data-id="'pets:' + row.pet.id"
                      @click.stop="emit('edit', row.pet.id)">Editar</button></template><template v-if="canShowQr">{{ ' ' }}<button
                      type="button" class="small" data-action="qr" :data-id="row.pet.id"
                      @click.stop="emit('qr', row.pet.id)">QR</button></template>{{ ' ' }}<button
                      type="button" class="small" data-action="toggle" :data-id="'pets:' + row.pet.id"
                      @click.stop="emit('toggle', row.pet.id)">{{ row.pet.active ? 'Desactivar' : 'Activar' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">No hay registros para mostrar.</div>
    <div class="pagination">
      <small>{{ totalRecords }} registros · Página {{ pageNumber }} de {{ totalPages }}</small>
      <div class="row">
        <button type="button" class="small" data-action="page" :data-id="Math.max(1, pageNumber - 1)"
                @click.stop="emit('page', Math.max(1, pageNumber - 1))">←</button>
        <button type="button" class="small" data-action="page" :data-id="Math.min(totalPages, pageNumber + 1)"
                @click.stop="emit('page', Math.min(totalPages, pageNumber + 1))">→</button>
      </div>
    </div>
  </section>
</template>

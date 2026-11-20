<script setup>
import PetImage from '../../components/pets/PetImage.vue';
import ClinicalRecordCard from '../../components/clinical/ClinicalRecordCard.vue';

defineProps({
  clinicName: { type: String, default: '' },
  pet: Object,
  owner: Object,
  image: Object,
  age: Number,
  tabs: { type: Array, default: () => [] },
  tab: String,
  records: { type: Array, default: () => [] },
  sectionRecords: { type: Array, default: () => [] },
  reminders: { type: Array, default: () => [] },
  notices: { type: Array, default: () => [] },
  isOwner: Boolean,
  isVet: Boolean,
  canManage: Boolean,
  formatDate: { type: Function, required: true }
});
const emit = defineEmits(['action']);
</script>

<template>
  <div v-if="!pet" class="empty">No tenés permiso para consultar esta mascota.</div>
  <template v-else>
    <div class="heading">
      <div>
        <div class="eyebrow">{{ clinicName }}</div>
        <h1>{{ pet.name }}</h1>
        <p>{{ pet.species }} · {{ pet.breed }} · {{ pet.sex }} · {{ age }} años · {{ pet.weight }} kg</p>
      </div>
      <div class="row"><button type="button" class="" data-action="nav" data-id="pets"
                               @click.stop="emit('action', 'nav', 'pets')">Cambiar mascota</button></div>
    </div>
    <section class="card">
      <div class="row between">
        <div class="row">
          <PetImage :image="image" large />
          <div>
            <h2>{{ pet.name }}</h2>
            <p class="muted">{{ owner?.name }} · Paciente {{ pet.id.slice(0, 8) }} · Código <b style="letter-spacing:0.2rem;">{{ pet.code || '—' }}</b></p>
          </div>
        </div>
        <div v-if="!isVet" class="row">
          <button v-if="!isOwner" type="button" class="" data-action="edit" :data-id="'pets:' + pet.id"
                  @click.stop="emit('action', 'edit', 'pets:' + pet.id)">Editar mascota</button>
          <button type="button" class="" data-action="qr" :data-id="pet.id" @click.stop="emit('action', 'qr', pet.id)">Ver QR</button>
          <button type="button" class="" data-action="print-qr" :data-id="pet.id" @click.stop="emit('action', 'print-qr', pet.id)">Imprimir QR</button>
        </div>
      </div>
    </section>
    <nav class="tabs" aria-label="Información clínica">
      <button v-for="item in tabs" :key="item" type="button" :class="item === tab ? 'active' : ''" data-action="tab" :data-id="item"
              @click.stop="emit('action', 'tab', item)">{{ item }}</button>
    </nav>
    <div v-if="tab === 'Resumen'" class="columns">
      <section class="card">
        <h2>Datos del paciente</h2>
        <div class="form-grid">
          <p><small>Propietario</small><br><b>{{ owner?.name }}</b></p>
          <p><small>Nacimiento</small><br>{{ formatDate(pet.birth) }}</p>
          <p><small>Color</small><br>{{ pet.color }}</p>
          <p><small>Estado</small><br><span :class="['badge', { pending: !pet.active }]">{{ pet.active ? 'Activo' : 'Inactivo' }}</span></p>
        </div>
        <p>{{ pet.observations }}</p>
        <button type="button" class="" data-action="owner" :data-id="pet.ownerId"
                @click.stop="emit('action', 'owner', pet.ownerId)">Ver perfil del propietario →</button>
        <div v-if="canManage && owner" class="owner-box">
          <h3>Datos del propietario</h3>
          <div class="form-grid">
            <p><small>Nombre y apellido</small><br>{{ owner.name }}</p>
            <p><small>DNI</small><br>{{ owner.dni }}</p>
            <p><small>Teléfono</small><br>{{ owner.phone }}</p>
            <p><small>Email</small><br>{{ owner.email }}</p>
            <p><small>Dirección</small><br>{{ owner.address }}</p>
          </div>
          <button type="button" class="small" data-action="owner" :data-id="pet.ownerId"
                  @click.stop="emit('action', 'owner', pet.ownerId)">Ver perfil del propietario</button>
        </div>
        <h2>Última atención</h2>
        <ClinicalRecordCard v-if="records.length" v-bind="records[0]" />
        <p v-else class="muted">Sin atenciones registradas.</p>
      </section>
      <aside>
        <article class="card reminder">
          <h2>Próximos cuidados</h2>
          <p v-for="reminder in reminders" :key="reminder.id">{{ reminder.title }}<br><small>{{ formatDate(reminder.date) }}</small></p>
          <p v-if="!reminders.length" class="muted">Sin recordatorios.</p>
        </article>
        <article class="card notice">
          <h2>Avisos de la veterinaria</h2>
          <p v-for="notice in notices" :key="notice.id"><b>{{ notice.title }}</b><br><small>{{ notice.message }}</small></p>
        </article>
      </aside>
    </div>
    <section v-else class="card">
      <div class="row between">
        <h2>{{ tab }}</h2>
        <div class="row">
          <button v-if="isOwner" type="button" class="" data-action="print-history" :data-id="pet.id"
                  @click.stop="emit('action', 'print-history', pet.id)">Imprimir historia clínica</button>
          <button v-else type="button" class="primary" data-action="clinical" :data-id="pet.id"
                  @click.stop="emit('action', 'clinical', pet.id)">+ Registrar atención</button>
        </div>
      </div>
      <ClinicalRecordCard v-for="row in sectionRecords" :key="row.record.id" v-bind="row" />
      <div v-if="!sectionRecords.length" class="empty">Sin registros en esta sección.</div>
    </section>
  </template>
</template>

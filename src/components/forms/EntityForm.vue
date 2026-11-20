<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  collection: { type: String, required: true },
  item: { type: Object, default: () => ({}) },
  id: { type: String, default: '' },
  owners: { type: Array, default: () => [] },
  vets: { type: Array, default: () => [] },
  services: { type: Array, default: () => [] },
  pets: { type: Array, default: () => [] },
  dayNames: { type: Array, default: () => [] },
  careCategories: { type: Array, default: () => [] },
  roleOptions: { type: Array, default: () => [] },
  serviceVetIds: { type: Array, default: () => [] },
  today: { type: String, required: true },
  defaultDuration: Number,
  maxMoney: Number,
  reminderCategory: { type: String, default: '' }
});
const emit = defineEmits(['action']);
const draft = reactive({});

// El borrador pertenece al formulario; el guardado y las validaciones siguen en la aplicación.
watch(() => [props.collection, props.id, props.item], () => {
  for (const key of Object.keys(draft)) delete draft[key];
  Object.assign(draft, props.item);
  if (props.collection === 'pets') {
    draft.species ||= 'Perro';
    draft.sex ||= 'Hembra';
    draft.ownerId ||= props.owners[0]?.[0] ?? '';
  }
  if (props.collection === 'vets') draft.serviceIds = [...(props.item.serviceIds || [])];
  if (props.collection === 'services') {
    draft.duration = props.item.duration || props.defaultDuration;
    draft.vetIds = [...props.serviceVetIds];
  }
  if (props.collection === 'schedules') {
    draft.vetId ||= props.vets[0]?.[0] ?? '';
    draft.serviceId ||= props.services[0]?.[0] ?? '';
    draft.day = props.item.day ?? 1;
    draft.start = props.item.start || '09:00';
    draft.end = props.item.end || '13:00';
    draft.duration = props.item.duration || props.defaultDuration;
  }
  if (props.collection === 'notices') {
    draft.date = props.item.date || props.today;
    draft.active = String(props.item.active ?? true);
  }
  if (props.collection === 'users') {
    draft.password = '';
    draft.role = props.item.role || 'owner';
    draft.vetId ||= '';
    draft.ownerId ||= '';
    draft.ownerDni = '';
    draft.ownerAddress = '';
  }
  if (props.collection === 'reminders') {
    draft.petId ||= props.pets[0]?.[0] ?? '';
    draft.category = props.careCategories.includes(props.reminderCategory)
      ? props.reminderCategory
      : props.careCategories[0] || '';
    draft.date = props.item.date || props.today;
  }
}, { immediate: true });
</script>

<template>
  <form data-form="entity" :data-id="collection + ':' + id">
    <div class="form-grid">
      <template v-if="collection === 'pets'">
        <label class="field">Nombre<input v-model="draft.name" name="name" type="text" required></label>
        <label class="field">Especie<select v-model="draft.species" name="species"><option v-for="value in ['Perro', 'Gato', 'Otro']" :key="value" :value="value">{{ value }}</option></select></label>
        <label class="field">Raza<input v-model="draft.breed" name="breed" type="text"></label>
        <label class="field">Sexo<select v-model="draft.sex" name="sex"><option value="Hembra">Hembra</option><option value="Macho">Macho</option></select></label>
        <label class="field">Fecha de nacimiento<input v-model="draft.birth" name="birth" type="date" required :max="today"></label>
        <label class="field">Peso (kg)<input v-model="draft.weight" name="weight" type="number" required min="0.01" step="0.01" max="100000"></label>
        <label class="field">Color<input v-model="draft.color" name="color" type="text"></label>
        <label class="field">Foto (hasta 1 MB)<input name="photo" type="file" accept="image/png,image/jpeg,image/webp"></label>
        <label class="field">Propietario<select v-model="draft.ownerId" name="ownerId" required><option v-for="option in owners" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
        <div class="field">¿Es un nuevo propietario?<button type="button" class="" data-action="inline-owner" data-id=""
                  @click.stop="emit('action', 'inline-owner', '')">+ Registrar propietario</button></div>
        <label class="field full">Observaciones<textarea v-model="draft.observations" name="observations"></textarea></label>
      </template>
      <template v-else-if="collection === 'owners'">
        <label class="field">Nombre y apellido<input v-model.lazy="draft.name" name="name" type="text" required data-person-name maxlength="160" pattern="[\p{L}\p{M} ’\x27\-]+" title="Solo letras, espacios, apóstrofos y guiones"></label>
        <label class="field">DNI<input v-model.lazy="draft.dni" name="dni" type="text" required pattern="[0-9]{7,9}" inputmode="numeric" maxlength="9" data-digits="9"></label>
        <label class="field">Teléfono<input v-model.lazy="draft.phone" name="phone" type="tel" required data-phone maxlength="40" pattern="\+?[0-9\x20\x28\x29\-]+" title="Solo números, +, espacios, paréntesis y guiones"></label>
        <label class="field">Correo<input v-model="draft.email" name="email" type="email" required></label>
        <label class="field">Dirección<input v-model="draft.address" name="address" type="text" required></label>
      </template>
      <template v-else-if="collection === 'vets'">
        <label class="field">Nombre y apellido<input v-model.lazy="draft.name" name="name" type="text" required data-person-name maxlength="160" pattern="[\p{L}\p{M} ’\x27\-]+" title="Solo letras, espacios, apóstrofos y guiones"></label>
        <label class="field">Matrícula<input v-model="draft.license" name="license" type="text" required></label>
        <label class="field">Especialidad<input v-model="draft.specialty" name="specialty" type="text" required></label>
        <div class="field full">Servicios asignados<div class="checklist"><label v-for="option in services" :key="option[0]"><input v-model="draft.serviceIds" type="checkbox" name="serviceIds" :value="option[0]"> {{ option[1] }}</label></div></div>
        <template v-if="!id">
          <label class="field">Correo de la cuenta individual<input v-model="draft.email" name="email" type="email" required></label>
          <label class="field">Contraseña inicial de prueba<input v-model="draft.password" name="password" type="password" required minlength="6"></label>
        </template>
      </template>
      <template v-else-if="collection === 'services'">
        <label class="field">Nombre del servicio<input v-model="draft.name" name="name" type="text" required></label>
        <label class="field">Duración predeterminada (minutos)<input v-model="draft.duration" name="duration" type="number" required min="5" max="240"></label>
        <label class="field full">Descripción<textarea v-model="draft.description" name="description"></textarea></label>
        <div class="field full">Profesionales habilitados<div class="checklist"><label v-for="option in vets" :key="option[0]"><input v-model="draft.vetIds" type="checkbox" name="vetIds" :value="option[0]"> {{ option[1] }}</label></div></div>
      </template>
      <template v-else-if="collection === 'schedules'">
        <label class="field">Veterinario<select v-model="draft.vetId" name="vetId" required><option v-for="option in vets" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
        <label class="field">Servicio<select v-model="draft.serviceId" name="serviceId" required><option v-for="option in services" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
        <label class="field">Día<select v-model="draft.day" name="day"><option v-for="(name, index) in dayNames" :key="index" :value="index">{{ name }}</option></select></label>
        <label class="field">Hora de inicio<input v-model="draft.start" name="start" type="time" required></label>
        <label class="field">Hora de finalización<input v-model="draft.end" name="end" type="time" required></label>
        <label class="field">Duración estimada de atención<input v-model="draft.duration" name="duration" type="number" required min="5" max="240"></label>
      </template>
      <template v-else-if="collection === 'products'">
        <label class="field">Nombre<input v-model="draft.name" name="name" type="text" required></label>
        <label class="field">Categoría<input v-model="draft.category" name="category" type="text" required></label>
        <label class="field full">Descripción<textarea v-model="draft.description" name="description"></textarea></label>
        <label class="field">Precio ($)<input v-model="draft.price" name="price" type="number" required min="0" step="0.01" :max="maxMoney"></label>
        <label class="field">Stock<input v-model="draft.stock" name="stock" type="number" required min="0" step="1" :max="maxMoney"></label>
        <label class="field">Imagen (hasta 1 MB)<input name="photo" type="file" accept="image/png,image/jpeg,image/webp"></label>
      </template>
      <template v-else-if="collection === 'notices'">
        <label class="field">Título<input v-model="draft.title" name="title" type="text" required></label>
        <label class="field">Fecha de publicación<input v-model="draft.date" name="date" type="date" required></label>
        <label class="field full">Mensaje<textarea v-model="draft.message" name="message"></textarea></label>
        <label class="field">Expiración (opcional)<input v-model="draft.expires" name="expires" type="date"></label>
        <label class="field">Estado<select v-model="draft.active" name="active"><option value="true">Publicado</option><option value="false">Borrador</option></select></label>
      </template>
      <template v-else-if="collection === 'users'">
        <label class="field">Nombre<input v-model.lazy="draft.name" name="name" type="text" required data-person-name maxlength="160" pattern="[\p{L}\p{M} ’\x27\-]+" title="Solo letras, espacios, apóstrofos y guiones"></label>
        <label class="field">Correo (usuario)<input v-model="draft.email" name="email" type="email" required></label>
        <label class="field">{{ id ? 'Nueva contraseña (vacío conserva la actual)' : 'Contraseña' }}<input v-model="draft.password" name="password" type="password" minlength="6" :required="!id"></label>
        <label class="field">Número de teléfono<input v-model.lazy="draft.phone" name="phone" type="tel" :required="!id" data-phone maxlength="40" pattern="\+?[0-9\x20\x28\x29\-]+" title="Solo números, +, espacios, paréntesis y guiones"></label>
        <label class="field">Rol<select v-model="draft.role" name="role" @change.stop :disabled="item.principal"><option v-for="option in roleOptions" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
        <div data-role-link="vet" :hidden="draft.role !== 'vet'">
          <label class="field">Perfil veterinario (para ese rol)<select v-model="draft.vetId" name="vetId" :disabled="draft.role !== 'vet'"><option value="">Sin vincular</option><option v-for="option in vets" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
        </div>
        <div class="full" data-role-link="owner" :hidden="draft.role !== 'owner'">
          <label class="field">Perfil propietario<select v-model="draft.ownerId" name="ownerId" :disabled="draft.role !== 'owner'"><option value="">Vincular por correo o crear perfil</option><option v-for="option in owners" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
          <p class="muted">Si no existe un perfil con este correo, completá DNI y dirección para registrarlo junto con la cuenta.</p>
          <label class="field">DNI del nuevo propietario<input v-model.lazy="draft.ownerDni" name="ownerDni" type="text" inputmode="numeric" maxlength="9" pattern="[0-9]{7,9}" data-digits="9" :disabled="draft.role !== 'owner'"></label>
          <label class="field">Dirección del nuevo propietario<input v-model="draft.ownerAddress" name="ownerAddress" type="text" :disabled="draft.role !== 'owner'"></label>
        </div>
      </template>
      <template v-else-if="collection === 'reminders'">
        <label class="field">Mascota<select v-model="draft.petId" name="petId" required><option v-for="option in pets" :key="option[0]" :value="option[0]">{{ option[1] }}</option></select></label>
        <label class="field">Cuidado / recordatorio<input v-model="draft.title" name="title" type="text" required></label>
        <label class="field">Tipo de cuidado (color en el calendario)<select v-model="draft.category" name="category"><option v-for="value in careCategories" :key="value" :value="value">{{ value }}</option></select></label>
        <label class="field">Próxima fecha<input v-model="draft.date" name="date" type="date" required></label>
      </template>
    </div>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions">
      <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '')">Cancelar</button>
      <button class="primary" type="submit">Guardar</button>
    </div>
  </form>
</template>

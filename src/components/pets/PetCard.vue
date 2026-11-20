<script setup>
defineProps({
  pet: { type: Object, required: true },
  image: { type: Object, required: true },
  background: { type: String, default: '' },
  colors: { type: Array, default: () => [] },
  pickerOpen: Boolean
});

const emit = defineEmits(['open', 'qr', 'photo', 'color', 'pickColor']);
</script>

<template>
  <article :class="['card owner-pet-card', { 'has-color': pet.cardColor }]"
           :style="background ? { background } : {}">
    <div class="owner-pet-photo-wrap">
      <img v-if="image.src" :class="['profile-photo', { 'pet-illustration': image.isAvatar }]"
           :src="image.src" :alt="image.alt">
      <span v-else class="profile-photo pet-avatar">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14c-1.3 1-3.5 3-3.5 4.5S6 21 7.5 21c1.7 0 2.6-1 4.5-1s2.8 1 4.5 1c1.5 0 2.5-1 2.5-2.5S16.8 15 15.5 14a5.5 5.5 0 0 0-7 0ZM5 7v3M10 3v4M15 3v4M20 7v3" /></svg>
      </span>
      <button type="button" class="owner-pet-photo-edit" data-action="owner-pet-photo" :data-id="pet.id"
              title="Elegir foto o ícono" :aria-label="'Elegir foto o ícono de ' + pet.name"
              @click.stop="emit('photo', pet.id)">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16" /></svg>
      </button>
      <button type="button" class="owner-pet-color-btn" data-action="owner-pet-color" :data-id="pet.id"
              title="Color de la tarjeta" :aria-label="'Elegir color de tarjeta de ' + pet.name"
              @click.stop="emit('color', pet.id)">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></svg>
      </button>
      <div v-if="pickerOpen" class="owner-pet-color-picker">
        <button v-for="color in colors" :key="color.id" type="button"
                :class="['owner-pet-color-swatch', { active: pet.cardColor === color.id }]"
                :style="{ background: color.value }" data-action="owner-pet-color-pick" :data-id="pet.id + ':' + color.id"
                :title="color.name" :aria-label="color.name"
                @click.stop="emit('pickColor', { petId: pet.id, colorId: color.id })"></button>
        <button type="button" class="owner-pet-color-reset" data-action="owner-pet-color-pick" :data-id="pet.id + ':default'"
                title="Volver al color original de la tarjeta"
                @click.stop="emit('pickColor', { petId: pet.id, colorId: 'default' })">Original</button>
      </div>
    </div>
    <h2 class="owner-pet-name">{{ pet.name }}</h2>
    <div class="owner-pet-id">
      <span class="owner-pet-code" :title="'Código de identificación de ' + pet.name">{{ pet.code || '—' }}</span>
      <span class="owner-pet-id-sep" aria-hidden="true">/</span>
      <button type="button" class="owner-pet-qr-btn" data-action="qr" :data-id="pet.id"
              :title="'Ver QR de ' + pet.name" :aria-label="'Ver QR de ' + pet.name" @click.stop="emit('qr', pet.id)">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z" /></svg> QR
      </button>
    </div>
    <button type="button" class="primary" data-action="pet" :data-id="pet.id" @click.stop="emit('open', pet.id)">Ingresar al perfil →</button>
  </article>
</template>

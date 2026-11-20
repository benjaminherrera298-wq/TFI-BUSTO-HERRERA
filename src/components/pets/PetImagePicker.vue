<script setup>
import AppIcon from '../shared/AppIcon.vue';

defineProps({
  pet: { type: Object, required: true },
  avatars: { type: Array, required: true },
  usingAvatar: Boolean
});
const emit = defineEmits(['action']);
</script>

<template>
  <div class="owner-avatar-picker">
    <p class="muted">Elegí el ícono que más se parezca a {{ pet.name }} o subí una foto.</p>
    <div class="owner-avatar-photo-actions">
      <button type="button" class="primary" data-action="owner-pet-upload" :data-id="pet.id"
              @click.stop="emit('action', 'owner-pet-upload', pet.id)"><AppIcon name="plus" /> Subir foto</button>
      <button v-if="pet.photo" type="button" class="" data-action="owner-pet-use-photo" :data-id="pet.id"
              @click.stop="emit('action', 'owner-pet-use-photo', pet.id)">Usar mi foto</button>
    </div>
    <p class="owner-avatar-hint muted">PNG, JPG o WebP de hasta 1 MB. Tu foto se conserva si elegís un ícono.</p>
    <section v-for="group in ['Perros', 'Gatos', 'Otros animales']" :key="group" class="owner-avatar-group" :aria-label="group">
      <h3>{{ group }}</h3>
      <div class="owner-avatar-grid">
        <button v-for="avatar in avatars.filter(item => item.group === group)" :key="avatar.id" type="button"
                class="owner-avatar-option" data-action="owner-pet-avatar-pick" :data-id="pet.id + ':' + avatar.id"
                :aria-label="'Elegir ' + avatar.label + ' para ' + pet.name"
                :aria-pressed="Boolean(usingAvatar && pet.avatarId === avatar.id)"
                @click.stop="emit('action', 'owner-pet-avatar-pick', pet.id + ':' + avatar.id)">
          <img :src="avatar.src" alt="" width="88" height="88">
          <span>{{ avatar.label }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import AppIcon from '../shared/AppIcon.vue';

defineProps({
  image: { type: Object, required: true },
  large: Boolean
});
</script>

<template>
  <img v-if="image.src" :class="[large ? 'profile-photo' : 'logo', { 'pet-illustration': image.isAvatar }]"
       :src="image.src" :alt="image.alt">
  <span v-else :class="large ? 'profile-photo pet-avatar' : 'pet-avatar'"><AppIcon name="pet" /></span>
</template>

<script setup>
defineProps({ message: { type: String, default: '' }, visible: Boolean });
</script>

<template>
  <div id="toast" :class="{ show: visible }" role="status" aria-live="polite">{{ message }}</div>
</template>

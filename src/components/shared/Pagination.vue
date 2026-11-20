<script setup>
defineProps({ pageNumber: Number, totalPages: Number, totalRecords: Number });
const emit = defineEmits(['page']);
</script>
<template>
  <div class="pagination">
    <small>{{ totalRecords }} registros · Página {{ pageNumber }} de {{ totalPages }}</small>
    <div class="row">
      <button type="button" class="small" data-action="page" :data-id="Math.max(1, pageNumber - 1)" @click.stop="emit('page', Math.max(1, pageNumber - 1))">←</button>
      <button type="button" class="small" data-action="page" :data-id="Math.min(totalPages, pageNumber + 1)" @click.stop="emit('page', Math.min(totalPages, pageNumber + 1))">→</button>
    </div>
  </div>
</template>

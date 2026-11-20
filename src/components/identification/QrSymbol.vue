<script setup>
defineProps({ cells: { type: Array, required: true } });
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37">
    <rect width="37" height="37" fill="white" />
    <g fill="#1F2E5A"><rect v-for="cell in cells" :key="cell.x + ':' + cell.y" :x="cell.x" :y="cell.y" width="1" height="1" /></g>
  </svg>
</template>

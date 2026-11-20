<script setup>
import { computed } from 'vue';
const props = defineProps({ status: { type: String, default: '' } });
const className = computed(() => ['Pendiente', 'Inactivo', 'Pendiente de cobro'].includes(props.status)
  ? 'pending'
  : props.status === 'Cancelado'
    ? 'cancel'
    : ['Atendido', 'En atención', 'Pagado'].includes(props.status)
      ? 'blue'
      : props.status === 'Esperando' ? 'waiting' : '');
</script>

<template>
  <span :class="'badge ' + className">{{ status }}</span>
</template>

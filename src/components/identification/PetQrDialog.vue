<script setup>
import QrSymbol from './QrSymbol.vue';

defineProps({ pet: { type: Object, required: true }, cells: { type: Array, required: true } });
const emit = defineEmits(['action']);
</script>

<template>
  <div class="center">
    <h2>{{ pet.name }}</h2>
    <div class="qr"><QrSymbol :cells="cells" /></div>
    <p><b>QR simulado · No escaneable con cámara</b><br><small>Identificador único: {{ pet.qr }}</small></p>
    <div class="owner-box">
      <h3>Código de identificación · 5 dígitos</h3>
      <p style="font-size:2rem;letter-spacing:0.4rem;margin:0.2rem 0;"><b>{{ pet.code || '—' }}</b></p>
      <p class="muted" style="margin:0;">Dictá este código en recepción si no se puede escanear el QR. Administración lo ingresa con “Escanear / Código”.</p>
    </div>
    <p class="muted">La imagen representa únicamente el identificador. No contiene la historia clínica.</p>
    <div class="row">
      <button type="button" class="primary" data-action="scan" :data-id="pet.id" @click.stop="emit('action', 'scan', pet.id)">Simular escaneo</button>
      <button type="button" class="" data-action="public" :data-id="pet.id" @click.stop="emit('action', 'public', pet.id)">Vista pública</button>
      <button type="button" class="" data-action="download-qr" :data-id="pet.id" @click.stop="emit('action', 'download-qr', pet.id)">Descargar QR simulado</button>
      <button type="button" class="" data-action="print" data-id="" @click.stop="emit('action', 'print', '')">Imprimir</button>
    </div>
  </div>
</template>

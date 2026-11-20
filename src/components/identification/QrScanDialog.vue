<script setup>
import { ref } from 'vue';

defineProps({ rows: { type: Array, default: () => [] } });
const emit = defineEmits(['action']);
const code = ref('');
</script>

<template>
  <form data-form="admin-code">
    <div class="form-grid">
      <label class="field">Código de 5 dígitos de la mascota
        <input v-model="code" name="code" type="text" inputmode="numeric" autocomplete="off" placeholder="Ej. 48210" maxlength="5" pattern="[0-9]{5}" required>
      </label>
    </div>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions" style="justify-content:flex-start;"><button class="primary" type="submit">Identificar por código</button></div>
    <p class="muted" style="margin:0.4rem 0 0;">Si estás en la compu y no podés escanear, pedí el código de 5 dígitos de la mascota y escribilo acá.</p>
  </form>
  <hr>
  <p class="muted">O seleccioná el código QR de la mascota para simular el escaneo (cámara no disponible en esta maqueta).</p>
  <div class="scan-list">
    <template v-for="row in rows" :key="row.pet.id">
      <button v-if="row.busy" type="button" class="scan-pick" disabled>
        <b>{{ row.pet.name }}</b> · Código {{ row.pet.code || '—' }}<br>
        <small>{{ row.pet.species }} · {{ row.pet.breed }} · {{ row.ownerName }} · QR {{ String(row.pet.qr || row.pet.id).slice(0, 8) }}</small><br>
        <span class="badge waiting">Ya ingresado · {{ row.busy.status }}</span>
      </button>
      <button v-else type="button" class="scan-pick" data-action="admin-scan-pick" :data-id="row.pet.id"
              @click.stop="emit('action', 'admin-scan-pick', row.pet.id)">
        <b>{{ row.pet.name }}</b> · Código {{ row.pet.code || '—' }}<br>
        <small>{{ row.pet.species }} · {{ row.pet.breed }} · {{ row.ownerName }} · QR {{ String(row.pet.qr || row.pet.id).slice(0, 8) }}</small>
      </button>
    </template>
    <p v-if="!rows.length" class="muted">No hay mascotas activas para escanear.</p>
  </div>
</template>

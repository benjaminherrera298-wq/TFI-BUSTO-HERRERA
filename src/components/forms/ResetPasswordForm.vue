<script setup>
defineProps({ accountId: String });
const emit = defineEmits(['action']);
</script>
<template>
  <form data-form="reset-password" :data-id="accountId">
    <div class="form-grid">
      <p class="hint">Por seguridad, confirmá tu propia contraseña de administrador para autorizar este cambio.</p>
      <label class="field">Tu contraseña (admin)<input name="adminPassword" type="password" value="" required autocomplete="current-password"></label>
      <label class="field">Nueva contraseña<input name="password" type="password" value="" required minlength="6"></label>
      <label class="field">Confirmar contraseña<input name="confirm" type="password" value="" required minlength="6"></label>
    </div>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions">
      <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '')">Cancelar</button>
      <button class="primary" type="submit">Guardar</button>
    </div>
  </form>
</template>

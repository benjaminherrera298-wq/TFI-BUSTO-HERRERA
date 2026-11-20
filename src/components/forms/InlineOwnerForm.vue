<script setup>
const emit = defineEmits(['action']);
</script>
<template>
  <form data-form="inline-owner" data-id="">
    <div class="form-grid">
      <label class="field">Nombre y apellido<input name="name" type="text" value="" required data-person-name maxlength="160" pattern="[\p{L}\p{M} ’\x27\-]+" title="Solo letras, espacios, apóstrofos y guiones"></label>
      <label class="field">DNI<input name="dni" type="text" value="" required pattern="[0-9]{7,9}" inputmode="numeric" maxlength="9" data-digits="9"></label>
      <label class="field">Teléfono<input name="phone" type="tel" value="" required data-phone maxlength="40" pattern="\+?[0-9\x20\x28\x29\-]+" title="Solo números, +, espacios, paréntesis y guiones"></label>
      <label class="field">Correo<input name="email" type="email" value="" required></label>
      <label class="field">Dirección<input name="address" type="text" value="" required></label>
    </div>
    <div data-form-error class="error" role="alert"></div>
    <div class="form-actions">
      <button type="button" class="" data-action="close" data-id="" @click.stop="emit('action', 'close', '')">Cancelar</button>
      <button class="primary" type="submit">Guardar</button>
    </div>
  </form>
</template>

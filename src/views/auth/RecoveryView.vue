<script setup>
import AuthLayout from '../../components/layout/AuthLayout.vue';

defineProps({
  clinic: { type: Object, required: true },
  recovery: { type: Object, default: null },
  code: { type: String, required: true }
});
const emit = defineEmits(['action']);
</script>

<template>
  <AuthLayout :clinic="clinic">
    <h1>Recuperar contraseña</h1>
    <p>{{ recovery?.verified ? 'Elegí una nueva contraseña de prueba.' : recovery ? 'Ingresá el código de recuperación.' : 'Ingresá el correo, usuario o teléfono de tu cuenta.' }}</p>
    <div v-if="recovery && !recovery.verified" class="hint">Código simulado: {{ code }}. No se realiza ningún envío.</div>
    <form :key="recovery?.verified ? 'password' : recovery ? 'code' : 'contact'" data-form="recover" data-id="">
      <div class="form-grid">
        <label v-if="!recovery" class="field">
          Correo, usuario o teléfono
          <input name="contact" type="text" value="" required>
        </label>
        <label v-else-if="!recovery.verified" class="field">
          Código
          <input name="code" type="text" value="" required>
        </label>
        <template v-else>
          <label class="field">
            Nueva contraseña
            <input name="password" type="password" value="" minlength="6" required>
          </label>
          <label class="field">
            Confirmar contraseña
            <input name="confirm" type="password" value="" minlength="6" required>
          </label>
        </template>
      </div>
      <div data-form-error class="error" role="alert"></div>
      <div class="form-actions"><button class="primary" type="submit">Guardar</button></div>
    </form>
    <button type="button" class="" data-action="login" data-id="" @click.stop="emit('action', 'login', '', $event.currentTarget)">Volver al inicio de sesión</button>{{ ' ' }}<button
      v-if="recovery && !recovery.verified" type="button" class="" data-action="resend" data-id="" @click.stop="emit('action', 'resend', '', $event.currentTarget)">Reenviar código</button>
  </AuthLayout>
</template>

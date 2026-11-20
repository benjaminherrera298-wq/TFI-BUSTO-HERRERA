<script setup>
import AuthLayout from '../../components/layout/AuthLayout.vue';
import ClinicFields from '../../components/forms/ClinicFields.vue';

defineProps({
  clinic: { type: Object, required: true },
  step: { type: Number, required: true },
  config: { type: Object, default: () => ({}) },
  verificationEmail: { type: String, default: '' },
  code: { type: String, required: true }
});
const emit = defineEmits(['action']);
const titles = ['Configuración inicial', 'Verificá tu veterinaria', 'Crear administrador principal', 'Verificá tu cuenta', 'Todo listo para comenzar'];
</script>

<template>
  <AuthLayout :clinic="clinic">
    <div class="steps"><span v-for="index in [0, 1, 2, 3]" :key="index" :class="step >= index ? 'done' : ''"></span></div>
    <div class="eyebrow">Puesta en marcha · Paso {{ Math.min(step + 1, 4) }} de 4</div>
    <h1>{{ titles[step] }}</h1>
    <p v-if="step === 0">Configurá los datos de tu veterinaria para comenzar.</p>
    <template v-if="step === 1 || step === 3">
      <p>Ingresá el código para {{ verificationEmail }}.</p>
      <div class="hint">Verificación simulada. No se envían mensajes. Código de prueba: <b>{{ code }}</b>.</div>
    </template>
    <p v-if="step === 2">Esta cuenta tendrá acceso completo a la gestión.</p>
    <form v-if="step < 4" :key="step" :data-form="step === 0 ? 'setup' : step === 2 ? 'admin' : 'verify'" data-id="">
      <div class="form-grid">
        <ClinicFields v-if="step === 0" :config="config" />
        <label v-else-if="step === 1 || step === 3" class="field">
          Código de verificación
          <input name="code" type="text" value="" required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code">
        </label>
        <template v-else-if="step === 2">
          <label class="field">
            Nombre
            <input name="first" type="text" value="" required data-person-name maxlength="160"
                   pattern="[\p{L}\p{M} ’\x27\-]+" title="Solo letras, espacios, apóstrofos y guiones">
          </label>
          <label class="field">
            Apellido
            <input name="last" type="text" value="" required data-person-name maxlength="160"
                   pattern="[\p{L}\p{M} ’\x27\-]+" title="Solo letras, espacios, apóstrofos y guiones">
          </label>
          <label class="field">Usuario / correo<input name="email" type="text" value="" required></label>
          <label class="field">Contraseña de prueba<input name="password" type="password" value="" minlength="6" required></label>
          <label class="field">Confirmar contraseña<input name="confirm" type="password" value="" minlength="6" required></label>
        </template>
      </div>
      <div data-form-error class="error" role="alert"></div>
      <div class="form-actions"><button class="primary" type="submit">Guardar</button></div>
    </form>
    <button v-if="step === 1 || step === 3" type="button" class="" data-action="resend" data-id=""
            @click.stop="emit('action', 'resend', '', $event.currentTarget)">Reenviar código</button>
    <template v-if="step === 4">
      <p>Configuración completada correctamente.</p>
      <button type="button" class="primary" data-action="login" data-id=""
              @click.stop="emit('action', 'login', '', $event.currentTarget)">Ir al inicio de sesión</button>
    </template>
  </AuthLayout>
</template>

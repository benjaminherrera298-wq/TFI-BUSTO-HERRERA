<script setup>
import { ref } from 'vue';
import AuthLayout from '../../components/layout/AuthLayout.vue';

const props = defineProps({
  clinic: { type: Object, required: true },
  remembered: { type: String, default: '' },
  accounts: { type: Array, default: () => [] }
});
const emit = defineEmits(['action']);
const email = ref(props.remembered);
const password = ref('');
const remember = ref(Boolean(props.remembered));
const passwordVisible = ref(false);

function selectDemo(account) {
  email.value = account.email;
  password.value = '123456';
}
</script>

<template>
  <AuthLayout :clinic="clinic" is-login>
    <div class="eyebrow">Bienvenido a {{ clinic.name }}</div>
    <h1>Iniciá sesión</h1>
    <p>Ingresá a tu espacio de gestión y cuidado.</p>
    <form data-form="login">
      <label class="field">
        Usuario / correo
        <input v-model="email" name="email" type="text" required autocomplete="username">
      </label>
      <br>
      <label class="field">
        Contraseña
        <input v-model="password" name="password" :type="passwordVisible ? 'text' : 'password'" required autocomplete="current-password">
      </label>
      <div class="row between">
        <label><input v-model="remember" name="remember" type="checkbox"> Recordarme</label>
        <button type="button" class="ghost small" data-action="show-password" data-id=""
                @click.stop="passwordVisible = !passwordVisible">{{ passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña' }}</button>
      </div>
      <div data-form-error class="error" role="alert"></div>
      <button class="primary full" type="submit">Iniciar sesión →</button>
    </form>
    <p class="center">
      <button type="button" class="ghost" data-action="recover" data-id="" @click.stop="emit('action', 'recover', '', $event.currentTarget)">¿Olvidaste tu contraseña?</button>
    </p>
    <div class="demo">
      <small>CUENTAS DE DEMOSTRACIÓN · contraseña 123456</small>
      <div>
        <template v-for="(account, index) in accounts" :key="account.id"><button type="button" class="" data-action="demo"
                :data-id="account.email" @click.stop="selectDemo(account)">{{ account.roleLabel }}</button><template v-if="index < accounts.length - 1">{{ ' ' }}</template></template>
      </div>
      <small>Los accesos son simulados y los datos se guardan en este navegador. Utilizá información ficticia.</small>
    </div>
  </AuthLayout>
</template>

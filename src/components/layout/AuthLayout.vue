<script setup>
defineProps({
  clinic: { type: Object, default: () => ({}) },
  isLogin: Boolean
});
</script>

<template>
  <main :class="'auth' + (isLogin ? ' auth-login' : '')">
    <div class="auth-panel">
      <aside class="auth-art">
        <div class="brand">
          <img v-if="clinic.logo" class="logo" :src="clinic.logo" alt="Logo">
          <span v-else class="mark">+</span>
          <span>{{ clinic.name || 'Gestión veterinaria' }}</span>
        </div>
        <section v-if="isLogin" class="auth-login-story">
          <figure class="auth-visual">
            <img class="auth-illustration" src="/assets/veterinary-owner-dog.png" alt="Una dueña acompañando a su perro">
          </figure>
          <div class="auth-art-caption">
            <div class="eyebrow">Un espacio para cuidar</div>
            <h1>Más cerca de cada paciente.</h1>
            <p>La atención y la información de tu veterinaria, conectadas en un solo lugar.</p>
          </div>
        </section>
        <section v-else>
          <div class="orbit"><span>+</span></div>
          <div class="eyebrow">Un espacio para cuidar</div>
          <h1>Más cerca de cada paciente.</h1>
          <p>La atención, los equipos y la información de tu veterinaria, conectados en un solo lugar.</p>
        </section>
        <footer>Sistema de Gestión Veterinaria · Prototipo académico</footer>
      </aside>
      <section class="auth-main">
        <div class="auth-box"><slot /></div>
      </section>
    </div>
  </main>
</template>

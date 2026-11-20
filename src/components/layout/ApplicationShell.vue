<script setup>
import { ref } from 'vue';
import AppIcon from '../shared/AppIcon.vue';

defineProps({
  user: { type: Object, required: true },
  clinic: { type: Object, required: true },
  firstName: { type: String, required: true },
  accountLabel: { type: String, required: true },
  panelLabel: { type: String, required: true },
  roleLabel: { type: String, required: true },
  navigation: { type: Array, required: true },
  route: { type: String, required: true },
  canSeeNotifications: Boolean,
  notificationCount: { type: Number, default: 0 },
  darkTheme: Boolean
});
const emit = defineEmits(['action']);
const menuOpen = ref(false);
const accountOpen = ref(false);
</script>

<template>
  <div class="application-shell">
    <aside :class="['sidebar', { open: menuOpen }]">
      <div class="sidebar-profile-wrap">
        <button type="button" class="sidebar-profile" data-action="account"
                :aria-label="'Abrir menú de cuenta de ' + user.name" :aria-expanded="String(accountOpen)"
                @click.stop="accountOpen = !accountOpen">
          <span class="sidebar-avatar" aria-hidden="true">
            <img v-if="clinic.logo" :src="clinic.logo" alt="">
            <template v-else>{{ accountLabel }}</template>
          </span>
          <span class="sidebar-identity">
            <strong>{{ user.name }}</strong>
            <span class="sidebar-email">{{ user.email }}</span>
            <span class="sidebar-role">{{ roleLabel }}</span>
          </span>
        </button>
        <button type="button" class="ghost sidebar-close" data-action="menu" aria-label="Cerrar menú" @click.stop="menuOpen = !menuOpen">✕</button>
        <div v-if="accountOpen" class="account-menu">
          <b>{{ user.name }}</b>
          <p><small>{{ roleLabel }}</small></p>
          <button v-if="user.role === 'owner'" type="button" class="" data-action="nav" data-id="ownerProfile"
                  @click.stop="emit('action', 'nav', 'ownerProfile', $event.currentTarget)">Mi perfil</button>
          <button type="button" class="" data-action="logout" data-id="" @click.stop="emit('action', 'logout', '', $event.currentTarget)">Cerrar sesión</button>
        </div>
      </div>
      <div class="eyebrow">Tu espacio de trabajo</div>
      <nav aria-label="Menú principal">
        <button v-for="item in navigation" :key="item.key" :class="'nav-item ' + (route === item.key ? 'active' : '')"
                data-action="nav" :data-id="item.key" :aria-current="route === item.key ? 'page' : undefined"
                @click.stop="emit('action', 'nav', item.key, $event.currentTarget)">
          <AppIcon :name="item.icon" /> {{ item.label }}
        </button>
      </nav>
      <footer>
        <button type="button" class="ghost sidebar-logout" data-action="logout" data-id=""
                @click.stop="emit('action', 'logout', '', $event.currentTarget)"><AppIcon name="logout" /> Cerrar sesión</button>
      </footer>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <div class="topbar-intro">
          <button type="button" class="ghost menu-toggle" data-action="menu" aria-label="Abrir menú principal" @click.stop="menuOpen = !menuOpen"><AppIcon name="menu" /></button>
          <div class="topbar-greeting">
            <h2>Hola, {{ firstName }}</h2>
            <p>{{ panelLabel }}</p>
          </div>
        </div>
        <div class="topbar-actions">
          <button type="button" class="theme-toggle ghost" data-action="theme" role="switch" :aria-checked="String(darkTheme)"
                  :aria-label="darkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                  :title="darkTheme ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                  @click.stop="emit('action', 'theme', '', $event.currentTarget)">
            <span class="theme-track" aria-hidden="true">
              <span class="theme-thumb"></span>
              <svg class="icon theme-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
              <svg class="icon theme-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
            </span>
          </button>
          <button v-if="canSeeNotifications" type="button" class="ghost notification-button" data-action="nav" data-id="notifications"
                  :aria-label="'Notificaciones: ' + notificationCount + ' sin leer'" @click.stop="emit('action', 'nav', 'notifications', $event.currentTarget)">
            <AppIcon name="bell" /><span class="notification-count">{{ notificationCount }}</span>
          </button>
        </div>
      </header>
      <main id="content" class="content"></main>
    </div>
  </div>
</template>

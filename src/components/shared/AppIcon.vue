<script setup>
defineProps({ name: { type: String, required: true } });

const paths = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
  pet: 'M8.5 14c-1.3 1-3.5 3-3.5 4.5S6 21 7.5 21c1.7 0 2.6-1 4.5-1s2.8 1 4.5 1c1.5 0 2.5-1 2.5-2.5S16.8 15 15.5 14a5.5 5.5 0 0 0-7 0ZM5 7v3M10 3v4M15 3v4M20 7v3',
  users: 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 3a4 4 0 0 1 0 8M22 21v-3a4 4 0 0 0-3-4',
  medical: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  calendar: 'M4 5h16v16H4zM7 3v4M17 3v4M4 10h16M8 14h2M14 14h2M8 18h2',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2',
  bag: 'M4 7h16l1 14H3zM8 7V5a4 4 0 0 1 8 0v2',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  megaphone: 'M3 9h5l12-5v16L8 15H3zM7 15l2 6h3l-2-5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  logout: 'M9 3H3v18h6M8 12h13M17 8l4 4-4 4',
  plus: 'M12 4v16M4 12h16',
  search: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14M15 15l6 6',
  qr: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6z',
  waiting: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M8 12h8M8 16h5M8 8h3',
  menu: 'M3 6h18M3 12h18M3 18h18',
  theme: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'
};
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path :d="paths[name] || paths.medical" /></svg>
</template>

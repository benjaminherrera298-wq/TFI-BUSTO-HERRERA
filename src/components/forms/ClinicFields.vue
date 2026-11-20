<script setup>
defineProps({ config: { type: Object, default: () => ({}) } });

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
</script>

<template>
  <label class="field">
    Nombre de la veterinaria
    <input name="name" type="text" :value="config.name || ''" required>
  </label>
  <label class="field">
    DNI / CUIT del responsable
    <input name="identifier" type="text" :value="config.identifier || ''" required inputmode="numeric"
           maxlength="11" data-digits="11" pattern="(?:[0-9]{7,9}|[0-9]{11})">
  </label>
  <label class="field">
    Dirección
    <input name="address" type="text" :value="config.address || ''" required>
  </label>
  <label class="field">
    Teléfono
    <input name="phone" type="tel" :value="config.phone || ''" required data-phone maxlength="40"
           pattern="\+?[0-9\x20\x28\x29\-]+" title="Solo números, +, espacios, paréntesis y guiones">
  </label>
  <label class="field">
    Correo electrónico
    <input name="email" type="email" :value="config.email || ''" required>
  </label>
  <label class="field">
    Logo (PNG, JPG o WebP; hasta 1 MB)
    <input name="logo" type="file" accept="image/png,image/jpeg,image/webp">
  </label>
  <div class="field full">
    Días de atención
    <div class="checklist">
      <label v-for="(day, index) in dayNames" :key="index">
        <input type="checkbox" name="days" :value="index" :checked="(config.days || [1, 2, 3, 4, 5, 6]).map(String).includes(String(index))">
        {{ day }}
      </label>
    </div>
  </div>
  <label class="field">
    Apertura
    <input name="start" type="time" :value="config.start || '08:00'" required>
  </label>
  <label class="field">
    Cierre
    <input name="end" type="time" :value="config.end || '20:00'" required>
  </label>
  <label class="field">
    Duración estimada de atención (minutos)
    <input name="duration" type="number" :value="config.duration || 30" min="5" max="240" required>
  </label>
</template>

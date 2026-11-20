import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from 'vue/compiler-sfc';

test('el controlador y el renderizador ya no generan ni interpretan HTML de pantallas', async () => {
  const controller = await readFile(new URL('../src/legacy/veterinaryApplication.js', import.meta.url), 'utf8');
  const renderer = await readFile(new URL('../src/legacy/screenRenderer.js', import.meta.url), 'utf8');
  assert.doesNotMatch(controller, /<(?:main|div|form|table|section|article|button|input|label|span)\b/i);
  assert.doesNotMatch(controller + renderer, /setHtml|innerHTML|insertAdjacentHTML/);
  // El SVG descargable es un archivo; el QR visible se dibuja con QrSymbol.vue.
  assert.match(controller, /function qrSvg\(/);
});

test('todas las vistas tienen template y script setup y están en el registro de componentes', async () => {
  const root = new URL('../src/views/', import.meta.url);
  const registry = await readFile(new URL('viewComponents.js', root), 'utf8');
  const imports = new Set([...registry.matchAll(/from\s+['"]([^'"]+\.vue)['"]/g)].map(match => new URL(match[1], root).href));
  let views = 0;
  async function inspect(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), folder);
      if (entry.isDirectory()) await inspect(url);
      else if (entry.name.endsWith('.vue')) {
        const source = await readFile(url, 'utf8');
        const { descriptor, errors } = parse(source);
        assert.deepEqual(errors, []);
        assert.ok(descriptor.scriptSetup, entry.name);
        assert.ok(descriptor.template?.content.trim(), entry.name);
        assert.doesNotMatch(descriptor.template.content, /\bv-html\s*=|:innerHTML\s*=/i);
        assert.ok(imports.has(url.href), entry.name + ' debe estar registrada');
        views++;
      }
    }
  }
  await inspect(root);
  assert.ok(views > 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const ConfirmationDialog = await loadVueComponent(new URL('../src/components/shared/ConfirmationDialog.vue', import.meta.url));
const ResetPasswordForm = await loadVueComponent(new URL('../src/components/forms/ResetPasswordForm.vue', import.meta.url));
const InlineOwnerForm = await loadVueComponent(new URL('../src/components/forms/InlineOwnerForm.vue', import.meta.url));
const ModalFrame = await loadVueComponent(new URL('../src/components/shared/ModalFrame.vue', import.meta.url));

test('las confirmaciones escapan el texto y emiten una sola acción sin propagación', async () => {
  const events = [];
  const props = { prefix: '¿Eliminar ', boldText: '<Mascota>', suffix: '?', description: 'Se conserva el historial.', backLabel: 'Cancelar', confirmLabel: 'Eliminar', confirmAction: 'delete', confirmId: 'p1', confirmClass: 'danger', onAction: (...args) => events.push(args) };
  const html = await renderToString(createSSRApp(ConfirmationDialog, props));
  assert.match(html, /<b>&lt;Mascota&gt;<\/b>/);
  assert.match(html, /class="muted">Se conserva el historial\./);
  assert.match(html, /class="danger"/);
  const view = mountVueComponent(ConfirmationDialog, props);
  let stopped = 0;
  view.find(node => node.props['data-action'] === 'delete').props.onClick({ stopPropagation() { stopped++; } });
  assert.deepEqual(events, [['delete', 'p1']]);
  assert.equal(stopped, 1);
  view.unmount();
});

test('el modal compone el formulario real y conserva el cierre y el identificador del título', async () => {
  const html = await renderToString(createSSRApp(ModalFrame, { title: 'Restablecer contraseña', bodyComponent: ResetPasswordForm, bodyProps: { accountId: 'u1' } }));
  assert.match(html, /id="modal-title">Restablecer contraseña/);
  assert.match(html, /data-form="reset-password" data-id="u1"/);
  assert.match(html, /name="adminPassword"[^>]*required[^>]*autocomplete="current-password"/);
  assert.equal((html.match(/minlength="6"/g) || []).length, 2);
});

test('el registro de propietario desde una mascota mantiene su formulario y validaciones nativas', async () => {
  const html = await renderToString(createSSRApp(InlineOwnerForm));
  assert.match(html, /data-form="inline-owner"/);
  for (const name of ['name', 'dni', 'phone', 'email', 'address']) assert.ok(html.includes(`name="${name}"`));
  assert.match(html, /data-digits="9"/);
  assert.match(html, /data-person-name/);
  assert.match(html, /data-phone/);
  assert.match(html, /data-form-error(?:="")? class="error" role="alert"/);
  assert.match(html, /type="submit">Guardar/);
});

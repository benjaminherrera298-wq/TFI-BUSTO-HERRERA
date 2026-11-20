import test from 'node:test';
import assert from 'node:assert/strict';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { loadVueComponent } from './helpers/loadVueComponent.js';
import { mountVueComponent } from './helpers/mountVueComponent.js';

const ChargeTicketForm = await loadVueComponent(new URL('../src/components/tickets/ChargeTicketForm.vue', import.meta.url));
const ChargeMedicationRow = await loadVueComponent(new URL('../src/components/tickets/ChargeMedicationRow.vue', import.meta.url));
const TicketReceipt = await loadVueComponent(new URL('../src/components/tickets/TicketReceipt.vue', import.meta.url));
const ticket = { id: 't1', number: 'T-41001', status: 'Pendiente de cobro', date: '2026-01-01', time: '09:15', reason: 'Control', performed: 'Atención ficticia', vetName: 'Profesional de prueba', serviceAmount: 3000, total: 4200 };
const medication = { name: 'Medicamento <prueba>', quantity: '2', dose: '1 ml', route: 'Oral', notes: 'Con comida', price: 1200 };
const props = { ticket, pet: { name: 'Luna', code: '41001' }, owner: { name: 'Ana' }, medications: [medication], maxMoney: 1000000, formatMoney: amount => '$' + amount, formatDate: date => 'Fecha ' + date };
const html = (component, values) => renderToString(createSSRApp(component, values));

test('el formulario de cobro conserva datos, campos ocultos, restricciones y total inicial', async () => {
  const markup = await html(ChargeTicketForm, props);
  assert.match(markup, /data-form="charge" data-id="t1"/);
  for (const name of ['med-name[]', 'med-quantity[]', 'med-dose[]', 'med-route[]', 'med-notes[]']) assert.ok(markup.includes(`name="${name}"`), name);
  assert.match(markup, /name="med-price\[\]"[^>]*min="0"[^>]*step="1"[^>]*data-charge-price[^>]*required[^>]*max="1000000"/);
  assert.match(markup, /id="charge-total">\$4200/);
  assert.match(markup, /Medicamento &lt;prueba&gt;/);
  assert.match(markup, /Confirmar cobro/);
  assert.match(markup, /Luna/);
});

test('la suma visual conserva la regla anterior de importes positivos y redondeo', async () => {
  const markup = await html(ChargeTicketForm, { ...props, ticket: { ...ticket, serviceAmount: 10.2 }, medications: [{ price: -5 }, { price: 'texto' }, { price: 1.4 }] });
  assert.match(markup, /id="charge-total">\$12/);
  const empty = await html(ChargeTicketForm, { ...props, ticket: { ...ticket, serviceAmount: '' }, medications: [] });
  assert.match(empty, /Sin medicamentos indicados por el veterinario\./);
  assert.match(empty, /id="charge-total">\$0/);
});

test('la fila de cobro emite un precio sin modificar la medicación recibida', () => {
  const prices = [];
  const view = mountVueComponent(ChargeMedicationRow, { medication, price: 1200, maxMoney: 1000000, onPrice: value => prices.push(value) });
  view.find(node => node.props.name === 'med-price[]').props.onInput({ target: { value: '2500' } });
  assert.deepEqual(prices, ['2500']);
  assert.equal(medication.price, 1200);
  view.unmount();
});

test('el comprobante conserva conceptos, detalle, total y eventos de cerrar e imprimir', async () => {
  const values = { ...props, ticket: { ...ticket, status: 'Pagado', paidAt: '2026-01-01T12:15:00Z' }, clinicName: 'Veterinaria de prueba', paid: true, paidAtLabel: '1/1/2026, 09:15:00' };
  const markup = await html(TicketReceipt, values);
  for (const text of ['COMPROBANTE VETERINARIO', 'Pago realizado', 'T-41001', 'Luna', '41001', 'Ana', 'Dosis: 1 ml · Cant.: 2 · Vía: Oral · Obs.: Con comida', 'Atención / servicios', '$4200', 'Cobrado el 1/1/2026, 09:15:00', 'receipt-barcode']) assert.ok(markup.includes(text), text);
  const events = [];
  const view = mountVueComponent(TicketReceipt, { ...values, onAction: (...args) => events.push(args) });
  let stops = 0;
  for (const action of ['close', 'print']) {
    const button = view.find(node => node.props['data-action'] === action);
    button.props.onClick({ currentTarget: button, stopPropagation() { stops++; } });
  }
  assert.deepEqual(events.map(event => event.slice(0,2)), [['close', ''], ['print', '']]);
  assert.equal(stops, 2);
  view.unmount();
});

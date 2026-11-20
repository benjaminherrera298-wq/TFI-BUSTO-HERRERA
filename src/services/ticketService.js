import { MAX_MONEY, numericValue } from './validation.js';

export function createTicketService({ state, isAdmin, find, commit, load }) {
  function ticket(id) {
    return (state.db.tickets || []).find(item => item.id === id);
  }

  function pendingTickets() {
    return (state.db.tickets || [])
    .filter(item => item.status === 'Pendiente de cobro')
    .slice()
    .sort((a, b) =>
      String(b.date + ' ' + (b.time || '')).localeCompare(
      String(a.date + ' ' + (a.time || ''))
      )
    );
  }

  function charge(ticketId, fields) {
    if (!isAdmin()) throw new Error('No tenés permiso.');
    load();

    const chargedTicket = ticket(ticketId);

    if (!chargedTicket || chargedTicket.status !== 'Pendiente de cobro') {
      throw new Error('Ticket no disponible para el cobro.');
    }

    // Precios cargados por Administración: un precio por cada
    // medicamento + monto por atención. El total se calcula acá
    // (no se confía en el total mostrado) y se guarda medicamento
    // con su precio a la par, más snapshot de propietario, QR y
    // códigos para que el ticket guardado quede completo.
    const chargeNames = fields["med-name[]"];
    const chargeQuantities = fields["med-quantity[]"];
    const chargeDoses = fields["med-dose[]"];
    const chargeRoutes = fields["med-route[]"];
    const chargeNotes = fields["med-notes[]"];
    const chargePrices = fields["med-price[]"];

    const chargeMeds = chargeNames
    .map((name, index) => ({
      name: String(name || '').trim(),
      quantity: String(chargeQuantities[index] ?? '').trim(),
      dose: String(chargeDoses[index] ?? '').trim(),
      route: String(chargeRoutes[index] ?? '').trim(),
      notes: String(chargeNotes[index] ?? '').trim(),
      price: numericValue(chargePrices[index], `Precio de ${name || 'el concepto'}`, { max: MAX_MONEY, integer: true })
    }))
    .filter(medication => medication.name || Number.isFinite(medication.price));

    const badPrice = chargeMeds.find(
      medication => !Number.isFinite(medication.price) || medication.price < 0
    );

    if (badPrice) {
      throw new Error(`Ingresá un precio válido para "${badPrice.name || 'el concepto'}".`);
    }

    chargeMeds.forEach((medication, index) => {
      if (!medication.name) medication.name = `Concepto ${index + 1}`;
      if (!medication.quantity) medication.quantity = '';
      if (!medication.dose) medication.dose = '';
      if (!medication.route) medication.route = '';
      if (!medication.notes) medication.notes = '';
    });

    const serviceAmount = fields.serviceAmount === '' || fields.serviceAmount == null
    ? 0
    : numericValue(fields.serviceAmount, 'Atención / servicios', { max: MAX_MONEY, integer: true });

    if (!Number.isFinite(serviceAmount) || serviceAmount < 0) {
      throw new Error('Ingresá un monto válido en atención / servicios.');
    }

    const chargeTotal = serviceAmount + chargeMeds.reduce((sum, medication) => sum + medication.price, 0);

    if (!Number.isSafeInteger(chargeTotal) || chargeTotal > MAX_MONEY) throw new Error(`El total no puede superar $${MAX_MONEY}.`);

    if (chargeTotal <= 0) {
      throw new Error('El total debe ser mayor a 0. Cargá al menos un precio.');
    }

    const chargePet = find('pets', chargedTicket.petId);
    const chargeOwner = find('owners', chargedTicket.ownerId);

    if (commit(() => {
      chargedTicket.medications = chargeMeds;
      chargedTicket.serviceAmount = serviceAmount;
      chargedTicket.total = chargeTotal;
      chargedTicket.status = 'Pagado';
      chargedTicket.paidAt = new Date().toISOString();

      // Snapshot para que el ticket guardado lleve datos del
      // propietario, QR + código de la mascota y código del ticket.
      chargedTicket.petName = chargePet?.name || chargedTicket.petName || '';
      chargedTicket.petCode = chargePet?.code || chargedTicket.petCode || '';
      chargedTicket.petQr = chargePet?.qr || chargedTicket.petQr || '';
      chargedTicket.ownerName = chargeOwner?.name || '';
      chargedTicket.ownerDni = chargeOwner?.dni || '';
      chargedTicket.ownerPhone = chargeOwner?.phone || '';
      chargedTicket.ownerEmail = chargeOwner?.email || '';
      chargedTicket.ownerAddress = chargeOwner?.address || '';

      const entry = (state.db.waitingRoom || []).find(
        item => item.id === chargedTicket.waitingEntryId
      );

      if (entry) {
        entry.status = 'Pagado';
      }
    })) {
      return chargedTicket;
    }
  }

  return { ticket, pendingTickets, charge };
}

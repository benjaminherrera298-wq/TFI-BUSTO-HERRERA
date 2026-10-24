// Datos ficticios para recorrer los flujos de una veterinaria en actividad.
export function populateSamplePractice(db, reference = new Date()) {
  if (db.samplePracticeVersion === 1) return false;
  const date = offset => {
    const value = new Date(reference);
    value.setDate(value.getDate() + offset);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const stamp = (day, time) => new Date(`${day}T${time}:00`).toISOString();
  const collections = ['owners', 'pets', 'appointments', 'clinical', 'tickets', 'waitingRoom', 'reminders', 'products', 'notices'];
  collections.forEach(key => { db[key] ||= []; });
  const vets = db.vets.filter(vet => vet.active);
  const services = db.services.filter(service => service.active);
  if (!vets.length || !services.length) return false;
  const people = ['Camila Fernández', 'Santiago Acosta', 'Florencia Medina', 'Mateo Sosa', 'Sofía Romero', 'Nicolás Torres', 'Julieta Navarro', 'Agustín Castro', 'Martina Silva', 'Tomás Rojas', 'Paula Vega', 'Federico Molina'];
  const animals = [
    ['Nala', 'Gato', 'Europeo', 4.1], ['Simón', 'Perro', 'Mestizo', 15.2],
    ['Olivia', 'Perro', 'Caniche', 5.3], ['Coco', 'Gato', 'Siamés', 4.8],
    ['Mora', 'Perro', 'Labrador', 26.4], ['Rocky', 'Perro', 'Bóxer', 29.1],
    ['Frida', 'Gato', 'Europeo', 3.7], ['Teo', 'Perro', 'Beagle', 12.6],
    ['Kira', 'Perro', 'Pastor alemán', 30.2], ['Felipe', 'Gato', 'Mestizo', 5.1],
    ['Uma', 'Perro', 'Mestizo', 9.8], ['Rocco', 'Perro', 'Golden retriever', 31.5],
    ['Alma', 'Gato', 'Europeo', 3.9], ['Otto', 'Perro', 'Salchicha', 7.2],
    ['India', 'Perro', 'Mestizo', 18.4], ['Salem', 'Gato', 'Europeo', 4.6],
    ['Pipa', 'Perro', 'Caniche', 4.4], ['Boris', 'Gato', 'Mestizo', 5.7]
  ];
  people.forEach((name, i) => db.owners.push({
    id: `sample-owner-${i}`, name, dni: String(35000100 + i),
    phone: `381555${String(200 + i).padStart(4, '0')}`, email: `cliente${i + 1}@example.com`,
    address: `${['San Martín', 'Belgrano', 'Las Heras', 'Maipú'][i % 4]} ${320 + i * 45}`, active: true
  }));
  const codes = new Set(db.pets.map(pet => pet.code));
  animals.forEach(([name, species, breed, weight], i) => {
    let code = 70000 + i;
    while (codes.has(String(code))) code++;
    codes.add(String(code));
    db.pets.push({ id: `sample-pet-${i}`, name, species, breed, weight,
      sex: i % 2 ? 'Macho' : 'Hembra', birth: `${2018 + i % 7}-03-${String(5 + i).padStart(2, '0')}`,
      color: ['Negro', 'Blanco y marrón', 'Atigrado', 'Dorado'][i % 4],
      ownerId: `sample-owner-${i % people.length}`, observations: 'Datos ficticios de ejemplo. Seguimiento preventivo periódico.',
      photo: '', qr: `sample-qr-${i}`, code: String(code), active: true });
  });
  const reasons = ['Control clínico anual', 'Seguimiento de piel y pelaje', 'Control de peso', 'Revisión de salud bucal'];
  const pets = db.pets.filter(pet => pet.id.startsWith('sample-pet-'));
  pets.forEach((pet, i) => {
    const vet = vets[i % vets.length];
    const author = db.users.find(account => account.vetId === vet.id);
    [85 - i, 35 - i].forEach((ago, visit) => {
      const id = `sample-visit-${i}-${visit}`;
      const day = date(-ago);
      const time = `${String(9 + i % 7).padStart(2, '0')}:00`;
      const reason = reasons[(i + visit) % reasons.length];
      const total = 16000 + (i % 4) * 2500;
      db.appointments.push({ id: `${id}-appointment`, petId: pet.id, ownerId: pet.ownerId,
        vetId: vet.id, serviceId: services[0].id, date: day, time, duration: 30,
        status: 'Atendido', reason, observations: 'Atención registrada en historia clínica.' });
      db.clinical.push({ id, petId: pet.id, ownerId: pet.ownerId, vetId: vet.id,
        authorId: author?.id, authorName: vet.name, date: day, time, type: 'Consulta', title: reason,
        reason, diagnosis: visit ? 'Evolución favorable en control de seguimiento' : 'Evaluación preventiva',
        info: 'Examen clínico completo. Se conversó con el propietario sobre alimentación y cuidados.',
        performed: 'Evaluación clínica y registro de peso. Seguimiento programado.',
        weight: Number((pet.weight + (visit ? 0 : 0.3)).toFixed(1)), temperature: '38.3',
        medications: [], visible: true, ticketId: `${id}-ticket` });
      db.tickets.push({ id: `${id}-ticket`, number: `E-${i + 1}-${visit + 1}`, date: day, time,
        petId: pet.id, ownerId: pet.ownerId, vetId: vet.id, vetName: vet.name,
        reason, performed: 'Consulta y control clínico', medications: [], services: [],
        serviceAmount: total, total, clinicalId: id, status: 'Pagado', paidAt: stamp(day, time) });
    });
    let offset = i % 10;
    const openDays = (db.config.days || [1, 2, 3, 4, 5, 6]).map(Number);
    if (!openDays.length) return;
    while (!openDays.includes(new Date(`${date(offset)}T12:00:00`).getDay())) offset++;
    const time = `${String(9 + Math.floor(i / vets.length) % 7).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
    db.appointments.push({ id: `sample-upcoming-${i}`, petId: pet.id, ownerId: pet.ownerId,
      vetId: vet.id, serviceId: services[0].id, date: date(offset), time, duration: 30,
      status: i % 3 ? 'Confirmado' : 'Pendiente', reason: reasons[i % reasons.length], observations: '' });
    db.reminders.push({ id: `sample-reminder-${i}`, petId: pet.id,
      title: `Control preventivo de ${pet.name}`, date: date(5 + i), done: false, category: 'Control', source: 'vet' });
  });
  pets.slice(0, 3).forEach((pet, i) => {
    const vet = vets[i % vets.length];
    const entryId = `sample-waiting-${i}`;
    const reason = reasons[i];
    const status = ['Esperando', 'En atención', 'Pendiente de cobro'][i];
    const entry = { id: entryId, petId: pet.id, ownerId: pet.ownerId, petName: pet.name,
      enteredAt: stamp(date(0), `09:${String(i * 15).padStart(2, '0')}`), status, reason };
    if (i > 0) { entry.vetId = vet.id; entry.vetName = vet.name; }
    if (i === 2) {
      const clinicalId = 'sample-today-clinical';
      entry.ticketId = 'sample-today-ticket';
      entry.attentionId = clinicalId;
      db.clinical.push({ id: clinicalId, petId: pet.id, ownerId: pet.ownerId, date: date(0), time: '09:30',
        type: 'Consulta', title: reason, reason, diagnosis: 'Control preventivo', info: 'Paciente en buen estado general.',
        performed: 'Examen clínico y control de peso.', weight: pet.weight, medications: [],
        vetId: vet.id, authorName: vet.name, visible: true, waitingEntryId: entryId, ticketId: entry.ticketId });
      db.tickets.push({ id: entry.ticketId, number: 'E-HOY-001', petId: pet.id, ownerId: pet.ownerId,
        date: date(0), time: '09:30', vetId: vet.id, vetName: vet.name, reason,
        performed: 'Examen clínico y control de peso.', medications: [], services: [],
        total: 18500, serviceAmount: 18500, clinicalId, waitingEntryId: entryId, status });
    }
    db.waitingRoom.push(entry);
  });
  ['Alimento para gatos adultos 3 kg', 'Alimento para cachorros 3 kg', 'Comedero de acero', 'Correa regulable', 'Arena sanitaria 4 kg', 'Cepillo para mascotas'].forEach((name, i) => {
    db.products.push({ id: `sample-product-${i}`, name, category: i < 2 ? 'Nutrición' : 'Accesorios',
      description: 'Producto de ejemplo disponible en recepción.', price: [22000, 24500, 8500, 12000, 9500, 6500][i],
      stock: [18, 12, 7, 9, 3, 15][i], active: true, photo: '' });
  });
  db.notices.push({ id: 'sample-notice', title: 'Controles preventivos con turno',
    message: 'Reservá tu próxima consulta desde la agenda o comunicate con recepción.', date: date(-3), expires: date(30), active: true });
  db.samplePracticeVersion = 1;
  return true;
}

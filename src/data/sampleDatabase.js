import { DEMO_ACCOUNTS } from './demoAccounts.js';
import { today, addDays } from '../utils/dates.js';

export function createSampleDatabase(config, admin, uid) {
  const dbSeedCodes = new Set();
  const vets = [
    'Lucía Martínez',
    'Diego García',
    'Ana López',
    'Pablo Rodríguez'
  ].map((name, index) => ({
    id: 'v' + (index + 1),
    name,
    license: 'MP ' + (410 + index),
    specialty: [
      'Diagnóstico por imágenes',
      'Clínica general',
      'Medicina felina',
      'Cirugía'
    ][index],
    serviceIds: index === 0
      ? ['s1', 's2', 's3', 's4', 's5']
      : ['s1', 's3', 's4', 's5'],
    active: true
  }));

  const owners = [
    {
      id: 'o1',
      name: 'Benjamín Herrera',
      dni: '30111222',
      phone: '3815550101',
      email: 'cliente@correo.com',
      address: 'Los Aromos 240',
      active: true
    },
    {
      id: 'o2',
      name: 'Valentina Ruiz',
      dni: '32222333',
      phone: '3815550102',
      email: 'valentina@correo.com',
      address: 'San Martín 812',
      active: true
    },
    {
      id: 'o3',
      name: 'Juan Pérez',
      dni: '29333444',
      phone: '3815550103',
      email: 'juan@correo.com',
      address: 'Belgrano 154',
      active: true
    }
  ];

  const pets = [
    'Lola',
    'Toby',
    'Michi',
    'Max',
    'Luna',
    'Bruno'
  ].map((name, index) => {
    let code = '';

    do {
      code = String(Math.floor(10000 + Math.random() * 90000));
    } while (
      dbSeedCodes.has(code)
    );

    dbSeedCodes.add(code);

    return {
      id: 'p' + (index + 1),
      name,
      species: index === 2 || index === 4 ? 'Gato' : 'Perro',
      breed: [
        'Caniche',
        'Mestizo',
        'Europeo',
        'Labrador',
        'Siamés',
        'Golden'
      ][index],
      sex: index % 2 ? 'Macho' : 'Hembra',
      birth: '2022-04-10',
      weight: [3.9, 12, 4.2, 24, 3.6, 28][index],
      color: 'Marrón y blanco',
      ownerId: index < 3 ? 'o1' : index < 5 ? 'o2' : 'o3',
      observations: 'Paciente de demostración',
      photo: '',
      qr: uid(),
      code,
      active: true
    };
  });

  const services = [
    'Consulta clínica',
    'Ecografía',
    'Vacunación',
    'Control',
    'Desparasitación'
  ].map((name, index) => ({
    id: 's' + (index + 1),
    name,
    duration: 30,
    description: 'Atención en la veterinaria.',
    active: true
  }));

  const schedules = [
    {
      id: uid(),
      vetId: 'v1',
      serviceId: 's2',
      day: 3,
      start: '09:00',
      end: '13:00',
      duration: 30,
      active: true
    }
  ];

  vets.forEach(vet => {
    [1, 2, 3, 4, 5, 6].forEach(day => {
      ['s1', 's3', 's4', 's5'].forEach(serviceId => {
        schedules.push({
          id: uid(),
          vetId: vet.id,
          serviceId,
          day,
          start: '09:00',
          end: '17:00',
          duration: 30,
          active: true
        });
      });
    });
  });

  return {
    configured: true,
    config,

    users: [
      {
        ...admin,
        id: uid(),
        role: 'admin',
        active: true,
        principal: true
      },
      ...DEMO_ACCOUNTS
        .filter(account =>
          account.email.toLowerCase() !== admin.email.toLowerCase()
        )
        .map(account => ({ ...account }))
    ],

    vets,
    owners,
    pets,
    services,
    schedules,

    clinical: pets.map(pet => ({
      id: uid(),
      petId: pet.id,
      date: addDays(today(), -12),
      type: 'Consulta',
      title: 'Control general',
      info: 'Control clínico de rutina. Paciente activo, sin novedades.',
      diagnosis: 'Control preventivo',
      weight: pet.weight,
      vetId: 'v1',
      authorId: 'u-v1',
      authorName: 'Lucía Martínez',
      visible: true
    })),

    products: [
      {
        id: uid(),
        name: 'Alimento adulto balanceado',
        category: 'Nutrición',
        description: 'Bolsa de 3 kg. Consultá la variedad indicada para tu mascota.',
        price: 18500,
        stock: 14,
        active: true,
        photo: ''
      },
      {
        id: uid(),
        name: 'Pipeta para perros',
        category: 'Cuidado',
        description: 'Presentación según peso. Consultá al profesional.',
        price: 7200,
        stock: 8,
        active: true,
        photo: ''
      },
      {
        id: uid(),
        name: 'Transportadora mediana',
        category: 'Accesorios',
        description: 'Base rígida y ventilación lateral.',
        price: 45000,
        stock: 3,
        active: true,
        photo: ''
      }
    ],

    notices: [
      {
        id: uid(),
        title: 'Bienvenidos a nuestro espacio de cuidado',
        message: 'Ya podés consultar la información de tus mascotas y sus próximos cuidados desde tu cuenta.',
        date: today(),
        expires: '',
        active: true
      }
    ],

    notifications: [],
    agendaNotes: [],

    reminders: [
      {
        id: uid(),
        petId: 'p1',
        title: 'Control anual de Lola',
        date: addDays(today(), 7),
        done: false
      },
      {
        id: uid(),
        petId: 'p3',
        title: 'Próxima desparasitación de Michi',
        date: addDays(today(), 12),
        done: false
      }
    ],

    // Sala de espera del administrador: mascotas ingresadas mediante el
    // escaneo de su QR, a la espera de ser atendidas. Estados posibles:
    // 'Esperando' → 'En atención' → 'Pendiente de cobro' → 'Pagado'.
    waitingRoom: [],

    // Tickets generados por el veterinario al finalizar una atención.
    // Administración los recibe para realizar el cobro correspondiente.
    tickets: []
  };
}

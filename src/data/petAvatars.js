// Retratos vectoriales locales: no necesitan red y conservan su color al usarse en <img>.
const outline = '#374151'

function portrait(background, drawing) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none"><rect width="160" height="160" rx="38" fill="${background}"/><circle cx="80" cy="84" r="61" fill="#fff" opacity=".32"/><ellipse cx="80" cy="140" rx="41" ry="7" fill="${outline}" opacity=".09"/><g stroke="${outline}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function eyes(color = '#27313E', y = 80) {
  return `<ellipse cx="61" cy="${y}" rx="4" ry="5" fill="${color}" stroke="none"/><ellipse cx="99" cy="${y}" rx="4" ry="5" fill="${color}" stroke="none"/><circle cx="62" cy="${y - 2}" r="1.2" fill="#fff" stroke="none"/><circle cx="100" cy="${y - 2}" r="1.2" fill="#fff" stroke="none"/>`
}

function dogMouth(muzzle = '#FFF4E4', y = 103) {
  return `<ellipse cx="80" cy="${y}" rx="24" ry="19" fill="${muzzle}" stroke="none"/><path d="M73 ${y - 5} Q80 ${y - 10} 87 ${y - 5} Q86 ${y + 2} 80 ${y + 3} Q74 ${y + 2} 73 ${y - 5}Z" fill="#303540" stroke="none"/><path d="M80 ${y + 3}v7m0-1q-8 7-14 0m14 0q8 7 14 0" stroke-width="2.5"/>`
}

const dogHead = 'M43 64Q42 40 80 38Q118 40 117 64L119 96Q115 127 80 131Q45 127 41 96Z'
const catHead = 'M42 69Q42 49 80 46Q118 49 118 69L122 98Q119 124 80 129Q41 124 38 98Z'

function dog({ background, coat, ears, details = '', muzzle, eyeColor, before = '', head = dogHead }) {
  return portrait(background, `${before}${ears}<path d="${head}" fill="${coat}"/><clipPath id="face"><path d="${head}"/></clipPath><g clip-path="url(#face)" stroke="none">${details}</g>${eyes(eyeColor)}${dogMouth(muzzle)}`)
}

function floppyEars(fill) {
  return `<path d="M46 49Q23 48 23 78Q24 105 41 103L53 65Z" fill="${fill}"/><path d="M114 49Q137 48 137 78Q136 105 119 103L107 65Z" fill="${fill}"/>`
}

function pointedEars(fill, inner) {
  return `<path d="M45 65L37 18Q63 23 68 48Z" fill="${fill}"/><path d="M115 65L123 18Q97 23 92 48Z" fill="${fill}"/><path d="M46 47L43 30L57 46M114 47L117 30L103 46" fill="${inner}" stroke="none"/>`
}

function cat({ background, coat, details = '', ear = coat, inner = '#F0A5AD', muzzle = '#FFF9F0', eyeColor = '#3F5965' }) {
  return portrait(background, `<path d="M42 73L35 26Q57 29 66 50M118 73L125 26Q103 29 94 50" fill="${ear}"/><path d="M45 54L42 37L56 48M115 54L118 37L104 48" fill="${inner}" stroke="none"/><path d="${catHead}" fill="${coat}"/><clipPath id="face"><path d="${catHead}"/></clipPath><g clip-path="url(#face)" stroke="none">${details}</g>${eyes(eyeColor, 82)}<ellipse cx="80" cy="106" rx="22" ry="16" fill="${muzzle}" stroke="none"/><path d="M74 99Q80 95 86 99L80 105Z" fill="#D77F8F" stroke="none"/><path d="M80 105v6m0-1q-6 6-11 0m11 0q6 6 11 0M52 102L25 98m27 13l-26 5m82-14l27-4m-27 13l26 5" stroke-width="2"/>`)
}

const avatars = [
  {
    id: 'perro-dalmata', label: 'Dálmata', group: 'Perros',
    src: dog({
      background: '#DCEEF6', coat: '#FFFEFA', muzzle: '#FFF8ED',
      ears: `${floppyEars('#FFFDF7')}<path d="M25 65Q27 51 39 52L43 68Q37 83 26 79Z" fill="#343B45" stroke="none"/><ellipse cx="127" cy="86" rx="8" ry="13" fill="#343B45" stroke="none"/>`,
      details: '<ellipse cx="51" cy="58" rx="10" ry="12" fill="#343B45"/><ellipse cx="99" cy="48" rx="8" ry="7" fill="#343B45"/><ellipse cx="108" cy="94" rx="8" ry="11" fill="#343B45"/><ellipse cx="50" cy="108" rx="6" ry="7" fill="#343B45"/><circle cx="80" cy="66" r="5" fill="#343B45"/><circle cx="93" cy="120" r="4" fill="#343B45"/>',
    }),
  },
  {
    id: 'perro-golden', label: 'Golden retriever', group: 'Perros',
    src: dog({
      background: '#E1F0DD', coat: '#F1BF68', muzzle: '#FFE5AE',
      ears: '<path d="M49 49Q24 43 20 71L23 100L30 96L35 108L44 98L55 62Z" fill="#D99D43"/><path d="M111 49Q136 43 140 71L137 100L130 96L125 108L116 98L105 62Z" fill="#D99D43"/>',
      details: '<path d="M63 45l11 11l7-15l8 13l10-9" fill="#FFDA90"/><path d="M43 100l14 13l-2 11l-15-11M117 100l-14 13l2 11l15-11" fill="#FFE0A1"/>',
    }),
  },
  {
    id: 'perro-labrador-negro', label: 'Labrador negro', group: 'Perros',
    src: dog({
      background: '#FBE4CC', coat: '#454E60', muzzle: '#737B88', eyeColor: '#121926',
      ears: floppyEars('#303847'),
      details: '<path d="M62 48Q80 37 99 49L94 59Q80 52 65 60Z" fill="#5F6879"/><ellipse cx="56" cy="74" rx="8" ry="5" fill="#A69A8C"/><ellipse cx="104" cy="74" rx="8" ry="5" fill="#A69A8C"/>',
    }),
  },
  {
    id: 'perro-beagle', label: 'Beagle', group: 'Perros',
    src: dog({
      background: '#F5E0EB', coat: '#E2A363', muzzle: '#FFFAEE',
      ears: floppyEars('#B76F3D'),
      details: '<path d="M40 35H120L111 69L95 59L80 74L65 59L49 69Z" fill="#55515A"/><path d="M77 41L83 41L89 75L99 104L80 125L61 104L71 75Z" fill="#FFF9E9"/>',
    }),
  },
  {
    id: 'perro-pastor-aleman', label: 'Pastor alemán', group: 'Perros',
    src: dog({
      background: '#DDE9D8', coat: '#C99755', muzzle: '#B67D44',
      ears: pointedEars('#A97742', '#6A5149'),
      details: '<path d="M39 35H121L108 71L94 65L80 86L66 65L52 71Z" fill="#3E424B"/><path d="M63 98Q80 83 97 98L100 117L80 130L60 117Z" fill="#56515A"/><ellipse cx="59" cy="72" rx="8" ry="4" fill="#DDAE72"/><ellipse cx="101" cy="72" rx="8" ry="4" fill="#DDAE72"/>',
    }),
  },
  {
    id: 'perro-caniche', label: 'Caniche', group: 'Perros',
    src: dog({
      background: '#E9E2F6', coat: '#F6E8DC', muzzle: '#FFF9F0',
      ears: '<path d="M43 54C29 47 21 60 24 70C13 78 19 92 25 94C20 108 38 119 48 105L54 67Z" fill="#DFC7B4"/><path d="M117 54C131 47 139 60 136 70C147 78 141 92 135 94C140 108 122 119 112 105L106 67Z" fill="#DFC7B4"/>',
      details: '<path d="M42 56C35 44 46 32 57 36C59 22 77 22 82 31C92 21 109 29 107 40C123 40 126 57 114 64C103 69 95 64 89 63C79 72 68 65 64 62C51 68 43 65 42 56Z" fill="#FFFCF5"/>',
    }),
  },
  {
    id: 'perro-salchicha', label: 'Salchicha', group: 'Perros',
    src: dog({
      background: '#DCECE8', coat: '#B97042', muzzle: '#DCA06B',
      head: 'M48 61Q47 39 80 38Q113 39 112 61L110 101Q103 132 80 136Q57 132 50 101Z',
      ears: '<path d="M50 49Q30 42 26 66L28 109Q30 124 42 120Q53 118 53 102L59 62Z" fill="#8E4F35"/><path d="M110 49Q130 42 134 66L132 109Q130 124 118 120Q107 118 107 102L101 62Z" fill="#8E4F35"/>',
      details: '<ellipse cx="60" cy="69" rx="8" ry="4" fill="#E3AA6B"/><ellipse cx="100" cy="69" rx="8" ry="4" fill="#E3AA6B"/><path d="M74 48Q80 43 86 48L90 91H70Z" fill="#CA8751"/>',
    }),
  },
  {
    id: 'perro-husky', label: 'Husky', group: 'Perros',
    src: dog({
      background: '#DDEBF8', coat: '#77889D', muzzle: '#FFFEF5', eyeColor: '#2789C0',
      ears: pointedEars('#77889D', '#D6C0C2'),
      details: '<path d="M80 47L91 70Q114 56 118 88L125 113L104 131H56L35 113L42 88Q46 56 69 70Z" fill="#FCFCF5"/><path d="M52 65L66 68L71 77L59 74M108 65L94 68L89 77L101 74" fill="#46576F"/>',
    }),
  },
  {
    id: 'gato-atigrado', label: 'Atigrado', group: 'Gatos',
    src: cat({
      background: '#E3EEDB', coat: '#AAA69C', muzzle: '#F8F0DC',
      details: '<path d="M55 43L69 48L72 67L63 62ZM76 42H84L80 68ZM105 43L91 48L88 67L97 62ZM36 79L53 88L36 93ZM124 79L107 88L124 93ZM36 101L52 103L41 113ZM124 101L108 103L119 113Z" fill="#62635F"/>',
      eyeColor: '#58723F',
    }),
  },
  {
    id: 'gato-siames', label: 'Siamés', group: 'Gatos',
    src: cat({
      background: '#E1EAF8', coat: '#F4E5CC', ear: '#69534B', inner: '#B18B82', muzzle: '#BA9B86', eyeColor: '#2E8AC0',
      details: '<path d="M60 58Q80 68 100 58L116 88Q114 118 80 125Q46 118 44 88Z" fill="#80675A"/><path d="M77 61H83L88 91H72Z" fill="#9A7C65"/>',
    }),
  },
  {
    id: 'gato-negro', label: 'Negro', group: 'Gatos',
    src: cat({
      background: '#E8DFF4', coat: '#414855', inner: '#B7889F', muzzle: '#646B78', eyeColor: '#C9BC58',
      details: '<path d="M62 51Q80 43 98 51L93 59Q80 54 67 61Z" fill="#565F6D"/>',
    }),
  },
  {
    id: 'gato-blanco', label: 'Blanco', group: 'Gatos',
    src: cat({
      background: '#DDECE9', coat: '#FFFEF7', muzzle: '#F6EEE8', eyeColor: '#6AABD0',
      details: '<path d="M42 91L48 108L57 115L44 113L38 101M118 91L112 108L103 115L116 113L122 101" fill="#E7E6DE"/>',
    }),
  },
  {
    id: 'gato-carey', label: 'Carey', group: 'Gatos',
    src: cat({
      background: '#F1E4DB', coat: '#57505A', ear: '#57505A', muzzle: '#E9C39B', eyeColor: '#C5AE57',
      details: '<path d="M40 44Q62 35 77 52L73 76L52 86L38 69Z" fill="#DCA05A"/><path d="M86 42L113 48L125 72L110 85L94 69Z" fill="#BF7548"/><path d="M101 92Q124 87 125 112L107 129L83 117Z" fill="#E6B56C"/><path d="M33 98L51 94L67 110L55 128L35 119Z" fill="#BA754D"/><path d="M78 46L90 58L84 83L74 76Z" fill="#F3CE91"/>',
    }),
  },
  {
    id: 'gato-naranja', label: 'Naranja', group: 'Gatos',
    src: cat({
      background: '#E4EDF9', coat: '#EEAE63', muzzle: '#FFF0D3', eyeColor: '#7F7343',
      details: '<path d="M55 44L67 49L72 67L63 62ZM77 43H84L80 68ZM105 44L93 49L88 67L97 62ZM37 78L53 87L36 93ZM123 78L107 87L124 93ZM37 102L52 104L41 113ZM123 102L108 104L119 113Z" fill="#CA7D3E"/>',
    }),
  },
  {
    id: 'otro-conejo', label: 'Conejo', group: 'Otros animales',
    src: portrait('#E7DEF4', '<path d="M50 70Q31 13 48 11Q66 9 69 63M91 63Q94 9 112 11Q129 13 110 70" fill="#FFF9EF"/><path d="M52 52Q44 22 49 21Q57 21 59 52M101 52Q103 21 111 21Q116 22 108 52" stroke="#EFB6C0" stroke-width="9"/><path d="M42 84Q44 58 80 58Q116 58 118 84L119 106Q114 135 80 137Q46 135 41 106Z" fill="#FFF9EF"/> ' + eyes('#4A4958', 91) + '<ellipse cx="80" cy="114" rx="20" ry="15" fill="#F5E7DF" stroke="none"/><path d="M74 107Q80 103 86 107L80 114Z" fill="#D78D9E" stroke="none"/><path d="M80 114v6m0-1q-6 5-11 0m11 0q6 5 11 0M55 111l-27-4m28 11l-27 5m76-12l27-4m-28 11l27 5" stroke-width="2"/>'),
  },
  {
    id: 'otro-cobayo', label: 'Cobayo', group: 'Otros animales',
    src: portrait('#E0EFE1', '<circle cx="47" cy="61" r="17" fill="#BA825B"/><circle cx="113" cy="61" r="17" fill="#FFF7E8"/><circle cx="47" cy="61" r="9" fill="#DEAC9B" stroke="none"/><circle cx="113" cy="61" r="9" fill="#E8C3B9" stroke="none"/><path d="M30 101Q29 53 80 51Q131 53 130 101Q130 138 80 139Q30 138 30 101Z" fill="#F2C68E"/><clipPath id="face"><path d="M30 101Q29 53 80 51Q131 53 130 101Q130 138 80 139Q30 138 30 101Z"/></clipPath><g clip-path="url(#face)" stroke="none"><path d="M21 52L74 40L73 99L50 121L22 107Z" fill="#BA825B"/><path d="M76 43L97 46L91 90L110 130L72 145L58 116Z" fill="#FFFAEB"/></g>' + eyes('#38343D', 87) + '<ellipse cx="80" cy="110" rx="22" ry="16" fill="#FFF4DF" stroke="none"/><path d="M74 104Q80 100 86 104L80 110Z" fill="#B8797B" stroke="none"/><path d="M80 110v7m0-1q-7 5-11 0m11 0q7 5 11 0M55 107l-23-2m23 10l-22 5m72-13l23-2m-23 10l22 5" stroke-width="2"/>'),
  },
  {
    id: 'otro-hamster', label: 'Hámster', group: 'Otros animales',
    src: portrait('#F7E7CF', '<circle cx="44" cy="51" r="21" fill="#D7A66F"/><circle cx="116" cy="51" r="21" fill="#D7A66F"/><circle cx="44" cy="51" r="12" fill="#F0BDB4" stroke="none"/><circle cx="116" cy="51" r="12" fill="#F0BDB4" stroke="none"/><path d="M35 81Q40 43 80 44Q120 43 125 81Q142 128 110 137Q80 146 50 137Q18 128 35 81Z" fill="#E8BC83"/><path d="M32 104Q42 87 61 100Q80 113 99 100Q118 87 128 104Q133 136 80 141Q27 136 32 104Z" fill="#FFF6DF" stroke="none"/>' + eyes('#3D3740', 85) + '<ellipse cx="46" cy="110" rx="12" ry="9" fill="#F3CCB0" stroke="none"/><ellipse cx="114" cy="110" rx="12" ry="9" fill="#F3CCB0" stroke="none"/><path d="M74 100Q80 96 86 100L80 107Z" fill="#D98D93" stroke="none"/><path d="M80 107v8m0-1q-7 6-12 0m12 0q7 6 12 0" stroke-width="2"/><path d="M75 119h10v8h-10Z" fill="#fff" stroke-width="2"/><path d="M80 120v6" stroke-width="1.5"/>'),
  },
  {
    id: 'otro-loro', label: 'Loro', group: 'Otros animales',
    src: portrait('#F8E5D4', '<path d="M55 126L49 145L71 136M105 126L111 145L89 136" fill="#378F7B"/><path d="M40 94Q36 49 80 39Q124 49 120 94L114 124Q80 151 46 124Z" fill="#65B987"/><path d="M65 45Q75 23 83 28L83 42Q97 25 104 35L94 49" fill="#E7BF58"/><path d="M43 90Q34 104 41 124L57 130L63 100M117 90Q126 104 119 124L103 130L97 100" fill="#3F9C79"/><ellipse cx="61" cy="80" rx="17" ry="20" fill="#F4F0D8" stroke="none"/><ellipse cx="99" cy="80" rx="17" ry="20" fill="#F4F0D8" stroke="none"/>' + eyes('#293E43', 81) + '<path d="M65 98Q80 79 95 98Q96 115 80 128Q76 109 65 98Z" fill="#E7AB45"/><path d="M80 96Q85 105 80 119" stroke="#B77832" stroke-width="2"/><path d="M54 127q26 11 52 0" stroke="#7DCA95" stroke-width="5"/>'),
  },
  {
    id: 'otro-tortuga', label: 'Tortuga', group: 'Otros animales',
    src: portrait('#DBEDF0', '<path d="M48 105Q27 110 27 129Q42 137 57 124M112 105Q133 110 133 129Q118 137 103 124" fill="#A1BD73"/><path d="M80 63Q34 62 34 110Q37 141 80 143Q123 141 126 110Q126 62 80 63Z" fill="#638C64"/><path d="M80 77L100 91L95 116H65L60 91Z" fill="#8DA86B"/><path d="M80 77V64M60 91L39 87M65 116L52 134M95 116L108 134M100 91L121 87" stroke="#41694F"/><path d="M49 72Q47 39 80 38Q113 39 111 72L107 94Q80 118 53 94Z" fill="#B7CD84"/>' + eyes('#3A5147', 70) + '<ellipse cx="49" cy="86" rx="7" ry="5" fill="#D7D995" stroke="none"/><ellipse cx="111" cy="86" rx="7" ry="5" fill="#D7D995" stroke="none"/><path d="M65 89Q80 104 95 89" stroke-width="2.5"/><circle cx="74" cy="84" r="2" fill="#67835D" stroke="none"/><circle cx="86" cy="84" r="2" fill="#67835D" stroke="none"/>'),
  },
  {
    id: 'otro-huron', label: 'Hurón', group: 'Otros animales',
    src: portrait('#E8E2F1', '<circle cx="47" cy="48" r="18" fill="#8D776D"/><circle cx="113" cy="48" r="18" fill="#8D776D"/><circle cx="47" cy="48" r="10" fill="#DFB7AD" stroke="none"/><circle cx="113" cy="48" r="10" fill="#DFB7AD" stroke="none"/><path d="M44 69Q45 44 80 43Q115 44 116 69L112 99Q104 128 80 139Q56 128 48 99Z" fill="#D4C3A9"/><path d="M44 67Q58 58 80 75Q102 58 116 67L111 94L94 100L80 90L66 100L49 94Z" fill="#6D5B57" stroke="none"/>' + eyes('#262C33', 80) + '<path d="M65 100Q80 88 95 100L97 118L80 134L63 118Z" fill="#FFF3DC" stroke="none"/><path d="M73 104Q80 99 87 104L80 112Z" fill="#B87E80" stroke="none"/><path d="M80 112v8m0-1q-6 5-10 0m10 0q6 5 10 0M57 108l-23-4m24 12l-22 5m67-13l23-4m-24 12l22 5" stroke-width="2"/>'),
  },
]

export const PET_AVATARS = Object.freeze(avatars.map(avatar => Object.freeze(avatar)))

export function findPetAvatar(id) {
  return PET_AVATARS.find(avatar => avatar.id === id)
}

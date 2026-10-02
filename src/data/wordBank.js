export const builtInWordBank = [
  // Nivel 1 · muy significativas y concretas
  { id:'lautaro', word:'LAUTARO', emoji:'🦸', syllables:['LAU','TA','RO'], tier:1, category:'Personas' },
  { id:'mama', word:'MAMÁ', emoji:'❤️', syllables:['MA','MÁ'], tier:1, category:'Personas' },
  { id:'agua', word:'AGUA', emoji:'💧', syllables:['A','GUA'], tier:1, category:'Comida' },
  { id:'casa', word:'CASA', emoji:'🏠', syllables:['CA','SA'], tier:1, category:'Casa' },
  { id:'pan', word:'PAN', emoji:'🍞', syllables:['PAN'], tier:1, category:'Comida' },
  { id:'auto', word:'AUTO', emoji:'🚗', syllables:['AU','TO'], tier:1, category:'Objetos' },
  { id:'mano', word:'MANO', emoji:'✋', syllables:['MA','NO'], tier:1, category:'Cuerpo' },
  { id:'sol', word:'SOL', emoji:'☀️', syllables:['SOL'], tier:1, category:'Entorno' },

  // Nivel 2 · acciones y objetos cotidianos
  { id:'mesa', word:'MESA', emoji:'🪑', syllables:['ME','SA'], tier:2, category:'Casa' },
  { id:'vaso', word:'VASO', emoji:'🥛', syllables:['VA','SO'], tier:2, category:'Casa' },
  { id:'cama', word:'CAMA', emoji:'🛏️', syllables:['CA','MA'], tier:2, category:'Casa' },
  { id:'papa', word:'PAPÁ', emoji:'👨', syllables:['PA','PÁ'], tier:2, category:'Personas' },
  { id:'gato', word:'GATO', emoji:'🐱', syllables:['GA','TO'], tier:2, category:'Animales' },
  { id:'perro', word:'PERRO', emoji:'🐶', syllables:['PE','RRO'], tier:2, category:'Animales' },
  { id:'come', word:'COME', emoji:'🍽️', syllables:['CO','ME'], tier:2, category:'Acciones' },
  { id:'toma', word:'TOMA', emoji:'🥤', syllables:['TO','MA'], tier:2, category:'Acciones' },

  // Nivel 3 · vocabulario funcional y de interés
  { id:'ayuda', word:'AYUDA', emoji:'🤝', syllables:['A','YU','DA'], tier:3, category:'Comunicación' },
  { id:'quiero', word:'QUIERO', emoji:'🙋', syllables:['QUIE','RO'], tier:3, category:'Comunicación' },
  { id:'no', word:'NO', emoji:'🚫', syllables:['NO'], tier:3, category:'Comunicación' },
  { id:'si', word:'SÍ', emoji:'✅', syllables:['SÍ'], tier:3, category:'Comunicación' },
  { id:'bano', word:'BAÑO', emoji:'🚻', syllables:['BA','ÑO'], tier:3, category:'Casa' },
  { id:'mochila', word:'MOCHILA', emoji:'🎒', syllables:['MO','CHI','LA'], tier:3, category:'Objetos' },
  { id:'zapato', word:'ZAPATO', emoji:'👟', syllables:['ZA','PA','TO'], tier:3, category:'Objetos' },
  { id:'pelota', word:'PELOTA', emoji:'⚽', syllables:['PE','LO','TA'], tier:3, category:'Objetos' },
  { id:'heroe', word:'HÉROE', emoji:'🦸', syllables:['HÉ','RO','E'], tier:3, category:'Héroes' },
  { id:'fuerza', word:'FUERZA', emoji:'💪', syllables:['FUER','ZA'], tier:3, category:'Héroes' },

  // Nivel 4 · más longitud, conceptos y frases futuras
  { id:'verde', word:'VERDE', emoji:'🟢', syllables:['VER','DE'], tier:4, category:'Colores' },
  { id:'rojo', word:'ROJO', emoji:'🔴', syllables:['RO','JO'], tier:4, category:'Colores' },
  { id:'grande', word:'GRANDE', emoji:'🐘', syllables:['GRAN','DE'], tier:4, category:'Conceptos' },
  { id:'chico', word:'CHICO', emoji:'🐭', syllables:['CHI','CO'], tier:4, category:'Conceptos' },
  { id:'arriba', word:'ARRIBA', emoji:'⬆️', syllables:['A','RRI','BA'], tier:4, category:'Conceptos' },
  { id:'abajo', word:'ABAJO', emoji:'⬇️', syllables:['A','BA','JO'], tier:4, category:'Conceptos' },
  { id:'salta', word:'SALTA', emoji:'⬆️', syllables:['SAL','TA'], tier:4, category:'Acciones' },
  { id:'corre', word:'CORRE', emoji:'🏃', syllables:['CO','RRE'], tier:4, category:'Acciones' },
  { id:'mira', word:'MIRA', emoji:'👀', syllables:['MI','RA'], tier:4, category:'Acciones' },
  { id:'abre', word:'ABRE', emoji:'🚪', syllables:['A','BRE'], tier:4, category:'Acciones' },

  // Nivel 5 · vocabulario más complejo y funcional
  { id:'escuela', word:'ESCUELA', emoji:'🏫', syllables:['ES','CUE','LA'], tier:5, category:'Entorno' },
  { id:'familia', word:'FAMILIA', emoji:'👨‍👩‍👦', syllables:['FA','MI','LIA'], tier:5, category:'Personas' },
  { id:'comer', word:'COMER', emoji:'🍽️', syllables:['CO','MER'], tier:5, category:'Acciones' },
  { id:'dormir', word:'DORMIR', emoji:'😴', syllables:['DOR','MIR'], tier:5, category:'Acciones' },
  { id:'jugar', word:'JUGAR', emoji:'🎮', syllables:['JU','GAR'], tier:5, category:'Acciones' },
  { id:'contento', word:'CONTENTO', emoji:'😊', syllables:['CON','TEN','TO'], tier:5, category:'Emociones' },
  { id:'triste', word:'TRISTE', emoji:'😢', syllables:['TRIS','TE'], tier:5, category:'Emociones' },
  { id:'cansado', word:'CANSADO', emoji:'🥱', syllables:['CAN','SA','DO'], tier:5, category:'Emociones' },
  { id:'espera', word:'ESPERA', emoji:'⏳', syllables:['ES','PE','RA'], tier:5, category:'Acciones' },
  { id:'primero', word:'PRIMERO', emoji:'1️⃣', syllables:['PRI','ME','RO'], tier:5, category:'Conceptos' },
  { id:'despues', word:'DESPUÉS', emoji:'➡️', syllables:['DES','PUÉS'], tier:5, category:'Conceptos' },
]

export const starterWords = builtInWordBank.filter(word => word.tier === 1)

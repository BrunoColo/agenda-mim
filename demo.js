'use strict';
// Datos de ejemplo: alumnos, horarios y notas inventados. Usa las utilidades de app.js.

// Si cambia este número, los teléfonos que siguen en modo ejemplo vuelven a cargarlo.
const SEMILLA_V = 2;

// Por instrumento, uno o más recorridos de seis clases (de la más vieja a la más nueva): [nota, para practicar]
const NOTAS = {
  Piano: [
    [['Posición de la mano y los cinco dedos en Do. Tocó Estrellita con la derecha.', 'Estrellita con la mano derecha, 5 minutos por día.'],
      ['Estrellita con las dos manos por separado. Empezamos a leer Do, Re y Mi en el pentagrama.', 'Mano izquierda sola, lento.'],
      ['Juntamos las manos en Estrellita. Se traba en el cambio de posición.', 'Compases 5 a 8 con manos juntas.'],
      ['Himno a la alegría, mano derecha. Trabajamos el pulso con palmas.', 'Himno a la alegría contando en voz alta.'],
      ['Himno a la alegría con la izquierda acompañando en redondas.', 'Manos juntas, muy lento.'],
      ['Tocó el Himno entero sin parar. Empezamos la escala de Do mayor.', 'Escala de Do, una octava, cada mano por separado.']],
    [['Escalas de Do y Sol a dos manos. Un rato de lectura a primera vista.', 'Escala de Sol, dos octavas.'],
      ['Minueto en Sol: primera frase, con la digitación marcada en la partitura.', 'Compases 1 a 8, mano derecha.'],
      ['Minueto con manos juntas hasta el compás 8. Revisar el dedo 4.', 'Compases 1 a 8 con metrónomo a 60.'],
      ['Segunda parte del Minueto. Trabajamos matices: fuerte y suave.', 'Segunda parte, manos separadas.'],
      ['Para Elisa: el motivo principal. Le salió el cruce de manos.', 'Primeros 8 compases, lento.'],
      ['Para Elisa, primera parte con manos juntas. Hay que cuidar el pedal.', 'Compases 9 a 16, lento y sin pedal.']],
  ],
  Guitarra: [
    [['Postura, nombre de las cuerdas y pulsación con el pulgar.', 'Cuerdas al aire, diciendo el nombre de cada una.'],
      ['Acordes de Mi menor y La menor. Cambio lento entre los dos.', 'Cambio de Mi menor a La menor, 20 veces.'],
      ['Sumamos Do y Sol. Le cuesta el cambio a Do.', 'Cambio de Sol a Do, despacio.'],
      ['Rasgueo abajo, abajo, arriba. Primera canción con dos acordes.', 'La canción con rasgueo, todavía sin cantar.'],
      ['Canción completa con cuatro acordes. Empezamos a cantar encima.', 'La canción entera, cantando encima.'],
      ['Repasamos la canción y sumamos el Re. Afinamos con el afinador.', 'Ronda de Sol, Re y Do sin mirar la mano.']],
    [['Arpegio con pulgar, índice, medio y anular sobre La menor y Mi.', 'El arpegio, 5 minutos por día.'],
      ['Cejilla en Fa: primeros intentos. Ejercicio de fuerza con el dedo 1.', 'Cejilla en el traste 5, que es más blanda.'],
      ['Escala pentatónica de La menor en primera posición.', 'La escala subiendo y bajando con metrónomo a 60.'],
      ['Improvisamos con la pentatónica sobre una base grabada.', 'Inventar tres frases cortas con la escala.'],
      ['Zamba: rasgueo básico y acordes de la primera parte.', 'Rasgueo de zamba sobre La menor.'],
      ['Zamba completa a tempo lento. Falta limpiar el cambio a Si7.', 'Cambio de Mi menor a Si7.']],
  ],
  Canto: [
    [['Respiración baja y vocalización con escalas de cinco notas.', 'Respiración: 4 tiempos tomar, 8 soltar.'],
      ['Elegimos canción. Marcamos en la letra dónde respirar.', 'Escuchar la versión original siguiendo la letra.'],
      ['Primera estrofa: afinación de los saltos, con apoyo del piano.', 'Primera estrofa con la grabación de la clase.'],
      ['Estribillo. Se queda sin aire al final de la frase larga.', 'Estribillo respirando donde marcamos.'],
      ['Canción completa con pista. Trabajamos la dicción.', 'Canción entera una vez por día.'],
      ['Interpretación: dinámica y pausas. Va quedando para la muestra.', 'Cantarla de memoria, sin la letra.']],
  ],
  'Batería': [
    [['Agarre de palillos y golpes simples alternados en el redoblante.', 'Golpes alternados sobre una almohada, 5 minutos.'],
      ['Ritmo básico de rock: bombo en 1 y 3, redoblante en 2 y 4.', 'El ritmo contando en voz alta.'],
      ['El mismo ritmo con corcheas en el hi-hat. Metrónomo a 70.', 'Ritmo de rock a 70 con metrónomo.'],
      ['Primer fill de un compás con semicorcheas.', 'Tres compases de ritmo y uno de fill.'],
      ['Tocamos encima de una canción. Se acelera en los fills.', 'La canción entera con auriculares.'],
      ['Redoble simple y doble. Ritmo con bombo en corcheas.', 'Ritmo de rock a 80 con metrónomo.']],
  ],
  'Percusión': [
    [['Presentamos chico, repique y piano. Toque de madera.', ''],
      ['Toque básico del tambor chico, primero con las manos en las piernas.', 'El toque del chico sobre las piernas.'],
      ['Tambor piano: base de Cuareim.', ''],
      ['Juntamos chico y piano. Cuesta mantener el tempo.', 'Escuchar una cuerda y marcar el chico con palmas.'],
      ['Repique: primeros repiques y llamadas.', ''],
      ['Cuerda completa con los tres tambores, rotando.', 'Repasar la llamada de entrada.']],
  ],
  Ensamble: [
    [['Elegimos dos temas para la muestra y repartimos las partes.', 'Escuchar los dos temas.'],
      ['Primera pasada del primer tema, cada uno con su parte.', 'Cada uno su parte, con la grabación.'],
      ['Primer tema completo. Falta ajustar la entrada del estribillo.', 'La entrada del estribillo.'],
      ['Empezamos el segundo tema. Armamos la intro entre guitarra y teclado.', 'La intro, lento.'],
      ['Los dos temas de corrido. Trabajamos los finales.', ''],
      ['Armamos el tema entero. Falta ajustar el corte del final.', 'Repasar el final, cada uno su parte.']],
  ],
  'Iniciación musical': [
    [['Canción de bienvenida y juego de ecos rítmicos con palmas.', ''],
      ['Exploramos sonidos graves y agudos con el xilofón.', ''],
      ['Rápido y lento: nos movimos con la música y tocamos panderetas.', ''],
      ['Cuento sonoro con instrumentos de percusión.', ''],
      ['Fuerte y suave con maracas. Canción nueva con gestos.', ''],
      ['Ronda con instrumentos: cada uno tocó cuando le llegaba el turno.', '']],
  ],
};

function semilla() {
  const hoy = hoyIso();
  const SEMANAS = 6;
  const desde = addDays(hoy, -SEMANAS * 7);
  const P = (id, nombre, instrumentos, color) => ({ id, nombre, instrumentos, color });
  const d = { v: 1, demo: true, semillaV: SEMILLA_V, sembrada: hoy, profes: [P('juan', 'Juan', 'Piano, guitarra', COLORES[0]), P('melina', 'Melina', 'Piano, canto, iniciación', COLORES[1]), P('facundo', 'Facundo', 'Guitarra, batería, percusión', COLORES[2])], alumnos: [], clases: [], exc: {}, reg: {} };
  const al = (nombre, edad, tutor, notas) => { const a = { id: uid(), nombre, edad, tutor: tutor || '', tel: '', notas: notas || '', creditos: 0 }; d.alumnos.push(a); return a.id; };
  const A = {
    martina: al('Martina Rodríguez', 9, 'Laura (mamá)', 'Tiene teclado en casa, sin pedal.'), santiago: al('Santiago Pereira', 11, 'Andrés (papá)'),
    carolina: al('Carolina Viera', 34, '', 'Retomó después de muchos años. Prefiere repertorio popular.'), lucia: al('Lucía Fernández', 8, 'Paula (mamá)'),
    tomas: al('Tomás Acosta', 12, 'Verónica (mamá)', 'Zurdo, toca con guitarra para diestros.'), emilia: al('Emilia Castro', 7, 'Diego (papá)'),
    bruno: al('Bruno Méndez', 10, 'Silvia (mamá)'), joaquin: al('Joaquín Díaz', 12, 'Martín (papá)'), olivia: al('Olivia Techera', 6, 'Carla (mamá)', 'La trae la abuela los jueves.'),
    mateo: al('Mateo González', 9, 'Rosana (mamá)'), valentina: al('Valentina Silva', 11, 'Gabriela (mamá)'), agustin: al('Agustín López', 8, 'Pablo (papá)'),
    sofia: al('Sofía Benítez', 10, 'Mariana (mamá)'), benjamin: al('Benjamín Olivera', 7, 'Lucas (papá)'), renata: al('Renata Suárez', 13, 'Inés (mamá)'),
    clara: al('Clara Núñez', 9, 'Fernando (papá)'), julieta: al('Julieta Cabrera', 15, 'Adriana (mamá)'), isabella: al('Isabella Ramos', 8, 'Natalia (mamá)'),
    delfina: al('Delfina Sosa', 11, 'Gonzalo (papá)'), mia: al('Mía Etcheverry', 4, 'Julia (mamá)'), felipe: al('Felipe Hernández', 5, 'Sergio (papá)'),
    alma: al('Alma Zunino', 4, 'Noelia (mamá)'), lautaro: al('Lautaro Ibarra', 12, 'Cecilia (mamá)'), simon: al('Simón Umpiérrez', 10, 'Raúl (papá)'),
    nicolas: al('Nicolás Martínez', 14, 'Beatriz (mamá)'), thiago: al('Thiago Correa', 9, 'Jorge (papá)'), ignacio: al('Ignacio Quintana', 41, '', 'Sale del trabajo 18:30, a veces llega justo.'),
  };
  const C = (profeId, dia, inicio, dur, instrumento, alumnos, titulo) => d.clases.push({ id: uid(), profeId, dia, inicio, dur, instrumento, alumnoIds: alumnos.map((k) => A[k]), titulo: titulo || '', desde, demo: true });
  C('juan', 1, '16:00', 45, 'Piano', ['martina']); C('juan', 1, '17:00', 45, 'Guitarra', ['santiago']); C('juan', 1, '18:00', 60, 'Piano', ['carolina']);
  C('juan', 2, '16:30', 45, 'Piano', ['lucia']); C('juan', 2, '17:30', 45, 'Guitarra', ['tomas']);
  C('juan', 3, '16:00', 45, 'Piano', ['emilia']); C('juan', 3, '17:00', 45, 'Piano', ['bruno']); C('juan', 3, '18:30', 45, 'Guitarra', ['joaquin']);
  C('juan', 4, '16:30', 45, 'Piano', ['olivia']); C('juan', 4, '17:30', 45, 'Guitarra', ['mateo']);
  C('juan', 5, '16:00', 45, 'Guitarra', ['valentina']); C('juan', 5, '17:00', 45, 'Piano', ['agustin']);
  C('juan', 5, '18:00', 90, 'Ensamble', ['santiago', 'tomas', 'joaquin', 'valentina'], 'Ensamble de los viernes');
  C('juan', 6, '10:00', 45, 'Piano', ['sofia']); C('juan', 6, '11:00', 45, 'Guitarra', ['benjamin']);
  C('melina', 1, '17:00', 45, 'Canto', ['renata']); C('melina', 1, '18:00', 45, 'Piano', ['clara']);
  C('melina', 2, '17:00', 45, 'Iniciación musical', ['mia', 'felipe', 'alma'], 'Iniciación musical'); C('melina', 2, '18:00', 45, 'Canto', ['julieta']);
  C('melina', 3, '17:30', 45, 'Piano', ['delfina']); C('melina', 4, '17:00', 45, 'Piano', ['isabella']); C('melina', 4, '18:00', 45, 'Canto', ['renata']);
  C('melina', 5, '16:30', 45, 'Piano', ['clara']);
  C('facundo', 1, '18:00', 45, 'Batería', ['lautaro']); C('facundo', 2, '18:00', 45, 'Guitarra', ['nicolas']);
  C('facundo', 3, '17:00', 45, 'Batería', ['simon']); C('facundo', 3, '18:00', 60, 'Percusión', ['lautaro', 'simon', 'nicolas'], 'Taller de candombe');
  C('facundo', 4, '18:00', 45, 'Batería', ['thiago']); C('facundo', 5, '19:00', 45, 'Guitarra', ['ignacio']);

  let n = 0;
  d.clases.forEach((c, k) => { c.pista = k % (NOTAS[c.instrumento] || [[]]).length; });
  for (let i = SEMANAS * 7; i >= 1; i--) {
    const f = addDays(hoy, -i);
    const wd = parse(f).getDay();
    const semana = SEMANAS - 1 - Math.floor((i - 1) / 7);
    for (const c of d.clases) {
      if (c.dia !== wd) continue;
      const [nota, practicar] = NOTAS[c.instrumento][c.pista][Math.min(5, semana)];
      const falta = c.alumnoIds.length === 1 && ++n % 9 === 0 ? (n % 2 ? 'falto' : 'aviso') : '';
      const key = `${c.id}|${f}`;
      d.reg[key] = { key, claseId: c.id, fecha: f, inicio: c.inicio, alumnoIds: [...c.alumnoIds], instrumento: c.instrumento, profeId: c.profeId, asist: Object.fromEntries(c.alumnoIds.map((id) => [id, falta || 'vino'])), nota: falta ? '' : nota, practicar: falta ? '' : practicar, ts: 0 };
    }
  }
  // Una cancelación próxima con clase a recuperar, para que se vea cómo queda
  const ct = d.clases.find((c) => c.alumnoIds[0] === A.tomas && c.alumnoIds.length === 1);
  for (let i = 1; i <= 7; i++) {
    const f = addDays(hoy, i);
    if (parse(f).getDay() === ct.dia) { d.exc[`${ct.id}|${f}`] = { tipo: 'cancelada', recupera: true }; d.alumnos.find((a) => a.id === A.tomas).creditos = 1; break; }
  }
  return d;
}

// Nota inventada para una clase de ejemplo de un día que ya pasó
function notaDemo(c, fecha) {
  const pista = (NOTAS[c.instrumento] || [[['', '']]])[c.pista || 0];
  return pista ? pista[Math.min(pista.length - 1, 3 + (parse(fecha).getDate() % 3))] : ['', ''];
}

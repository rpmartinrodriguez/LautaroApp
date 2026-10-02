# LautaroApp

PWA educativa personalizada organizada como una **Base de Héroes**. Combina práctica diaria, progresión adaptativa y un panel adulto para acompañar el aprendizaje sin convertir la app en una evaluación clínica.

## Estado actual — v0.9

La aplicación ya incluye:

- modo Lautaro con misiones táctiles y visuales;
- evaluación inicial guiada y reanudable;
- plan individual por habilidades concretas;
- vocabulario progresivo de 5 niveles;
- mezcla automática de palabras nuevas, en aprendizaje, con dificultad y de repaso;
- palabras personales con foto, sílabas, categoría y prioridad;
- pronunciación normal, lenta, por sílabas y “repetí conmigo”;
- registro de cuándo se necesitó apoyo oral;
- reconocimiento visual de palabras;
- letras y sonidos;
- construcción de palabras;
- trazado táctil;
- frases progresivas;
- memoria visual;
- matemática de cantidad con dificultad adaptativa;
- tablero de comunicación funcional;
- rutinas de autonomía prediseñadas y personalizadas;
- registro de generalización fuera de la app;
- objetivos indicados por profesionales;
- informes semanales;
- sincronización con Firebase;
- cuenta adulta opcional para recuperar el progreso en otros dispositivos;
- PIN local para proteger el modo adulto;
- PWA instalable y soporte offline;
- actualización de caché preparada para no dejar la app instalada congelada en una versión antigua;
- verificación automática de compilación con GitHub Actions.

## Principio de uso

La app no asigna una “edad mental” ni diagnostica. La progresión se basa en habilidades observables y en la estabilidad del desempeño.

Para avanzar de una habilidad a la siguiente se consideran:

- cantidad de intentos;
- porcentaje total;
- resultados recientes;
- racha de aciertos;
- cantidad de ayuda utilizada.

Las palabras dominadas aparecen menos seguido; las palabras nuevas y las que presentan dificultad reciben mayor prioridad.

## Primer uso recomendado

1. Entrar al modo adulto y crear el PIN local.
2. Completar la evaluación inicial.
3. Cargar 5–10 palabras muy significativas en **Biblioteca**.
4. Agregar las sílabas manualmente en las palabras que se quieran trabajar en pronunciación.
5. Marcar como prioridad las palabras especialmente importantes.
6. Iniciar una sesión desde **Sesión de hoy**.
7. Registrar en **Vida real** cuando una palabra o habilidad aparezca fuera de la app.
8. Revisar el **Informe semanal** después de varias sesiones.

## Pronunciación

Los apoyos disponibles son:

- **Normal**
- **Despacio**
- **Sílabas**
- **Repetí conmigo**

Las sílabas ingresadas manualmente tienen prioridad sobre la separación automática.

El uso de apoyos lentos o silábicos se registra, para evitar que la app considere una habilidad completamente consolidada si todavía depende mucho de ayudas.

## Firebase y Netlify

Variables de entorno necesarias en Netlify:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Build:

```bash
npm run build
```

Publish directory:

```text
dist
```

### Firebase Authentication

Habilitar:

- **Anonymous**
- **Email/Password** si se quiere usar la cuenta adulta multi-dispositivo.

La app empieza con una sesión anónima para que Lautaro no tenga que iniciar sesión. Si el adulto vincula un correo y contraseña, esa misma sesión se convierte en una cuenta persistente manteniendo el UID.

### Firestore y Storage

Publicar las reglas incluidas en:

- `firestore.rules`
- `storage.rules`

El progreso se guarda bajo el UID autenticado y las reglas impiden que un usuario autenticado lea el espacio de otro usuario.

## Privacidad

La app conserva una copia local para seguir funcionando sin conexión. Cuando Firebase está configurado, el progreso también se sincroniza con Firestore. Fotos y material personal se almacenan en Firebase Storage dentro del espacio del usuario autenticado.

No se debe publicar el proyecto con reglas abiertas de Firestore o Storage.

## Desarrollo local

```bash
npm install
npm run dev
```

Para verificar producción:

```bash
npm run build
npm run preview
```

## Antes de llamar a esta versión 1.0

Queda principalmente validar el uso real durante varios días, revisar que los criterios adaptativos funcionen bien con datos reales, ajustar vocabulario y rutinas, y corregir cualquier detalle de experiencia que aparezca en iPhone/iPad o Android.

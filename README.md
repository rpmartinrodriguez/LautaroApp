# LautaroApp

PWA educativa personalizada para Lautaro, organizada como una **Base de Héroes**: misiones cortas, progresión gradual y un panel adulto que explica qué trabajar, por qué y cuándo avanzar.

## Estado actual — MVP 0.1

Incluye:

- Modo Lautaro con estética de misiones de héroe.
- Reconocimiento visual de palabras.
- Actividad inicial de sonidos.
- Construcción de palabras con letras.
- Conteo de cantidades del 1 al 5.
- Síntesis de voz del navegador en español.
- XP e insignias motivacionales.
- Progreso persistido localmente en el dispositivo.
- Panel adulto con ruta pedagógica.
- Criterios explícitos para avanzar.
- Tareas sugeridas fuera de la pantalla.
- Estadísticas iniciales por palabra y habilidad.
- Propuesta de sesión diaria de 25–30 minutos.
- Estructura PWA y funcionamiento offline básico.

## Principio pedagógico

La app no avanza por edad ni por calendario. El objetivo es progresar cuando una habilidad aparece de manera estable, en diferentes sesiones y con menos ayuda. Los datos son orientativos para acompañar el aprendizaje y no reemplazan la evaluación de profesionales.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
npm run preview
```

## Próximas etapas

1. Evaluación inicial guiada.
2. Biblioteca personal de fotos, palabras y audios.
3. Firebase: autenticación, Firestore y Storage.
4. Motor adaptativo por dominio real, no solo porcentaje global.
5. Rutinas visuales y autonomía.
6. Trazado/escritura táctil.
7. Panel profesional y objetivos compartidos.
8. Informes semanales y generalización fuera de la app.
9. Instalación PWA y posterior empaquetado con Capacitor.

## Privacidad

En la versión actual el progreso se guarda solamente en `localStorage` del dispositivo. No se suben datos personales a servidores.

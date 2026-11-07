# Puente JDBC: trivia en vivo

Mismo sistema que el juego anterior (administrador + jugadores en tiempo real), con otro tema y estilo.

## Cómo publicarlo
1. Copia tu `config.js` del primer juego sobre el de esta carpeta (puedes usar el mismo proyecto de Firebase y las mismas reglas; no hay que crear nada nuevo).
2. Crea un repositorio nuevo en GitHub (por ejemplo `trivia-jdbc`) y sube estos archivos: `index.html`, `style.css`, `app.js`, `config.js`, `questions.js`.
3. En Settings > Pages elige la rama `main` y la carpeta donde quedaron los archivos (`/ (root)` o `/docs`).
4. Entra a `tu-pagina/?admin`, inicia sesión con tu correo y crea la partida.

Prueba en tu computador con la extensión Live Server de VS Code (no abras `index.html` con doble clic).
Las preguntas están en `questions.js`: la primera opción de cada una es la correcta.

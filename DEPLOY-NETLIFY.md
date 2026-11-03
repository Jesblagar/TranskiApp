# Guía de despliegue en Netlify

Esta guía explica cómo publicar TranskiApp en Netlify, con usuarios y transcripción mediante Google Gemini. No necesitas programar nada: todo se configura desde los paneles de GitHub y Netlify.

## Antes de empezar

Necesitas:

1. Una **cuenta de GitHub** con el repositorio del proyecto subido.
2. Una **cuenta de Netlify** (gratuita).
3. Una **clave de API de Google Gemini**, creada en Google AI Studio.

**Importante:** no pegues la clave en ningún chat, documento ni archivo del repositorio. Solo se introduce en el panel de Netlify, en el paso 3.

## Paso 1: Subir el proyecto a GitHub

1. En GitHub, crea un repositorio nuevo llamado `transkiapp`, sin README ni licencia.
2. Sube todo el contenido de la carpeta del proyecto.

Conviene subirlo así en lugar de arrastrar la carpeta a Netlify: Netlify necesita instalar la dependencia del contador de uso, y eso solo ocurre cuando el sitio se construye desde GitHub.

## Paso 2: Crear el sitio en Netlify

1. En Netlify, pulsa **Add new site → Import an existing project**.
2. Elige **GitHub** y autoriza el acceso al repositorio `transkiapp`.
3. Deja el **comando de build** vacío y el **directorio de publicación** en `.` (un punto).
4. Pulsa **Deploy**.

Netlify leerá `netlify.toml` y desplegará la web y la función.

## Paso 3: Guardar la clave de Gemini

1. En tu sitio, ve a **Site configuration → Environment variables**.
2. Pulsa **Add a variable** y escribe el nombre exacto: `GEMINI_API_KEY`.
3. Pega la clave como valor.
4. **Marca la casilla «Contains secret values»** antes de guardar. Así Netlify oculta el valor en el panel y en los registros.
5. Guarda.

Opcionalmente, puedes añadir `DAILY_PAGE_LIMIT` (páginas por usuario y día; 10 por defecto) y `GEMINI_MODEL`.

Después de cambiar variables, ve a **Deploys → Trigger deploy → Deploy site** para que se apliquen.

## Paso 4: Activar las cuentas de usuario

1. En tu sitio, ve a **Identity** y pulsa **Enable Identity**.
2. En **Registration preferences**, elige **Invite only**. Así solo entran las personas que invites.
3. Para invitar a alguien, ve a **Identity → Invite users** e introduce su correo. Recibirá un enlace para crear su contraseña.

Netlify Identity tiene un límite gratuito de usuarios activos; consulta la documentación actual de Netlify.

## Paso 5: Acceso con Google (opcional)

1. En **Identity → External providers**, activa **Google**.
2. Netlify te pedirá un ID y un secreto de cliente de OAuth de Google Cloud. Sigue la guía de Netlify sobre Google OAuth y pega en la consola de Google la URL de redirección que te indica Netlify.

Si no lo necesitas, puedes usar solo el registro con correo y contraseña. Hazlo primero y añade Google después.

## Paso 6: Probar

1. Abre la dirección de tu sitio (algo como `nombre.netlify.app`).
2. Pulsa **Iniciar sesión** y entra con tu cuenta.
3. Lee la **Guía paso a paso** y la **Información de uso** de la web.
4. Sube una página de prueba y pulsa **Transcribir todo**. Confirma en el aviso.
5. Comprueba que aparece texto.

Si algo falla, revisa en este orden:

- Que la variable `GEMINI_API_KEY` existe, está escrita exactamente así y el sitio se ha vuelto a desplegar.
- Que has iniciado sesión y que tu cuenta está invitada.
- Que no has agotado las 10 páginas diarias.
- En caso de error de la API, el mensaje de la web suele indicar la causa.

## Coste y límites

- **Alojamiento y funciones de Netlify:** el plan gratuito cubre el uso habitual, según los límites vigentes de Netlify.
- **Transcripción:** usa el nivel gratuito de Google Gemini, con cuotas diarias compartidas por todos los usuarios. Si se agotan, la web lo indica y el servicio vuelve a estar disponible al día siguiente o cuando se restablezca la capacidad.
- **Límite por usuario:** 10 páginas al día, configurable.

Las cuotas y condiciones de Gemini las fija Google y pueden cambiar. Consulta la página de Google AI Studio antes de comunicar cifras a tus usuarios.

## Solución de problemas

| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| «Falta GEMINI_API_KEY…» | La variable no está configurada o no se ha desplegado de nuevo. | Revisa el paso 3 y haz *Trigger deploy*. |
| «Inicia sesión para transcribir» | No hay sesión iniciada. | Inicia sesión. |
| «Has alcanzado tu límite…» | Ya has transcrito el máximo diario. | Vuelve mañana. |
| «Capacidad gratuita diaria temporalmente alcanzada» | La cuota compartida de Gemini se ha agotado. | Espera unos minutos o vuelve mañana. |
| «La imagen es demasiado grande» | La página supera 5 MB. | Reduce el tamaño de la imagen y vuelve a subirla. |

## Qué no debes subir al repositorio

Nunca subas el archivo `.env` ni claves de API. El archivo `.gitignore` ya los excluye.

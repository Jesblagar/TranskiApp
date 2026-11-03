# Despliegue en Netlify con usuarios y acceso con Google

## Cómo funciona

- **La web** (`index.html`) es estática: Netlify la sirve gratis.
- **La transcripción** pasa por una función serverless (`netlify/functions/transcribe.js`). Solo responde si el visitante tiene sesión iniciada.
- **Las cuentas** las gestiona Netlify Identity. El widget que aparece en la web ofrece crear cuenta con correo y contraseña, iniciar sesión y, si lo activas, entrar con Google. No hace falta programar un panel propio.

## Lo que es gratis y lo que no

- **Alojamiento y funciones de Netlify:** el plan gratuito cubre esta app para uso personal o de un grupo pequeño. Consulta los límites vigentes en netlify.com.
- **Netlify Identity:** hasta 1 000 usuarios activos en el plan gratuito, según la documentación vigente.
- **Transcripciones:** **no son gratuitas.** Cada página es una llamada a la API de Anthropic, facturada aparte del plan de Claude. Tu cuenta de Claude gratuita en claude.ai no sirve para esto.
- **Límite de tiempo:** en el plan gratuito, las funciones síncronas tienen un tiempo máximo de ejecución corto (del orden de 10 segundos). Una página densa transcrita con el modelo de precisión alta puede superarlo. Si ocurre, usa la precisión estándar o rápida, o pide la configuración de funciones en segundo plano.

## Pasos

1. **Sube el proyecto a GitHub** (ver el README) y en Netlify elige *Add new site → Import an existing project*.
2. **Build settings:** deja el comando de build vacío y el directorio de publicación en `.`. Netlify leerá `netlify.toml`.
3. **Clave de API:** en *Site configuration → Environment variables* añade `ANTHROPIC_API_KEY` con tu clave. Opcionalmente, `MODEL_ALTA`, `MODEL_ESTANDAR` y `MODEL_RAPIDA`.
4. **Activa Identity:** en *Site configuration → Identity* pulsa *Enable Identity*.
5. **Registro restringido:** en *Identity → Registration preferences* elige **Invite only**. Así solo entran las personas que invites, y evitas que cualquiera gaste tu saldo de API. Invita usuarios desde *Identity → Invite users*.
6. **Acceso con Google:** en *Identity → External providers* activa **Google**. Netlify te pedirá un ID y un secreto de cliente de OAuth de Google Cloud. Para crearlos, sigue la guía de Netlify (*Google OAuth*) y pega la URL de redirección que te indica Netlify en la consola de Google.
7. **Despliega** y prueba: al abrir la web aparece el botón «Iniciar sesión».

## Qué no debes subir

El archivo `.env` y la clave de API nunca deben estar en el repositorio. `.gitignore` ya los excluye.

## Si prefieres no usar cuentas

Puedes dejar la app sin Identity, pero entonces cualquiera con el enlace podría transcribir a tu cargo. Por eso la función exige sesión por defecto.

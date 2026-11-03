# TranskiApp

Herramienta web para transcribir documentos manuscritos e impresos de los siglos XVI al XVIII (PDF, JPG o PNG) y revisar cada página junto a su original.

Interfaz en estilo *liquid glass*, con modo claro y oscuro, y un fondo inspirado en el mapa *Maris Pacifici* de Abraham Ortelius (1589).

## Qué hace

- **Carga** de PDF (cada página se separa automáticamente), JPG o PNG.
- **Transcripción automática** en dos normas:
  - **HSMS:** etiquetas del sistema HSMS, pensadas para Transkribus.
  - **Diplomática:** texto corrido, grafía original, puntuación normalizada y abreviaturas entre corchetes.
  - En ambas: notas al margen (`[Nota al margen izquierdo]`, etc.), firmas (`[rúbrica]`) y sellos notariales (`[signo]`).
- **Visor del original:** zoom del 50 % al 300 %, ajuste al ancho, desplazamiento con el botón derecho del ratón, contraste (colores invertidos) y anotaciones de revisión (lápiz, subrayado y recuadro).
- **Edición** del texto transcrito y **contadores** de líneas, palabras y caracteres.
- **Control del trabajo:** «Transcribir todo», «Repetir página» y «Pausar transcripción».
- **Exportación:** copiar una página o descargar todo el texto en `.txt`.
- **Guía de uso** y **sección de información** dentro de la propia web.

## Arquitectura

```
Navegador (index.html)  ──►  Función de Netlify (netlify/functions/transcribe.js)  ──►  API de Google Gemini
                                    │
                                    └── comprueba la sesión (Netlify Identity)
                                    └── aplica el límite diario por usuario (Netlify Blobs)
```

- La clave de API se guarda como variable secreta en Netlify y nunca llega al navegador.
- Solo los usuarios con sesión iniciada pueden transcribir.
- Cada usuario tiene un límite diario de páginas (10 por defecto).

## Estructura del proyecto

```
transkiapp/
├── index.html                      # Interfaz completa (HTML, CSS y JavaScript)
├── netlify.toml                    # Configuración de Netlify
├── netlify/
│   └── functions/
│       └── transcribe.js           # Función que transcribe con Gemini
├── assets/
│   └── fondo_ortelius.jpg          # Fondo (reproducción del mapa Maris Pacifici, 1589)
├── package.json                    # Dependencia para el contador de uso
├── .env.example                    # Plantilla de variables para desarrollo local
├── DEPLOY-NETLIFY.md               # Guía de despliegue paso a paso
├── README.md
├── LICENSE
└── .gitignore
```

## Despliegue

Consulta **[DEPLOY-NETLIFY.md](DEPLOY-NETLIFY.md)** para los pasos completos: conexión con GitHub, variables, activación de cuentas y prueba.

## Configuración

| Variable | Obligatoria | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | Sí | Clave de la API de Google Gemini. Márcala como secreta en Netlify. |
| `DAILY_PAGE_LIMIT` | No | Páginas por usuario y día (10 por defecto). |
| `GEMINI_MODEL` | No | Modelo de Gemini (`gemini-2.5-flash` por defecto). |

## Limitaciones

- **Revisión obligatoria.** Las transcripciones son automáticas. Compáralas con la imagen antes de usarlas como fuente, edición o Ground Truth.
- **Nivel gratuito compartido.** Si se agota la capacidad de Gemini, el servicio se pausa hasta que se restablezca.
- **Privacidad.** En el nivel gratuito, Google puede usar los datos enviados para mejorar sus servicios. No subas documentos confidenciales.
- **Calidad sin validar con manuscritos reales.** Haz pruebas con documentos que ya conozcas antes de confiar en los resultados.
- **Anotaciones y contraste** son solo para revisión y no se incluyen en el texto ni en las imágenes exportadas.
- **Límites de terceros.** Las cuotas y condiciones de Gemini las fija Google y pueden cambiar.

## Tecnologías

- Interfaz: HTML, CSS y JavaScript sin frameworks.
- Función: Node.js de Netlify con `@netlify/blobs` para el contador.
- [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174, desde cdnjs, para leer y renderizar PDF.
- Netlify Identity para las cuentas de usuario.

## Créditos

- Mapa de fondo: *Maris Pacifici*, Abraham Ortelius (1589), dominio público. Comprueba la procedencia de la copia que uses.
- Reglas de transcripción: basadas en la skill *transcripcion-paleografica-moderna* y en la estructura de etiquetas HSMS.

## Licencia

MIT. Consulta [LICENSE](LICENSE).

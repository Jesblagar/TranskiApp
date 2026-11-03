# TranskiApp

Herramienta web para transcribir documentos manuscritos e impresos de los siglos XVI al XVIII (PDF, JPG o PNG) y revisar cada página junto a su original.

Interfaz en estilo *liquid glass* (paneles translúcidos con desenfoque y reflejos), con modo claro y oscuro, y un fondo inspirado en el mapa *Maris Pacifici* de Abraham Ortelius (1589).

## Funcionalidades

- **Carga:** PDF (cada página se renderiza), JPG o PNG. Arrastrar o elegir archivo.
- **Transcripción automática** con dos normas, seleccionables en «Tipo»:
  - **Transcripción HSMS:** reglas de la skill de transcripción paleográfica, con etiquetas como `{CB2. }`, `{RUB. }` o `{CW. }`.
  - **Transcripción diplomática:** texto de seguido, grafía original sin modernizar, puntuación normalizada y abreviaturas entre corchetes.
  - En ambas: notas al margen como `[Nota al margen izquierdo]` (o derecho, superior o inferior), firmas como `[rúbrica]` y sellos notariales como `[signo]`.
- **Precisión:** alta, estándar o rápida.
- **Visor del original:** zoom del 50 % al 300 %, «Ajustar», desplazamiento con el botón derecho del ratón, contraste (colores invertidos) y anotaciones (lápiz, subrayado y recuadro) que solo sirven para revisión.
- **Edición:** el texto transcrito se puede corregir a mano.
- **Contadores:** líneas, palabras y caracteres por página.
- **Control:** «Transcribir todo», «Repetir página» y «Pausar transcripción».
- **Exportación:** copiar la página o descargar todo el texto en `.txt`.

## Arquitectura

```
Navegador (index.html)  ──►  Servidor propio (server.js)  ──►  API de Claude
                             guarda la clave de API
```

La clave de API se queda en el servidor. El navegador solo habla con tu servidor en `/api/transcribe`.

## Requisitos

- Node.js 18 o superior.
- Una clave de API de Anthropic (`ANTHROPIC_API_KEY`).

## Puesta en marcha en local

```bash
cp .env.example .env        # y edita ANTHROPIC_API_KEY
export $(grep -v '^#' .env | xargs)
npm start
```

Abre http://localhost:3000.

## Despliegue

GitHub Pages solo sirve archivos estáticos, así que **no basta con él**: la transcripción necesita el servidor. Opciones habituales:

- **Render, Railway o Fly.io:** crea un servicio desde el repositorio con el comando `npm start` y añade las variables de `.env.example` en el panel del hosting.
- **Un servidor propio (VPS):** clona el repositorio, configura `.env` y ejecuta `npm start` con un gestor de procesos como `pm2`. Pon delante un proxy con HTTPS (por ejemplo, Caddy o Nginx).

Antes de hacer la web pública, define `ACCESS_PASSWORD`: así el navegador pedirá usuario y contraseña, y evitarás que cualquiera gaste tu saldo de API.

## Configuración

| Variable | Obligatoria | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | Clave de API. Nunca la subas al repositorio. |
| `PORT` | No | Puerto (3000 por defecto). |
| `ACCESS_PASSWORD` | No | Si se define, la app pide esta contraseña. |
| `MAX_PER_MINUTE` | No | Límite de transcripciones por IP y minuto (30 por defecto). |
| `MODEL_ALTA`, `MODEL_ESTANDAR`, `MODEL_RAPIDA` | No | Modelos para cada nivel de precisión. |

## Limitaciones

- **Revisión obligatoria.** Las transcripciones son automáticas. Compáralas siempre con la imagen antes de usarlas como fuente, edición o Ground Truth.
- **Privacidad.** Las imágenes de las páginas se envían a la API de Claude. No subas documentos confidenciales si tu proyecto no lo permite.
- **Coste.** Cada página transcrita es una llamada a la API, facturada según el uso. Los documentos largos cuestan más. Revisa los precios vigentes en la web de Anthropic.
- **Anotaciones y contraste** no se incluyen en el texto ni en las imágenes exportadas.
- **Sin probar con manuscritos reales.** Verifica los resultados con tus propios documentos.

## Estructura

```
transkiapp/
├── index.html              # Interfaz (HTML, CSS y JavaScript)
├── server.js               # Servidor: sirve la web y llama a la API de forma segura
├── package.json
├── .env.example            # Plantilla de configuración
├── assets/
│   └── fondo_ortelius.jpg  # Imagen de fondo (reproducción del mapa Maris Pacifici, 1589)
├── README.md
├── LICENSE
└── .gitignore
```

## Tecnologías

- Servidor: Node.js con módulos integrados, sin dependencias externas.
- Interfaz: HTML, CSS y JavaScript sin frameworks.
- [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174, desde cdnjs, para leer y renderizar PDF.
- Canvas 2D para el zoom, el contraste y las anotaciones.

## Créditos

- Mapa de fondo: *Maris Pacifici*, Abraham Ortelius (1589), dominio público. Comprueba la procedencia de la copia que uses.
- Reglas de transcripción: basadas en la skill *transcripcion-paleografica-moderna* y en la estructura de etiquetas HSMS.

## Licencia

MIT. Consulta [LICENSE](LICENSE).

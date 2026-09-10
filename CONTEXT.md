# CONTEXT.md — Documento Maestro de Contexto y Auditoria Tecnica
## Proyecto: GlassMatch AI (Caribbean Sea Glass Edition)
**Version:** 0.2.0 (Fase 4 Multi-Cloud & Zero-Trust ATS)  
**Fecha de corte:** 10 de Septiembre de 2026  
**Repositorio Oficial:** https://github.com/ronsf30/glassmatch-ai (Rama: main)  
**Proposito del documento:** Proporcionar una radiografia tecnica exhaustiva, rigurosa y sin ambiguedades de toda la aplicacion para revision, auditoria de seguridad, arquitectura y deteccion de anomalias por agentes de IA y personal de ingenieria externo.

---

## 1. Vision General y Proposito del Sistema

GlassMatch AI es un sistema local e inteligente de evaluacion ATS (Applicant Tracking System), radar de vacantes en tiempo real y CRM de postulaciones disenado especificamente para eliminar el 100% de los falsos positivos y vacantes incompatibles en la busqueda laboral de perfiles tecnologicos.

El sistema opera bajo el principio de **Confianza Cero (Zero-Trust ATS Engine)**:
1. Toda vacante entrante se presume incompatible (0% Match) por defecto.
2. Debe superar de forma obligatoria e independiente una bateria de 5 Kill Switches (filtros de descarte absoluto) antes de calcular un score de afinidad.
3. Las vacantes descartadas por cualquier Kill Switch no se almacenan en la base de datos ni se muestran en el radar visual, garantizando una tasa de ruido nula para el usuario.
4. Opera bajo una arquitectura de **Cascada de Inteligencia Artificial en 4 Niveles**:
   - Nivel 1: Google Gemini 3.8 (Flash o Flash-Lite segun estrategia activa).
   - Nivel 2: Google Gemini 3.8 Alternativo (escalon de rescate interno ante HTTP 429).
   - Nivel 3: Proveedor de Respaldo Multi-Cloud (Groq Cloud con Llama 3.3 70B Versatile en modo JSON estricto).
   - Nivel 4: Motor Local Autonomo determinista (garantia de continuidad offline con 0 tokens consumidos).

---

## 2. Pila Tecnologica y Entorno de Ejecucion

- **Framework Web:** Next.js 16.3.4 (App Router con compilador Turbopack activo).
- **Libreria de UI:** React 19.2.8 y React DOM 19.2.8.
- **Lenguaje:** TypeScript 5 (modo estricto).
- **Estilos y Diseno:** Tailwind CSS v4 con plugin `@tailwindcss/postcss`, configurado bajo el sistema de diseno "Caribbean Sea Glass".
- **Animaciones:** Framer Motion 13.2.0.
- **Iconografia:** Lucide React 1.43.0.
- **Base de Datos:** SQLite embebido nativo mediante `node:sqlite` (`DatabaseSync` de Node.js v22+), ubicado en `prisma/dev.db` con concurrencia transaccional e integridad referencial (`PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`, `PRAGMA busy_timeout = 5000`, `PRAGMA synchronous = NORMAL`).
- **Motor de IA Principal (Generacion 2026):** Google Gemini 3.8:
  - `gemini-3.8-flash` (`gemini-flash-latest`): Modelo insignia para analisis ATS de maxima profundidad.
  - `gemini-3.8-flash-lite` (`gemini-flash-lite-latest`): Modelo ultraligero de alta velocidad y consumo minimo de tokens.
- **Motor de IA de Respaldo (Multi-Cloud):** Groq Cloud (`https://api.groq.com/openai/v1/chat/completions`) ejecutando `llama-3.3-70b-versatile` o `llama-3.1-8b-instant` con `response_format: { type: "json_object" }`.
- **Motor Local Autonomo:** Evaluador determinista implementado en TypeScript puro con reglas heuristicas, tokenizadores y evaluacion de negaciones tecnicas para operar sin conexion o ante saturacion total de APIs externas.
- **Scrapers Auxiliares:** Python 3 con librerias `jobspy` y `pypdf` para recoleccion externa de vacantes y parseo local de PDFs con codificacion forzada UTF-8.
- **Sistema Operativo Objetivo:** Windows (con script de inicio rapido en batch `Iniciar-GlassMatch.bat` y resolucion forzada IPv4).

---

## 3. Arquitectura del Arbol de Archivos

```
glassmatch-ai/
├── .env.local                     # Variables de entorno locales (GEMINI_API_KEY, GROQ_API_KEY) - Excluido de Git
├── .env.local.example             # Plantilla segura de variables de entorno
├── .gitignore                     # Exclusion estricta de .env, *.db, *.db-wal, *.db-shm y __pycache__
├── Iniciar-GlassMatch.bat         # Launcher Windows de 1 clic (deteccion de puerto 3000)
├── package.json                   # Dependencias npm
├── tsconfig.json                  # Configuracion TypeScript
├── next.config.ts                 # Configuracion Next.js Turbopack
├── postcss.config.mjs             # PostCSS con Tailwind v4
├── eslint.config.mjs              # Configuracion ESLint
├── prisma/
│   ├── schema.prisma              # Definicion declarativa de esquemas relacionales
│   └── dev.db                    # Archivo binario SQLite persistente (gestionado con WAL)
├── public/                        # Iconos y assets estaticos SVG
├── scripts/
│   ├── extract_cv_pdf.py          # Extractor auxiliar de texto PDF con pypdf y stdout UTF-8 forzado
│   ├── jobspy_scraper.py          # Scraper auxiliar multi-portal (LinkedIn/Indeed/Glassdoor)
│   ├── purge_db.js                # Script de mantenimiento y purga de base de datos
│   └── requirements.txt           # Dependencias Python (jobspy, pypdf, pandas)
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css            # Clases de utilidad y variables visuales Caribbean Sea Glass
    │   ├── layout.tsx             # Shell HTML raiz con fuentes y metadatos
    │   ├── page.tsx               # Controlador principal de vistas (Tabs: Radar, Pipeline, Studio)
    │   └── api/
    │       ├── config/
    │       │   ├── gemini/route.ts       # GET/POST diagnostico en vivo y estrategia de Gemini 3.8
    │       │   └── backup-ai/route.ts    # GET/POST diagnostico y clave de Groq Cloud / OpenAI
    │       ├── cv/parse/route.ts         # POST parseo multimodal de CV (Python UTF-8 / Gemini Base64)
    │       ├── interview/route.ts        # POST generador de simulador de entrevista tecnica
    │       ├── jobs/
    │       │   ├── route.ts              # GET listar vacantes aprobadas, POST crear, DELETE purgar
    │       │   └── [id]/status/route.ts  # PATCH actualizar fase en pipeline y notas personales
    │       ├── match/route.ts            # POST evaluacion ATS aislada candidato vs vacante
    │       ├── pitch/route.ts            # POST generador de pitches de contacto por tono
    │       ├── profile/route.ts          # GET/PUT perfil del usuario persistido en SQLite
    │       └── sync/route.ts             # POST scraping en vivo multi-portal + filtro Kill Switch
    ├── components/
    │   ├── layout/
    │   │   ├── AmbientGlow.tsx           # Efectos de luz ambiental difusa de fondo
    │   │   └── GlassHeader.tsx           # Barra de navegacion flotante con estado de conexion y tabs
    │   ├── modules/
    │   │   ├── MatchRadarPreview.tsx     # Radar de vacantes con MatchRing circular y filtros
    │   │   ├── GlassPipelinePreview.tsx  # CRM Kanban de postulaciones (6 columnas transaccionales)
    │   │   ├── ProfileStudioPreview.tsx  # Editor de perfil, CV real, limites ATS, Gemini 3.8 y Groq
    │   │   ├── JobInspectorDrawer.tsx    # Drawer lateral para inspeccionar vacante, pitch y simulacro
    │   │   ├── SyncJobsModal.tsx         # Modal para disparar scraping masivo configurable
    │   │   ├── QuickAddModal.tsx         # Modal para pegar y evaluar una vacante manual
    │   │   ├── JobNotesModal.tsx         # Modal para editar notas privadas de seguimiento
    │   │   └── TutorialModal.tsx         # Tour interactivo guiado de 6 pasos
    │   └── ui/
    │       ├── GlassBadge.tsx            # Badge translucido con variantes de color
    │       ├── GlassButton.tsx           # Boton estilizado con estados de carga
    │       ├── GlassCard.tsx             # Tarjeta contenedor de cristal esmerilado
    │       └── MatchRing.tsx             # Indicador circular SVG con stroke optimizado sin corte
    ├── context/
    │   └── AppContext.tsx                # Estado global unificado con sincronizacion bidireccional SQLite
    ├── lib/
    │   ├── db.ts                         # Capa de persistencia nativa con DatabaseSync (node:sqlite)
    │   ├── gemini.ts                     # Motor ATS Zero-Trust, Kill Switches y Cascada Multi-Cloud
    │   ├── ai-providers.ts               # Adaptador universal para proveedores externos (Groq / OpenAI)
    │   └── utils.ts                      # Funciones auxiliares de sanitizacion y clases CSS (cn)
    └── types/
        ├── index.ts                      # Definiciones de tipos TypeScript del dominio
        └── sqlite.d.ts                   # Tipado complementario para node:sqlite
```

---

## 4. Modelo de Datos y Esquema de Base de Datos

La persistencia se gestiona de forma local y autonoma a traves de `node:sqlite` sin servidores externos, asegurando privacidad total de los datos del candidato. En el arranque se aplican de forma obligatoria los pragmas de concurrencia e integridad referencial: `PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`, `PRAGMA busy_timeout = 5000` y `PRAGMA synchronous = NORMAL`.

### 4.1. Tabla: UserProfile
Almacena la verdad fundamental del candidato.

| Columna | Tipo SQLite | Descripcion |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | Identificador unico (ej. `user-1`) |
| `fullName` | TEXT NOT NULL | Nombre y apellidos del profesional |
| `currentTitle` | TEXT NOT NULL | Titulo representativo (ej. `Senior Backend Developer`) |
| `seniority` | TEXT NOT NULL | Nivel de experiencia (`Junior`, `Mid`, `Senior`, `Lead`, `Principal`) |
| `rawCvText` | TEXT | Contenido textual extraido del curriculo |
| `cvFileName` | TEXT | Nombre del archivo de CV indexado |
| `extractedSkills` | TEXT NOT NULL | Array JSON de tecnologias dominadas (ej. `["Node.js","Python","SQL"]`) |
| `excludedSkills` | TEXT | Array JSON de limites tecnicos / tecnologias prohibidas (Kill Switch 3) |
| `visaStatus` | TEXT | Situacion migratoria y legal (Kill Switch 1) |
| `targetRoles` | TEXT NOT NULL | Array JSON de puestos afines buscados |
| `workModes` | TEXT NOT NULL | Array JSON de modalidades aceptadas (`["remote", "hybrid"]`) |
| `minSalary` | REAL | Salario minimo pretendido anual en USD |
| `preferredLocs` | TEXT NOT NULL | Array JSON de ubicaciones georreferenciadas |
| `languages` | TEXT | Array JSON de competencias idiomaticas (`[{"language":"Ingles","level":"B2"}]`) |
| `blacklistCompanies`| TEXT | Array JSON de empresas bloqueadas para ignorar en el radar |
| `updatedAt` | TEXT NOT NULL | Timestamp ISO de ultima modificacion |

### 4.2. Tabla: JobOffer
Almacena las vacantes verificadas que superaron exitosamente los 5 Kill Switches.

| Columna | Tipo SQLite | Descripcion |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | Identificador de vacante (ej. `li-1789041328534-1`) |
| `title` | TEXT NOT NULL | Cargo ofertado |
| `company` | TEXT NOT NULL | Empresa empleadora |
| `location` | TEXT NOT NULL | Ubicacion territorial o estado remoto |
| `workMode` | TEXT NOT NULL | Modalidad laboral (`remote`, `hybrid`, `onsite`) |
| `url` | TEXT NOT NULL | URL original o enlace de postulacion directa |
| `salaryText` | TEXT | Rango salarial detectado (si existe) |
| `description` | TEXT NOT NULL | Descripcion completa o requerimientos limpios del rol |
| `source` | TEXT NOT NULL | Fuente (`LinkedIn`, `Remotive`, `Jobicy`, `Arbeitnow`, `Manual`) |
| `publishedAt` | TEXT | Fecha original de publicacion |
| `createdAt` | TEXT NOT NULL | Fecha de indexacion local |

### 4.3. Tabla: JobMatch
Almacena el diagnostico detallado emitido por el motor ATS.

| Columna | Tipo SQLite | Descripcion |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | Identificador del diagnostico |
| `jobOfferId` | TEXT UNIQUE NOT NULL | Llave foranea referenciando a `JobOffer(id)` con `ON DELETE CASCADE` |
| `matchScore` | INTEGER NOT NULL | Puntuacion de 0 a 100 |
| `isMatch` | INTEGER DEFAULT 1 | Booleano (1 = aprobado, 0 = descartado) |
| `killSwitchTriggered` | TEXT | Nombre del Kill Switch disparado (si aplica) |
| `reason` | TEXT | Justificacion tecnica del descarte o de la aprobacion |
| `executiveSummary` | TEXT NOT NULL | Resumen ejecutivo del match |
| `strengths` | TEXT NOT NULL | Array JSON de puntos fuertes del candidato respecto a la vacante |
| `missingSkills` | TEXT NOT NULL | Array JSON de brechas tecnicas menores detectadas |
| `interviewAdvice` | TEXT NOT NULL | Consejos estrategicos para la entrevista |
| `generatedPitch` | TEXT | Propuesta de contacto o carta breve pre-generada |
| `languageRequirement`| TEXT | Requisito idiomatico detectado (`Spanish`, `English B1/B2`, `English C1/C2`) |
| `analyzedAt` | TEXT NOT NULL | Timestamp ISO de evaluacion |

### 4.4. Tabla: ApplicationTracker
Gestiona el estado en el embudo CRM / Kanban.

| Columna | Tipo SQLite | Descripcion |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | Identificador del registro de seguimiento |
| `jobOfferId` | TEXT UNIQUE NOT NULL | Llave foranea referenciando a `JobOffer(id)` con `ON DELETE CASCADE` |
| `status` | TEXT NOT NULL | Fase: `discovered`, `saved`, `applied`, `interviewing`, `offered`, `rejected` |
| `appliedDate` | TEXT | Fecha visible de la accion (ej. `10 sept`) |
| `personalNotes` | TEXT | Notas privadas del candidato sobre la vacante o proceso |
| `updatedAt` | TEXT NOT NULL | Timestamp ISO de actualizacion |

### 4.5. Tabla: AppConfig
Almacena parametros de configuracion dinamica en caliente para evitar la sobreescritura de archivos `.env.local` y prevenir reinicios de Turbopack.

| Columna | Tipo SQLite | Descripcion |
| :--- | :--- | :--- |
| `key` | TEXT PRIMARY KEY | Clave identificadora (`GEMINI_API_KEY`, `AI_STRATEGY`, `BACKUP_AI_PROVIDER`, `BACKUP_AI_API_KEY`, `BACKUP_AI_MODEL`) |
| `value` | TEXT NOT NULL | Valor parametrizado |
| `updatedAt` | TEXT NOT NULL | Timestamp ISO de modificacion |

---

## 5. El Motor ATS Zero-Trust y la Cascada Multi-Cloud

### 5.1. Protocolo de Confianza Cero: Los 5 Kill Switches
Ninguna vacante recibe un score mayor a 0% a menos que supere de forma simultanea y estricta los cinco Kill Switches siguientes:

1. **Kill Switch 1: BARRERA_GEOGRAFICA_LEGAL**
   - Descarta puestos presenciales fuera de la region de residencia.
   - Descarta clausulas restrictivas foraneas: `Must be US Citizen`, `Green Card Holder`, `W2 only`, `No C2C`, `Security Clearance required`, o residencia legal obligatoria en Reino Unido, Alemania, Francia, Canada.
   - Admite unicamente `100% Remote Global` o contratacion internacional bajo esquema `Contractor B2B`.
2. **Kill Switch 2: DESVIACION_DISCIPLINA**
   - Descarta vacantes operativas, soporte IT basico, moderacion de contenido, ventas o puestos ajenos al desarrollo y diseno.
   - Realiza comparacion semantica de titulos contra `UserProfile.targetRoles`. Si el puesto no tiene afinidad con los roles buscados, se descarta con score 0%.
   - Exige coincidencia con al menos dos competencias del stack de `UserProfile.extractedSkills`.
3. **Kill Switch 3: HABILIDAD_EXCLUIDA (Limites Tecnicos)**
   - Si la vacante exige tecnologias explicitamente vetadas por el usuario en `UserProfile.excludedSkills`.
   - Deteccion regex estricta con limites de palabra (`(^|[^a-zA-Z0-9_#+])`) para evitar colisiones accidentales de subcadenas.
4. **Kill Switch 4: BARRERA_IDIOMATICA**
   - Descarta puestos que exigen aleman (`fluent german`, `deutschkenntnisse`, `(DE)`) o frances (`fluent french`, `(FR)`) si el candidato no los domina.
   - Descarta vacantes con exigencia `English C1/C2` (fluidez nativa/ejecutiva) si el perfil del candidato esta registrado en `B1` o `A2`.
5. **Kill Switch 5: BRECHA_SENIORITY**
   - Descarta vacantes con requisitos de 7+ o 10+ anos o titulos de alta jerarquia (`Principal`, `Staff`, `Engineering Manager`, `VP`) si el candidato es `Junior` o `Mid`.

### 5.2. Arquitectura de Cascada en 4 Niveles (`callGeminiApiWithCascade`)
Toda llamada de evaluacion semantica, parseo de CV o simulacion de entrevista fluye a traves del orquestador en `src/lib/gemini.ts`:

- **Nivel 1 (Google Principal):**
  - Si la estrategia activa en `AppConfig` es `smart_saving`: Ejecuta **Gemini 3.8 Flash-Lite** (`gemini-flash-lite-latest`) con presupuesto de pensamiento 0.
  - Si la estrategia es `maximum_precision`: Ejecuta **Gemini 3.8 Flash** (`gemini-flash-latest`).
- **Nivel 2 (Google Alternativo):**
  - Si el modelo principal devuelve HTTP 429 (cuota de tokens alcanzada en Google AI Studio), conmuta automaticamente al modelo hermano dentro de Google.
- **Nivel 3 (Respaldo Multi-Cloud - Groq Cloud):**
  - Si ambos modelos de Google se encuentran agotados o devuelven 429, escala a **Groq Cloud (Llama 3.3 70B Versatile)** mediante `src/lib/ai-providers.ts` con `response_format: { type: "json_object" }`.
- **Nivel 4 (Motor Local Autonomo):**
  - Si no hay conexion a internet o no se configuro clave de respaldo, degrada de forma transparente al evaluador heuristico local determinista en TypeScript.

---

## 6. Deteccion de Negaciones y Extraccion Semantica de CVs

### 6.1. Extractor Python con stdout UTF-8 (`scripts/extract_cv_pdf.py`)
En entornos Windows, la extraccion de PDFs con caracteres especiales y acentos en espanol (ej. `JOSÉ`, `ANZOÁTEGUI`, `DISEÑO`) puede provocar fallos `UnicodeEncodeError: 'charmap' codec can't encode character` cuando la consola opera bajo Windows-1252.
Se implemento la reconfiguracion forzada de flujo:
```python
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
```
Adicionalmente, la salida JSON se formatea con `ensure_ascii=True` como salvaguarda absoluta.

### 6.2. Deteccion de Limites Tecnicos en CV (Negaciones Semanticas)
Tanto en el prompt de IA como en el extractor heuristico local, se analiza de forma rigurosa si el candidato declara clausulas de no dominio o exclusion voluntaria:
- Expresiones evaluadas:
  - `no domino`, `no domina`, `no manejo`, `no realizo`, `no hago`, `no cuento con`.
  - `sin experiencia en`, `cero conocimiento de`, `fuera de mi alcance`.
  - `descartar`, `excluir`, `evitar`, `no deseo`.
- **Regla Estricta de Ruteo:**
  - Si el candidato declara por ejemplo *"no domina procesos de UI/UX Designer ni herramientas de diseno como Figma"*:
    - Dichas herramientas **NUNCA** se agregan a `extractedSkills`.
    - Se registran de forma automatica en `excludedSkills` (Kill Switch 3 ATS) para proteger al candidato de vacantes de diseno visual.

---

## 7. Referencia Completa de Endpoints de la API

### 7.1. `/api/jobs`
- **`GET`**: Lista todas las vacantes viables almacenadas en SQLite con sus objetos `JobMatch` y `ApplicationTracker`.
- **`POST`**: Inserta o actualiza manualmente una vacante.
- **`DELETE`**: Elimina una vacante (`?id={id}`) o purga la coleccion (`?all=true`).

### 7.2. `/api/jobs/[id]/status`
- **`PATCH`**: Actualiza el estado en el CRM Kanban (`discovered`, `saved`, `applied`, `interviewing`, `offered`, `rejected`) o notas tecnicas.

### 7.3. `/api/profile`
- **`GET`**: Obtiene el perfil del usuario persistido en SQLite.
- **`PUT`**: Guarda modificaciones de cargo, habilidades, limites excluidos, modalidades y sueldos.

### 7.4. `/api/sync`
- **`POST`**: Dispara recoleccion multi-portal en tiempo real (LinkedIn Guest API, Remotive, Jobicy, Arbeitnow), aplica los 5 Kill Switches y guarda vacantes compatibles.

### 7.5. `/api/match`
- **`POST`**: Evalua una descripcion aislada contra el perfil y devuelve el veredicto ATS detallado.

### 7.6. `/api/pitch`
- **`POST`**: Genera mensajes de contacto personalizados por tono (`direct`, `executive`, `impact`).

### 7.7. `/api/interview`
- **`POST`**: Genera 3 preguntas de arquitectura y respuestas modelo con criterio de Hiring Manager.

### 7.8. `/api/cv/parse`
- **`POST`**: Procesa archivos PDF (Base64) o texto de CV, extrayendo seniority neta, cargo real, competencias y limites tecnicos.

### 7.9. `/api/config/gemini`
- **`GET`**: Evalua la salud en vivo segun la estrategia activa (`?strategy=maximum_precision` o `?strategy=smart_saving`). Retorna `healthStatus`, `activeModel`, `statusMessage` y codigos HTTP.
- **`POST`**: Guarda la clave de Gemini y la estrategia de conmutacion en SQLite (`AppConfig`).

### 7.10. `/api/config/backup-ai`
- **`GET`**: Evalua la salud de la conexion con Groq Cloud o proveedor OpenAI compatible.
- **`POST`**: Guarda la clave de API de respaldo, proveedor y modelo en `AppConfig`.

---

## 8. Modulos de Interfaz de Usuario y Experiencia

La interfaz sigue la estetica **Caribbean Sea Glass**:
- Fondo turquesa caribeno profundo (`#022c2e` a `#041f22`).
- Paneles de cristal con desenfoque (`backdrop-blur-xl`, `bg-teal-950/20`, bordes con resplandor `border-teal-400/20`).
- Tipografia de alto contraste y micro-interacciones fluidas con Framer Motion.

### 8.1. Match Radar (`MatchRadarPreview.tsx`)
- Presenta tarjetas de cristal para cada oferta aprobada.
- **MatchRing (`MatchRing.tsx`)**: Componente SVG circular de porcentaje con radio escalado y `overflow-visible`.
- Filtros por puntaje (`90%+`, `80%+`, `Todos`), ordenamiento y compatibilidad de idiomas.
- Acceso directo al `JobInspectorDrawer` y boton `Reroll 10 Nuevas`.

### 8.2. Glass Pipeline CRM (`GlassPipelinePreview.tsx`)
- Tablero Kanban de 6 columnas transaccionales: `Descubiertas`, `Guardadas`, `Postuladas`, `En Entrevista`, `Oferta Recibida` y `Descartadas`.
- Registro de fecha y notas confidenciales de seguimiento por vacante.

### 8.3. Profile Studio (`ProfileStudioPreview.tsx`)
- **Monitor y Estrategia de Gemini 3.8:**
  - Selector de estrategia con pastillas interactivas: "Ahorro Inteligente" vs "Máxima Precisión".
  - Diagnostico individualizado: si Flash agota cuota (HTTP 429), muestra alerta en ambar y recomienda conmutar a Ahorro Inteligente, el cual responde con luz verde (verde esmeralda).
- **Monitor de Respaldo Groq Cloud:**
  - Tarjeta dedicada para ingresar la API Key de Groq (`gsk_...`), con verificacion de salud y enlace directo a la consola de Groq.
- **Carga de CV y Limites Tecnicos:**
  - Carga fisica de CV con retroalimentacion transparente del motor que ejecuto el parseo.
  - Administracion de chips de limites tecnicos (Kill Switch 3) y estatus migratorio (Kill Switch 1).

---

## 9. Instrucciones de Despliegue y Ejecucion Local

### Requisitos Previos:
- Node.js version 20.x o superior (se recomienda Node.js v22+ con soporte `node:sqlite`).
- Python 3.10+ (para extraccion de texto en PDFs complejos).
- Clave de API de Google AI Studio (Gemini 3.8) y opcionalmente clave de Groq Cloud para respaldo.

### Pasos de Inicio:
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. O en Windows, hacer doble clic sobre:
   ```text
   Iniciar-GlassMatch.bat
   ```
4. Navegar a: `http://localhost:3000`

---
*Fin del documento de contexto tecnico de GlassMatch AI.*

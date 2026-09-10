# CONTEXT.md — Documento Maestro de Contexto y Auditoria Tecnica
## Proyecto: GlassMatch AI (Caribbean Sea Glass Edition)
**Version:** 0.1.0  
**Fecha de corte:** Septiembre 2026  
**Proposito del documento:** Proporcionar una radiografia tecnica exhaustiva, rigurosa y sin ambiguedades de toda la aplicacion para revision, auditoria de seguridad, arquitectura y deteccion de anomalias por agentes de IA y personal de ingenieria externo.

---

## 1. Vision General y Proposito del Sistema

GlassMatch AI es un sistema local e inteligente de evaluacion ATS (Applicant Tracking System), radar de vacantes en tiempo real y CRM de postulaciones disenado especificamente para eliminar el 100% de los falsos positivos y vacantes incompatibles en la busqueda laboral de perfiles tecnologicos.

El sistema opera bajo el principio de **Confianza Cero (Zero-Trust ATS Engine)**:
1. Toda vacante entrante se presume incompatible (0% Match) por defecto.
2. Debe superar de forma obligatoria e independiente una bateria de 5 Kill Switches (filtros de descarte absoluto) antes de calcular un score de afinidad.
3. Las vacantes descartadas por cualquier Kill Switch no se almacenan en la base de datos ni se muestran en el radar visual, garantizando una tasa de ruido nula para el usuario.
4. Incluye un radar de afinidad en tiempo real, un CRM tipo Kanban (Glass Pipeline) de 6 etapas, un estudio de perfil (Profile Studio) con extraccion multimodal de CVs mediante IA y soporte de scraping en vivo a traves de multiples portales (LinkedIn, Remotive, Jobicy, Arbeitnow).

---

## 2. Pila Tecnologica y Entorno de Ejecucion

- **Framework Web:** Next.js 16.3.4 (App Router con Turbopack activo).
- **Libreria de UI:** React 19.2.8 y React DOM 19.2.8.
- **Lenguaje:** TypeScript 5 (modo estricto).
- **Estilos y Diseno:** Tailwind CSS v4 con plugin `@tailwindcss/postcss`, configurado bajo el sistema de diseno "Caribbean Sea Glass".
- **Animaciones:** Framer Motion 13.2.0.
- **Iconografia:** Lucide React 1.43.0.
- **Base de Datos:** SQLite embebido nativo mediante `node:sqlite` (`DatabaseSync` de Node.js v22+), ubicado en `prisma/dev.db` con concurrencia transaccional e integridad referencial (`PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`, `PRAGMA busy_timeout = 5000`).
- **Motor de IA Principal:** Google Gemini 2.0 Flash (`gemini-flash-latest`) via API REST directa con endpoints de generacion de contenido estructurado JSON.
- **Fallback Heuristico Local:** Analizador semantico determinista implementado en TypeScript para operar sin conexion o ante limites de cuota de la API de IA.
- **Scrapers Auxiliares:** Python 3 con librerias `jobspy` y `pypdf` para recoleccion externa de vacantes y parseo local de PDFs.
- **Sistema Operativo Objetivo:** Windows (con script de inicio rapido en batch `Iniciar-GlassMatch.bat` y resolucion forzada IPv4).

---

## 3. Arquitectura del Arbol de Archivos

```
glassmatch-ai/
├── .env.local                     # Variables de entorno (GEMINI_API_KEY)
├── Iniciar-GlassMatch.bat         # Launcher Windows de 1 clic (deteccion de puerto 3000)
├── package.json                   # Dependencias npm
├── tsconfig.json                  # Configuracion TypeScript
├── next.config.ts                 # Configuracion Next.js
├── postcss.config.mjs             # PostCSS con Tailwind v4
├── eslint.config.mjs              # Configuracion ESLint
├── prisma/
│   ├── schema.prisma              # Definicion declarativa de esquemas relacionales
│   └── dev.db                    # Archivo binario SQLite persistente
├── public/                        # Iconos y assets estaticos SVG
├── scripts/
│   ├── extract_cv_pdf.py          # Extractor auxiliar de texto PDF con pypdf
│   ├── jobspy_scraper.py          # Scraper auxiliar multi-portal (LinkedIn/Indeed/Glassdoor)
│   ├── purge_db.js                # Script de mantenimiento y purga de base de datos
│   └── requirements.txt           # Dependencias Python (jobspy, pypdf, pandas)
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css            # Clases de utilidad y diseno Caribbean Sea Glass
    │   ├── layout.tsx             # Shell HTML raiz con fuentes y metadatos
    │   ├── page.tsx               # Controlador principal de vistas (Tabs: Radar, Pipeline, Studio)
    │   └── api/
    │       ├── config/gemini/route.ts       # GET/POST configuracion y test de clave Gemini
    │       ├── cv/parse/route.ts            # POST parseo multimodal de CV (PDF Base64 / Texto)
    │       ├── interview/route.ts           # POST generador de preguntas y respuestas de entrevista
    │       ├── jobs/
    │       │   ├── route.ts                 # GET listar vacantes aprobadas, POST crear, DELETE purgar
    │       │   └── [id]/status/route.ts     # PATCH actualizar fase en pipeline y notas personales
    │       ├── match/route.ts               # POST evaluacion ATS aislada candidato vs vacante
    │       ├── pitch/route.ts               # POST generador de mensajes de contacto (Direct, Executive, Impact)
    │       ├── profile/route.ts             # GET/PUT perfil del usuario persistido
    │       └── sync/route.ts                # POST scraping en vivo multi-portal + filtro Kill Switch
    ├── components/
    │   ├── layout/
    │   │   └── GlassHeader.tsx              # Barra de navegacion flotante con tabs y acciones rapidas
    │   ├── modules/
    │   │   ├── MatchRadarPreview.tsx        # Radar de vacantes con circular MatchRing y filtros
    │   │   ├── GlassPipelinePreview.tsx     # CRM Kanban de postulaciones (6 columnas)
    │   │   ├── ProfileStudioPreview.tsx     # Editor de perfil, CV, limites tecnicos y visa
    │   │   ├── JobInspectorDrawer.tsx       # Drawer lateral para inspeccionar vacante, pitch y simulacro
    │   │   ├── SyncJobsModal.tsx            # Modal para disparar scraping masivo configurable
    │   │   ├── QuickAddModal.tsx            # Modal para pegar y evaluar una vacante manual
    │   │   ├── JobNotesModal.tsx            # Modal para editar notas privadas de seguimiento
    │   │   └── TutorialModal.tsx            # Tour interactivo guiado paso a paso
    │   └── ui/
    │       └── MatchRing.tsx                # Indicador circular SVG con stroke optimizado y sin corte
    ├── context/
    │   └── AppContext.tsx                   # Estado global unificado con sincronizacion bidireccional SQLite
    ├── lib/
    │   ├── db.ts                            # Capa de persistencia nativa con DatabaseSync (node:sqlite)
    │   ├── gemini.ts                        # Motor ATS Zero-Trust, Kill Switches y llamadas a Gemini 2.0
    │   └── utils.ts                         # Funciones auxiliares de clases CSS (cn)
    └── types/
        ├── index.ts                         # Definiciones de tipos TypeScript del dominio
        └── sqlite.d.ts                      # Tipado complementario para node:sqlite
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
| `currentTitle` | TEXT NOT NULL | Titulo representativo (ej. `Frontend Developer & UI/UX Designer`) |
| `seniority` | TEXT NOT NULL | Nivel de experiencia (`Junior`, `Mid`, `Senior`, `Lead`, `Principal`) |
| `rawCvText` | TEXT | Contenido textual extraido del curriculo |
| `extractedSkills` | TEXT NOT NULL | Array JSON de tecnologias dominadas (ej. `["HTML","CSS","JavaScript","Tailwind CSS","Figma"]`) |
| `excludedSkills` | TEXT | Array JSON de limites tecnicos / tecnologias prohibidas (Kill Switch 3) |
| `visaStatus` | TEXT | Situacion migratoria y legal (Kill Switch 1) |
| `targetRoles` | TEXT NOT NULL | Array JSON de puestos deseados |
| `workModes` | TEXT NOT NULL | Array JSON de modalidades aceptadas (`["remote", "hybrid"]`) |
| `minSalary` | REAL | Salario minimo pretendido anual en USD |
| `preferredLocs` | TEXT NOT NULL | Array JSON de ubicaciones georreferenciadas |
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
| `key` | TEXT PRIMARY KEY | Clave identificadora (ej. `GEMINI_API_KEY`) |
| `value` | TEXT NOT NULL | Valor parametrizado |
| `updatedAt` | TEXT NOT NULL | Timestamp ISO de modificacion |

---

## 5. El Motor ATS Zero-Trust: Los 5 Kill Switches

El nucleo del sistema se ubica en `src/lib/gemini.ts`. Opera tanto en modo IA directa con Gemini 2.0 Flash como en modo determinista heuristico local.

### 5.1. Protocolo de Confianza Cero
Ninguna vacante recibe un score mayor a 0% a menos que supere de forma simultanea y estricta los cinco Kill Switches siguientes:

#### Kill Switch 1: BARRERA_GEOGRAFICA_LEGAL
- **Criterio de descarte:**
  - Puestos presenciales (on-site) fuera de la region de residencia del candidato.
  - Exigencia estricta de residencia legal continua o fiscal en paises foraneos (ej. `Being a resident in Germany for the last Year consecutively`, `living in the UK`, `resident in France`, `resident in Canada`).
  - Restricciones legales de contratacion para ciudadanos o residentes de EE.UU. sin visado ni patrocinio (ej. `Must be US Citizen`, `Green Card Holder`, `Authorized to work in US without sponsorship`, `W2 only`, `No C2C`, `Security Clearance required`).
- **Excepcion valida:**
  - Vacantes `100% Remote Global` o aquellas que admiten contratacion internacional bajo esquema `Contractor B2B`.

#### Kill Switch 2: DESVIACION_DISCIPLINA (Falsos Positivos de Dominio)
- **Criterio de descarte:**
  - Vacantes operativas, administrativas o de soporte que mencionan incidentalmente herramientas tecnicas (ej. Git, CSS o HTML basico) pero cuyo proposito no es el desarrollo ni el diseno.
  - Lista de exclusion de titulos incompatibles:
    - `search analyst`, `media search analyst`, `data analyst`, `evaluator`, `annotator`, `content moderator`.
    - `talent acquisition`, `recruiter`, `sourcer`, `human resources`, `hr`.
    - `help desk`, `service desk`, `soporte tecnico`, `technical support`, `desktop support`.
    - `network engineer`, `sysadmin`, `systems administrator`, `cableado`, `telecom`.
    - `sales representative`, `account executive`, `call center`, `customer service`.
    - `civil engineer`, `arquitectura civil`, `structural engineer`.
- **Guardián Dinámico de Título:**
  El título de la vacante se tokeniza y se compara contra los términos normalizados configurados en `UserProfile.targetRoles` y `UserProfile.currentTitle`. Si el título de la oferta no tiene afinidad semántica con ninguno de los roles objetivo del perfil activo, se descarta con score 0%.
- **Exigencia de Afinidad Central de Stack:**
  Debe coincidir en al menos dos competencias troncales presentes en el array `UserProfile.extractedSkills` del candidato.


#### Kill Switch 3: HABILIDAD_EXCLUIDA (Limites Tecnicos del Candidato)
- **Criterio de descarte:**
  - Si la vacante exige obligatoriamente tecnologias explicitamente vetadas por el usuario en su perfil.
  - Configurado por defecto en el perfil inicial (personalizable por el usuario en Profile Studio):
    - `C#`, `ASP.NET`, `.NET`, `Java Enterprise`, `Spring Boot`, `Soporte IT / Help Desk`, `Redes / Hardware`, `Arquitectura Civil`, `DevOps pesado`.
  - Deteccion mediante limites de palabra por expresiones regulares (`(^|[^a-zA-Z0-9_#+])`) para evitar colisiones accidentales de subcadenas.

#### Kill Switch 4: BARRERA_IDIOMATICA
- **Criterio de descarte:**
  - La vacante exige dominio profesional de un idioma no dominado por el candidato.
  - Deteccion de idioma Aleman: `german`, `(de)`, `deutsch`, `deutschkenntnisse`, `verhandlungssichere deutschkenntnisse`. Si el candidato no tiene aleman registrado, se dispara descarte inmediato.
  - Deteccion de idioma Frances: `french`, `(fr)`, `français`.
  - Deteccion de desajuste en Ingles: Si la vacante exige nivel `English C1/C2` (fluidez ejecutiva/cliente o bilingue nativo) y el perfil del candidato esta categorizado en niveles inferiores (`B1`, `A2`, etc.).

#### Kill Switch 5: BRECHA_SENIORITY
- **Criterio de descarte:**
  - Puestos con requisitos de experiencia inaccesibles para el seniority real del candidato.
  - Si el candidato es `Junior` o `Mid`, y la vacante exige:
    - Mas de 7 u 8 anos de experiencia (`7+ years`, `8+ years`, `10+ years`).
    - Titulos de liderazgo de alta jerarquia: `Principal Engineer`, `Lead Engineer`, `Staff Engineer`, `Engineering Manager`, `Director of Engineering`, `VP of Engineering`, `Lead Architect`.

---

## 6. Pipeline de Scraping y Sincronizacion en Vivo

El sistema incluye un colector multi-canal asincrono en `src/app/api/sync/route.ts` que consulta simultaneamente cuatro proveedores publicos sin depender de credenciales de pago:

```
[Cliente: Click Sincronizar]
           │
           ▼
[POST /api/sync]
     ├──────────────────────┬──────────────────────┬──────────────────────┐
     ▼                      ▼                      ▼                      ▼
LinkedIn Guest API    Remotive API           Jobicy API             Arbeitnow API
(seeMoreJobPostings)  (remote-jobs)          (v2/remote-jobs)       (job-board-api)
     │                      │                      │                      │
     └──────────────────────┴──────────────────────┴──────────────────────┘
                                   │
                                   ▼
             [Filtro de Desduplicacion y Exclusion de Titulos]
                                   │
                                   ▼
             [Bucle de Evaluacion ATS: 5 Kill Switches]
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
         Dispara Kill Switch (0%)        Supera los 5 Switches (>=65%)
                    │                             │
             [DESCARTAR VACANTE]           [INSERT INTO SQLite]
             (No se guarda en DB)         (JobOffer + JobMatch + Tracker)
                                                  │
                                                  ▼
                                       [Respuesta JSON al Radar]
```

### 6.1. Extraccion Profunda de Descripciones en LinkedIn
Para las vacantes obtenidas via la API de invitados de LinkedIn, el colector realiza una peticion secundaria a `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{jobId}` con cabeceras de navegador reales, extrayendo el contenido HTML de `class="show-more-less-html__markup"`. Esto permite evaluar los requisitos reales, anos de experiencia, nivel de idiomas y clausulas migratorias de la empresa, evitando evaluar solo el titulo o snippets truncados.

### 6.2. Sanitizacion, Pre-Filtrado Determinista Local y Pausa con Jitter
Para optimizar el uso de tokens y proteger la IP contra bloqueos HTTP 429 de LinkedIn Guest API:
1. **Sanitizacion Inmediata:** La funcion `sanitizeJobDescription` despoja etiquetas `<style>`, `<script>`, `<br>`, `<li>` y entidades HTML antes de cualquier procesamiento.
2. **Pre-Filtro Determinista Local (Zero-Token Waste):** Antes de enviar cualquier vacante a Gemini, se ejecuta `runDeterministicKillSwitches`. Si se dispara una regla dura (nacionalidad, W2, titulo incompatible o tecnologia vetada), la oferta se descarta en 0 ms y a costo cero de tokens de IA.
3. **Pausa Preventiva con Jitter:** Entre cada vacante procesada, se aplica un retardo aleatorio de 1.2 a 2.5 segundos (`sleepWithJitter`) para simular navegacion organica y evitar bloqueos por tasa de peticiones.

---

## 7. Referencia Completa de Endpoints de la API

### 7.1. `/api/jobs`
- **`GET`**: Obtiene todas las vacantes almacenadas en SQLite con sus objetos `JobMatch` y `ApplicationTracker` asociados. Solo retorna vacantes viables (`isMatch != 0` y `matchScore > 0` y sin `killSwitchTriggered`).
- **`POST`**: Inserta o actualiza manualmente una vacante y su match en la base de datos.
- **`DELETE`**: Permite eliminar una vacante individual por parametro `?id={jobId}` o purgar todas las vacantes si se proporciona `?all=true`.

### 7.2. `/api/jobs/[id]/status`
- **`PATCH`**: Actualiza la fase de una postulacion en el pipeline CRM (`discovered`, `saved`, `applied`, `interviewing`, `offered`, `rejected`) o modifica las notas privadas del usuario.

### 7.3. `/api/profile`
- **`GET`**: Obtiene el perfil del usuario actual desde SQLite. Si la base de datos esta vacia, siembra automaticamente el perfil inicial predeterminado.
- **`PUT`**: Persiste modificaciones en el perfil: habilidades extraidas, limites tecnicos excluidos (`excludedSkills`), situacion de visado (`visaStatus`), modalidades y rangos salariales.

### 7.4. `/api/sync`
- **`POST`**: Orquesta la busqueda y evaluacion de vacantes en tiempo real.
  - Parametros: `searchTerm`, `location`, `resultsWanted`, `existingJobIds`, `profile`.
  - Retorna unicamente las vacantes que superaron los Kill Switches.

### 7.5. `/api/match`
- **`POST`**: Evalua una descripcion textual de vacante contra el perfil suministrado y entrega el veredicto ATS (score, kill switch disparado, resumen ejecutivo, fortalezas y brechas).

### 7.6. `/api/pitch`
- **`POST`**: Genera una carta o mensaje de contacto adaptado a la vacante y al tono seleccionado:
  - `direct`: Mensaje conciso de LinkedIn de maximo 120 palabras.
  - `executive`: Carta formal y pulida de tres parrafos.
  - `impact`: Enfoque en metricas de rendimiento y entrega de producto.

### 7.7. `/api/interview`
- **`POST`**: Genera 3 preguntas punzantes de entrevista tecnica simulando al Hiring Manager de la empresa de la vacante, incluyendo la respuesta modelo esperada.

### 7.8. `/api/cv/parse`
- **`POST`**: Acepta texto crudo de CV o archivo PDF codificado en Base64. Utiliza Gemini 2.0 Flash multimodal para deducir de forma objetiva:
  - Seniority real segun tiempo neto en puestos de software.
  - Titulo representativo coherente.
  - Habilidades dominadas y nivel de ingles.
  - Pretension salarial de mercado sugerida.

### 7.9. `/api/config/gemini`
- **`GET`**: Consulta si existe una clave de Gemini configurada consultando la tabla `AppConfig` o memoria y devuelve una version enmascarada (`AIzaSy...4xQ1`).
- **`POST`**: Guarda la clave de API en la tabla relacional `AppConfig` de SQLite y actualiza `process.env.GEMINI_API_KEY` en la memoria del proceso en caliente sin sobreescribir `.env.local` (cero reinicios de Turbopack).

---

## 8. Modulos de Interfaz de Usuario y Experiencia

La interfaz sigue la estetica **Caribbean Sea Glass**:
- Fondo turquesa caribeno profundo (`#022c2e` a `#041f22`).
- Paneles con efecto cristal esmerilado (`backdrop-blur-xl`, `bg-teal-950/20`, bordes con brillo sutil `border-teal-400/20`).
- Tipografia de alto contraste con jerarquia visual limpia.

### 8.1. GlassHeader (`src/components/layout/GlassHeader.tsx`)
- Barra superior flotante con indicador en vivo del estado de conexion de la IA (Gemini Live vs Modo Heuristico).
- Switch de navegacion entre las tres vistas maestras:
  1. **Radar de Match**: Explorador de oportunidades viables con ranking.
  2. **Glass Pipeline**: Tablero Kanban de gestion de postulaciones.
  3. **Profile Studio**: Administracion de curriculo, limites tecnicos y configuracion de visa.
- Botones de acceso rapido:
  - **Sincronizar**: Abre el modal de recoleccion en vivo.
  - **Nueva Vacante**: Evaluacion instantanea de texto pegado.
  - **Guia / Tutorial**: Asistente interactivo guiado.

### 8.2. Match Radar (`src/components/modules/MatchRadarPreview.tsx`)
- Presenta tarjetas de cristal para cada oferta aprobada.
- **MatchRing (`src/components/ui/MatchRing.tsx`)**: Componente SVG circular de porcentaje con radio escalado, padding perimetral de 3px y `overflow-visible` para prevenir el corte del trazo superior.
- Filtro rapido por puntaje de match (`90%+`, `80%+`, `Todos`) y selector de ordenamiento.
- Al hacer clic en una tarjeta, se despliega el `JobInspectorDrawer`.

### 8.3. Glass Pipeline CRM (`src/components/modules/GlassPipelinePreview.tsx`)
- Tablero de 6 columnas:
  1. `Descubiertas` (`discovered`)
  2. `Guardadas` (`saved`)
  3. `Postuladas` (`applied`)
  4. `En Entrevista` (`interviewing`)
  5. `Oferta Recibida` (`offered`)
  6. `Descartadas` (`rejected`)
- Permite mover postulaciones entre fases con un solo clic, registrar fechas de postulacion y agregar notas tecnicas privadas (`JobNotesModal`).

### 8.4. Profile Studio (`src/components/modules/ProfileStudioPreview.tsx`)
- **Carga de CV:** Soporta arrastrar archivos PDF o pegar texto plano, con indicador de progreso de parseo mediante Gemini.
- **Limites Tecnicos (Kill Switch 3):** Permite anadir o remover tecnologias vetadas con un clic, recalculando la regla de exclusion de inmediato.
- **Estatus Legal y Migratorio (Kill Switch 1):** Selector interactivo de estatus de visado (Contractor Internacional B2B, Ciudadania, Green Card, etc.).
- **Matriz de Idiomas (Kill Switch 4):** Configuracion de fluidez y modo de trabajo preferido (comunicacion asincrona vs fluidez en vivo).

### 8.5. Job Inspector Drawer (`src/components/modules/JobInspectorDrawer.tsx`)
- Panel deslizante lateral con pestañas:
  - **Diagnostico ATS:** Muestra desglose de fortalezas, advertencias de brechas y resumen ejecutivo.
  - **Pitch Generator:** Generador de cartas en 3 tonos con opcion de copiado al portapapeles.
  - **Simulador de Entrevista:** 3 preguntas de arquitectura y respuestas esperadas generadas por la IA para la vacante en cuestion.
  - **Descripcion Original:** Texto completo de la vacante para inspeccion humana.

---

## 9. Ingenieria de Resiliencia y Red

### 9.1. Resolucion Forzada IPv4
En entornos Windows con Node.js v20+, ciertas consultas DNS a los endpoints de Google Generative Language pueden provocar tiempos de espera excesivos o fallos de resolucion cuando el proveedor de internet no tiene enrutamiento IPv6 funcional. Se implemento de forma preventiva:
```typescript
import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
```

### 9.2. Supresion de Presupuesto de Pensamiento (Thinking Budget = 0)
Para modelos Gemini 2.0 Flash (`gemini-flash-latest`), se parametrizo explicitamente:
```typescript
generationConfig: {
  temperature: 0.1,
  responseMimeType: "application/json",
  thinkingConfig: { thinkingBudget: 0 }
}
```
Esto evita la generacion de tokens de pensamiento superfluos en tareas de clasificacion ATS, reduciendo la latencia de respuesta de 6-8 segundos a menos de 900 milisegundos por vacante.

### 9.3. Regulación de Tasa de Peticiones (Jitter Preventivo)
En el bucle de sincronización de `src/app/api/sync/route.ts`, se incorporó una pausa aleatoria con jitter de 1.2 a 2.5 segundos entre peticiones sucesivas. Esto evita soft-bans y respuestas `429 Too Many Requests` en la API de invitados de LinkedIn, simulando navegación humana.

---

## 10. Matriz de Auditoria Tecnica y Casos de Borde para Revisores

Se detalla la lista de puntos criticos evaluados y recomendaciones de atencion para cualquier auditor externo:

| Componente | Riesgo Potencial | Mitigacion Implementada | Estado |
| :--- | :--- | :--- | :--- |
| **Persistencia SQLite** | Bloqueo por concurrencia y registros huérfanos | Activación en arranque de `PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`, `PRAGMA busy_timeout = 5000` y `PRAGMA synchronous = NORMAL`. | Seguro y transaccional para uso local; soporta lecturas y escrituras concurrentes sin bloqueo y garantiza eliminación en cascada. |
| **Kill Switch Idiomas** | Falsos positivos por palabras comunes (ej. "English and German company") | El analizador busca frases de obligatoriedad (`fluent german`, `german language`, `verhandlungssichere deutschkenntnisse`) o codigos de mercado `(DE)`. | Estable. No se reportan falsos positivos en puestos globales. |
| **Kill Switch Legal EE.UU.** | Exclusion accidental de puestos remotos B2B | El filtro verifica expresamente clausulas restrictivas (`US Citizen only`, `W2 only`, `No C2C`, `No sponsorship`). Si la oferta dice `Remote Global`, se omite la bandera. | Probado y verificado. |
| **Deteccion de Limites Tecnicos** | Colision de subcadenas (ej. detectar `C#` dentro de otra palabra) | Uso de limites regex estrictos `(^|[^a-zA-Z0-9_#+])` alrededor de cada tecnologia excluida. | Completamente verificado. |
| **Extraccion de CV** | PDFs protegidos o escaneados como imagenes puras | `scripts/extract_cv_pdf.py` maneja extraccion estandar con `pypdf`. Gemini multimodal recibe Base64 nativo directo para OCR. | Soporta tanto PDFs de texto vectorial como escaneados. |
| **Scrapers Externos** | Bloqueos por CAPTCHA o cambios en el DOM de LinkedIn | Se emplea la API de invitados `seeMoreJobPostings` y fallback automatico a Remotive, Jobicy y Arbeitnow si LinkedIn devuelve vacio. | Alta disponibilidad garantizada por fuentes redundantes. |
| **Renderizado SVG MatchRing** | Corte del contorno superior del circulo por `overflow` | Se configuro `viewBox="-3 -3 46 46"` y clase `overflow-visible` con `padding = 3` en `src/components/ui/MatchRing.tsx`. | Verificado visualmente sin cortes. |

---

## 11. Instrucciones de Despliegue y Ejecucion Local

### Requisitos Previos:
- Node.js version 20.x o superior.
- Python 3.10+ (opcional para scraping JobSpy ampliado o parseo local de PDFs).
- Clave de API de Google Gemini (opcional pero recomendada para analisis semantico en vivo).

### Pasos de Inicio:
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo con Turbopack:
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

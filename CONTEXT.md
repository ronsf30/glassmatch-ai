# CONTEXT.md — Documento Maestro de Contexto y Auditoria Tecnica
## Proyecto: GlassMatch AI (Caribbean Sea Glass Edition)
**Version:** 0.3.0 (Fase 5 Mini-CRM Glass Pipeline & Preparacion de Postulacion)  
**Fecha de corte:** 10 de Septiembre de 2026  
**Repositorio Oficial:** https://github.com/ronsf30/glassmatch-ai (Rama: main)  
**Proposito del documento:** Proporcionar una radiografia tecnica exhaustiva, rigurosa y sin ambiguedades de toda la arquitectura, modelos de datos, endpoints, logica algoritmica y estado de desarrollo de la aplicacion para revision, auditoria de seguridad, analisis de codigo y evaluacion por personal de ingenieria y agentes de IA externos.

---

## 1. Resumen Ejecutivo y Mision del Sistema

GlassMatch AI es una plataforma local y privada disenada para ingenieros de software, disenadores de producto y profesionales tecnicos que buscan empleo remoto e internacional. Su proposito fundamental es erradicar el 100% de los falsos positivos y postulaciones inviables generadas por los motores de recomendacion tradicionales.

El sistema se rige por los siguientes principios no negociables:
1. **Confianza Cero ATS (Zero-Trust ATS Engine):** Toda oferta laboral entrante se presume incompatible (0% Match) por defecto. Solo tras superar una bateria de 5 Kill Switches deterministas y semanticos se autoriza el calculo de afinidad y se persiste en el inventario.
2. **Cascada de Inteligencia Artificial en 4 Niveles:** Garantiza operatividad ininterrumpida combinando modelos de ultima generacion con aislamiento multi-nube y fallback determinista local con cero consumo de tokens.
3. **Privacidad Absoluta (Local-First):** La base de datos relacional reside exclusivamente en el equipo del usuario mediante SQLite nativo con transaccionalidad WAL, sin telemetria ni dependencias de bases de datos centralizadas en la nube.
4. **Diseno de Autor Caribbean Sea Glass:** Interfaz grafica de alto contraste inspirada en iOS Glass Design y visionOS, orientada a reducir la fatiga cognitiva durante la busqueda laboral.
5. **Filosofia "Standing on Giants":** Aprovecha herramientas de codigo abierto consolidadas (JobSpy, Next.js 16, SQLite, Tailwind v4) orquestadas mediante logica semantica avanzada.

---

## 2. Pila Tecnologica y Entorno de Ejecucion

- **Framework Web:** Next.js 16.3.4 (App Router con compilador Turbopack activo).
- **Libreria de UI:** React 19.2.8 y React DOM 19.2.8.
- **Lenguaje:** TypeScript 5 (modo estricto, 0 errores de tipado en `tsc --noEmit`).
- **Estilos y Diseno:** Tailwind CSS v4 con plugin `@tailwindcss/postcss` y diseno de cristal translúcido (*Caribbean Sea Glass*).
- **Animaciones:** Framer Motion 13.2.0.
- **Iconografia:** Lucide React 1.43.0.
- **Base de Datos:** SQLite embebido nativo mediante `node:sqlite` (`DatabaseSync` de Node.js v22+), ubicado en `prisma/dev.db`.
  - Concurrencia e integridad: `PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;`
- **Motores de Inteligencia Artificial:**
  - **Primario (Google Cloud):** Google Gemini 3.8:
    - `gemini-3.8-flash` (`gemini-flash-latest`): Analisis profundo, diagnostico cualitativo y preparacion de entrevistas.
    - `gemini-3.8-flash-lite` (`gemini-flash-lite-latest`): Analisis de alta velocidad con ahorro estricto de tokens.
  - **Secundario (Multi-Cloud Groq):** Groq Cloud API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) con generacion JSON estricta.
  - **Terciario (Motor Heuristico Local):** Evaluador determinista puro en TypeScript (0 tokens, operable offline).
- **Scrapers Auxiliares:** Python 3 con librerias `jobspy` y `pypdf`, con forzado de encoding UTF-8 para compatibilidad absoluta en Windows.
- **Entorno de Red:** Resolucion local forzada IPv4 (`127.0.0.1:3000`).

---

## 3. Arquitectura del Arbol de Archivos

```
glassmatch-ai/
├── .env.local                     # Variables locales de entorno (GEMINI_API_KEY, GROQ_API_KEY) [GitIgnore]
├── .env.local.example             # Plantilla segura de variables de entorno
├── .gitignore                     # Exclusion de .env, *.db, *.db-wal, *.db-shm y __pycache__
├── Iniciar-GlassMatch.bat         # Script de inicio rapido en 1 clic para Windows
├── package.json                   # Dependencias de produccion y desarrollo
├── tsconfig.json                  # Configuracion TypeScript en modo estricto
├── next.config.ts                 # Configuracion Next.js con soporte Turbopack
├── postcss.config.mjs             # PostCSS con Tailwind v4
├── eslint.config.mjs              # Configuracion ESLint
├── prisma/
│   ├── schema.prisma              # Definicion declarativa de esquemas relacionales
│   └── dev.db                    # Archivo binario SQLite local transaccional
├── public/                        # Iconos y recursos visuales estaticos SVG
├── scripts/
│   ├── extract_cv_pdf.py          # Extractor auxiliar de texto PDF con pypdf y stdout UTF-8 forzado
│   ├── jobspy_scraper.py          # Scraper multi-portal open-source (LinkedIn, Indeed, Glassdoor)
│   ├── purge_db.js                # Utilidad de purga y mantenimiento de base de datos
│   └── requirements.txt           # Dependencias Python
└── src/
    ├── app/
    │   ├── globals.css            # Clases de utilidad y diseno Caribbean Sea Glass
    │   ├── layout.tsx             # Shell HTML raiz con fuentes tipograficas
    │   ├── page.tsx               # Controlador principal de vistas (Tabs: Radar, Pipeline, Studio)
    │   └── api/
    │       ├── config/
    │       │   ├── gemini/route.ts       # GET/POST diagnostico y conmutacion de estrategia Gemini
    │       │   └── backup-ai/route.ts    # GET/POST diagnostico y clave de Groq Cloud
    │       ├── cv/parse/route.ts         # POST parseo multimodal de CV (Gemini Base64 / Python)
    │       ├── interview/route.ts        # POST simulador de preguntas de entrevista tecnica
    │       ├── jobs/
    │       │   ├── route.ts              # GET listar vacantes aprobadas, POST crear, DELETE purgar
    │       │   └── [id]/status/route.ts  # PATCH actualizar estado en el pipeline y notas
    │       ├── match/route.ts            # POST evaluacion aislada candidato vs vacante
    │       ├── pitch/route.ts            # POST generador de pitches de contacto por tono
    │       ├── profile/route.ts          # GET/PUT perfil persistido en SQLite
    │       └── sync/route.ts             # POST sincronizacion y descarte Kill Switch
    ├── components/
    │   ├── layout/
    │   │   ├── AmbientGlow.tsx           # Efectos ambientales difusos
    │   │   └── GlassHeader.tsx           # Barra de navegacion flotante con conmutador de motor
    │   ├── modules/
    │   │   ├── MatchRadarPreview.tsx     # Estacion de busqueda, filtros avanzados y feed de vacantes
    │   │   ├── GlassPipelinePreview.tsx  # Kanban bidireccional de 5 estados con metricas de embudo
    │   │   ├── ProfileStudioPreview.tsx  # Estudio de CV, limites tecnicos y configuracion de IA
    │   │   ├── JobInspectorDrawer.tsx    # Drawer lateral para inspeccion, simulacro de entrevista y pitch
    │   │   ├── SyncJobsModal.tsx         # Modal para scraping masivo multi-portal
    │   │   ├── QuickAddModal.tsx         # Modal para analisis manual rapido de vacantes
    │   │   ├── JobNotesModal.tsx         # Modal para notas privadas con etiquetas de progreso
    │   │   └── TutorialModal.tsx         # Guia interactiva de onboarding
    │   └── ui/
    │       ├── GlassBadge.tsx            # Insignias translucidas de estado y tecnologia
    │       ├── GlassButton.tsx           # Boton interactivo con efecto de cristal
    │       ├── GlassCard.tsx             # Tarjeta de cristal con borde de luz y desenfoque
    │       └── MatchRing.tsx             # Anillo SVG circular para puntaje ATS
    ├── context/
    │   └── AppContext.tsx                # Estado global y sincronizacion reactiva con SQLite
    ├── lib/
    │   ├── ai-providers.ts               # Integracion de cliente Groq Cloud y OpenAI compatible
    │   ├── db.ts                         # Conexion e inicializacion nativa de SQLite
    │   ├── gemini.ts                     # Cascada de IA en 4 niveles y bateria de 5 Kill Switches
    │   └── utils.ts                      # Deduplicacion canonica, parseo salarial progresivo y utilidades
    └── types/
        └── index.ts                      # Definiciones exhaustivas de tipos TypeScript
```

---

## 4. Esquema Relacional de Base de Datos (SQLite Local)

La persistencia se gestiona de forma local e independiente en `prisma/dev.db` bajo 5 tablas relacionales:

### 4.1. Tabla `AppConfig`
Gestiona la configuracion dinamica en caliente sin necesidad de reiniciar el servidor:
* `key TEXT PRIMARY KEY`: Clave de configuracion (`gemini_api_key`, `gemini_strategy`, `backup_ai_key`, `backup_ai_provider`, `backup_ai_model`, `ai_engine_mode`).
* `value TEXT NOT NULL`: Valor serializado.
* `updatedAt TEXT NOT NULL`: Marca temporal ISO.

### 4.2. Tabla `UserProfile`
Almacena el perfil integral del candidato:
* `id TEXT PRIMARY KEY`: Identificador unico del perfil.
* `fullName TEXT NOT NULL`: Nombre completo.
* `currentTitle TEXT NOT NULL`: Titulo profesional actual.
* `seniority TEXT NOT NULL`: Nivel de experiencia (`Junior`, `Mid`, `Senior`, `Lead`).
* `rawCvText TEXT`: Texto extraido o plano del curriculum.
* `cvFileName TEXT`: Nombre del archivo PDF original.
* `extractedSkills TEXT NOT NULL`: JSON array con las tecnologias dominadas.
* `excludedSkills TEXT`: JSON array con tecnologias explícitamente excluidas (Kill Switch 3).
* `visaStatus TEXT`: Condicion migratoria y laboral (ej. Solo Contractor Remoto Internacional B2B).
* `targetRoles TEXT NOT NULL`: JSON array con cargos objetivo.
* `workModes TEXT NOT NULL`: JSON array (`remote`, `hybrid`, `onsite`).
* `minSalary REAL`: Expectativa salarial minima en USD anuales (Fuente unica de verdad).
* `preferredLocs TEXT NOT NULL`: JSON array con ubicaciones permitidas.
* `updatedAt TEXT NOT NULL`: Marca temporal de ultima modificacion.

### 4.3. Tabla `JobOffer`
Registro de ofertas laborales compatibles:
* `id TEXT PRIMARY KEY`: Identificador unico o generado mediante hash canonico.
* `title TEXT NOT NULL`: Titulo oficial del puesto.
* `company TEXT NOT NULL`: Empresa contratante.
* `location TEXT NOT NULL`: Ubicacion o indicativo remoto.
* `workMode TEXT NOT NULL`: Modalidad (`remote`, `hybrid`, `onsite`).
* `url TEXT NOT NULL`: Enlace web original de la oferta.
* `salaryText TEXT`: Rango o salario explicitamente publicado.
* `description TEXT NOT NULL`: Descripcion completa de requerimientos y funciones.
* `source TEXT NOT NULL`: Portal de origen (`LinkedIn`, `Remotive`, `Jobicy`, `Arbeitnow`, `Manual`).
* `publishedAt TEXT`: Fecha de publicacion original.
* `createdAt TEXT NOT NULL`: Fecha de ingreso al sistema.

### 4.4. Tabla `JobMatch`
Diagnostico semantico y cualitativo generado por el motor de IA:
* `id TEXT PRIMARY KEY`: Identificador del analisis.
* `jobOfferId TEXT UNIQUE NOT NULL`: Llave foranea hacia `JobOffer.id` (ON DELETE CASCADE).
* `matchScore INTEGER NOT NULL`: Puntaje de afinidad (0 a 100).
* `isMatch INTEGER DEFAULT 1`: Booleano (1 si supero los Kill Switches, 0 si fue descartada).
* `killSwitchTriggered TEXT`: Motivo de descarte si correspondiera.
* `reason TEXT`: Argumentacion cualitativa del veredicto.
* `executiveSummary TEXT NOT NULL`: Resumen ejecutivo del ajuste perfil-vacante.
* `strengths TEXT NOT NULL`: JSON array de fortalezas clave detectadas.
* `missingSkills TEXT NOT NULL`: JSON array de brechas o puntos a defender en la entrevista.
* `interviewAdvice TEXT NOT NULL`: Recomendaciones directas de preparacion tecnica.
* `generatedPitch TEXT`: Carta de contacto personalizada.
* `languageRequirement TEXT`: Exigencia de idioma detectada.
* `analyzedAt TEXT NOT NULL`: Marca temporal del analisis.

### 4.5. Tabla `ApplicationTracker`
Seguimiento confidencial de postulaciones (Mini-CRM):
* `id TEXT PRIMARY KEY`: Identificador del seguimiento.
* `jobOfferId TEXT UNIQUE NOT NULL`: Llave foranea hacia `JobOffer.id` (ON DELETE CASCADE).
* `status TEXT NOT NULL`: Estado actual (`saved`, `applied`, `interviewing`, `offered`, `rejected`).
* `appliedDate TEXT`: Fecha de postulación o ultimo hito de contacto.
* `personalNotes TEXT`: Apuntes privados del candidato.
* `updatedAt TEXT NOT NULL`: Marca temporal de actualizacion.

---

## 5. El Motor ATS Zero-Trust y la Cascada de IA

### 5.1. Protocolo de los 5 Kill Switches Deterministas
Antes de enviar una oferta a modelos de lenguaje o calcular puntajes, el evaluador local ejecuta filtros deterministas:

1. **Kill Switch 1: BARRERA_GEOGRAFICA_LEGAL**
   * Descarta posiciones presenciales e hibridas fuera de la zona de residencia del candidato.
   * Si el candidato posee condicion `Contractor Internacional B2B (Sin Visa)`:
     * Descarta ofertas que exijan autorizacion de seguridad nacional (*Public Trust Clearance*, *Security Clearance*, contratistas de defensa tipo Koniag Federal / KGS).
     * Descarta requisitos migratorios foraneos obligatorios: `Must be US Citizen`, `Green Card Holder`, `W-2 only`, `No C2C / No 1099`, o residencia legal obligatoria en la Union Europea.
   * Si el usuario activa en los filtros avanzados la casilla *"Permitir Clearance / W-2 / EE. UU."*, se desactiva este descarte para candidatos que si cuenten con dichos permisos.
2. **Kill Switch 2: DESVIACION_DISCIPLINA**
   * Descarta cargos operativos, soporte IT helpdesk, moderacion, ventas o desarrollo ajeno a las areas del perfil.
   * Requiere concordancia semantica con `UserProfile.targetRoles` y coincidencia de al menos 2 tecnologias dominadas.
3. **Kill Switch 3: HABILIDAD_EXCLUIDA (Limites Tecnicos del Candidato)**
   * Deteccion estricta por expresiones regulares con limites de palabra (`(^|[^a-zA-Z0-9_#+])`) de cualquier tecnologia vetada en `UserProfile.excludedSkills` (ej. C#, .NET, Java Enterprise, Spring Boot, DevOps pesado).
4. **Kill Switch 4: BARRERA_IDIOMATICA**
   * Descarta puestos que demanden aleman (*fluent german*, *deutschkenntnisse*) o frances (*fluent french*) si el candidato no los domina.
   * Descarta ofertas con exigencia de ingles oral nativo/ejecutivo (*C1/C2 required*) si el perfil esta registrado en nivel intermedio (*B1/B2*).
5. **Kill Switch 5: BRECHA_SENIORITY**
   * Descarta vacantes que exijan 7+ o 10+ anos de experiencia o titulos de alta jerarquia directiva (*Principal*, *Staff*, *Engineering Manager*, *Director*) cuando el perfil es *Junior* o *Mid*.

### 5.2. Cascada de Respaldo en 4 Niveles (`callGeminiApiWithCascade`)
Toda operacion semantica fluye a traves del despachador en `src/lib/gemini.ts`:
* **Nivel 1 (Google Principal):**
  * Modo `smart_saving`: Ejecuta **Gemini 3.8 Flash-Lite** (`gemini-flash-lite-latest`) con presupuesto de pensamiento 0.
  * Modo `maximum_precision`: Ejecuta **Gemini 3.8 Flash** (`gemini-flash-latest`).
* **Nivel 2 (Google Alternativo):**
  * Ante respuesta HTTP 429 (agotamiento temporal de cuota), conmuta de inmediato y de forma transparente al modelo complementario de Google.
* **Nivel 3 (Multi-Cloud Groq Cloud):**
  * Si la cuota de Google esta totalmente agotada o no responde, escala la peticion a **Groq Cloud (Llama 3.3 70B Versatile)** con esquema JSON forzado.
* **Nivel 4 (Motor Heuristico Local):**
  * En ausencia de red o claves API externas, degrada al evaluador heuristico local determinista en TypeScript, asegurando continuidad funcional con 0 tokens.

---

## 6. Deduplicacion Canonica y Calibracion Salarial Progresiva

### 6.1. Deduplicacion Canonica por Fingerprint (`getJobFingerprint`)
Para evitar ofertas repetidas entre portales (ej. una misma vacante republicada en LinkedIn y Remotive con titulos ligeramente distintos):
* Se normalizan titulos y nombres de empresa eliminando sufijos corporativos (`Inc`, `LLC`, `Corp`, `S.A.`, `Technologies`).
* Se genera una huella de normalizacion: `empresa_normalizada|titulo_normalizado`.
* En `/api/sync`, cualquier oferta entrante cuya huella coincida con una existente es descartada de forma inmediata antes de consumir tiempo o tokens.

### 6.2. Logica Salarial Progresiva
* **Fuente Unica de Verdad:** El sueldo deseado se configura exclusivamente en el Estudio de Perfil (`UserProfile.minSalary`).
* **Valor Cero Honrado:** Si el usuario define `$0`, el sistema procesa el valor `0` sin revertir a valores arbitrarios por defecto.
* **Evaluacion Progresiva por Defecto (`meetsProgressiveSalaryExpectation`):**
  1. Si la vacante declara salario explicito: es aprobada si el limite superior es mayor o igual al piso del perfil.
  2. Si la vacante es "A convenir / No declarado": **no se descarta por defecto**, preservando oportunidades viables para negociacion.

---

## 7. Modulos de Experiencia de Usuario y Pipeline CRM

### 7.1. Estacion Central de Comando y Match Radar (`MatchRadarPreview.tsx`)
* **Barra Unificada de Busqueda y Extraccion en Vivo:**
  * Campo de busqueda en tiempo real sobre las vacantes en memoria y base de datos local.
  * Boton integrado **"Buscar en Vivo"**: transfiere el termino de busqueda al modal de sincronizacion externa para extraer ofertas frescas desde LinkedIn, Remotive, Jobicy o Arbeitnow.
  * Boton de rebarajado ("Dices") para explorar 10 ofertas distintas del inventario local.
* **Panel Desplegable de Filtros Avanzados (5 Columnas):**
  1. *Umbral de Afinidad ATS:* Control deslizante continuo (0% a 95%).
  2. *Modalidad de Trabajo:* Botones para Todas, Solo Remoto, Hibrido y Presencial.
  3. *Filtro de Idioma:* Todos, Compatible B1/B2 (sin C1/C2 oral) y Solo Espanol.
  4. *Criterio Salarial:* Alternancia entre "Progresivo (>= piso o a convenir)" y "Solo Salario Publico Declarado".
  5. *Permisos & Visado EE. UU.:* Conmutador entre "Solo Contractor B2B (Sin Visa)" y "Permitir Clearance / W-2 / EE. UU.".
  6. *Portales de Origen:* Filtro por portal de empleo.
  7. *Boton de Restablecer:* Retorna a los parametros optimos calibrados del perfil.

### 7.2. Mini-CRM Glass Pipeline (`GlassPipelinePreview.tsx`)
* **Tablero Kanban Bidireccional de 5 Estados:**
  * `saved` ("Radar / Guardadas")
  * `applied` ("Postuladas")
  * `interviewing` ("En Entrevistas")
  * `offered` ("Ofertas Recibidas")
  * `rejected` ("Archivadas / Rechazadas")
* **Conmutador de Visibilidad de Archivadas:**
  * Boton *"Ver Archivadas (N)"* / *"Ocultar Archivadas"* para mantener la interfaz despejada con 4 columnas o expandida a 5 columnas segun preferencia.
* **Controles Bidireccionales en Cada Tarjeta:**
  * Botones de transicion rapida `<` y `>` para avanzar o retroceder de columna sin abrir modales.
  * Selector desplegable directo (`<select>`) para saltar a cualquier etapa en un solo clic.
  * Boton rapido de archivado y restauracion al radar.
* **Metricas de Conversion en Tiempo Real:**
  * Conteo por columna y totales en embudo.
  * Calculo automatico de **Tasa de Respuesta** (`(Entrevistas + Ofertas) / Total Postuladas`) y **Tasa de Oferta** (`Ofertas / Entrevistas`).
  * Selector de importacion rapida de vacantes no rastreadas del radar al embudo.
* **Acciones Contextuales de Preparacion:**
  * Acceso directo a **"Simular Entrevista"** (abre el simulador con 3 preguntas de Hiring Manager generadas por Gemini y respuestas modelo).
  * Acceso directo a **"Pitch Reclutador"** (abre el mensaje de presentacion con selector de tono Directo, Ejecutivo o Impacto).
  * Acceso a **"+ Nota"** / **"Ver Nota"**.

### 7.3. Modal de Notas Estructuradas ([`JobNotesModal.tsx`](file:///c:/Users/ronsf/Documents/Yegoo/glassmatch-ai/src/components/modules/JobNotesModal.tsx))
* Pastillas de etiquetas de progreso para insercion en 1 clic con estampa de fecha automatica:
  * *"Primera ronda tecnica completada"*
  * *"Prueba tecnica enviada"*
  * *"Esperando feedback de RRHH"*
  * *"Segunda entrevista con Hiring Manager"*
  * *"Oferta economica recibida a evaluar"*
  * *"Rechazo amable / Guardado para futuro"*
* Sincronizado con la tabla `ApplicationTracker` de SQLite.

---

## 8. Estado del Proyecto y Fases Faltantes (Roadmap de Evolucion)

### 8.1. Fases Completadas (1 a 5)
* **Fase 1: Arquitectura Base y Diseno Glass UI:** Next.js 16 Turbopack, Tailwind v4, Framer Motion, sistema de componentes de cristal caribeno.
* **Fase 2: Ingestion de CV y Perfil del Candidato:** Multimodal OCR con Gemini Base64, fallback en Python UTF-8, heuristica de seniority, deteccion de limites tecnicos con negaciones (`no domino` -> `excludedSkills`) y persistencia relacional SQLite.
* **Fase 3: Motor ATS Zero-Trust y Estacion Unificada:** Deduplicacion canonica por huella, barra unificada de busqueda y extraccion en vivo, panel de 5 columnas de filtros avanzados y evaluacion salarial progresiva respetando `$0`.
* **Fase 4: Redundancia Multi-Cloud y Blindaje Legal:** Cascada en 4 niveles (Gemini Flash/Lite -> Google alternativo -> Groq Cloud Llama 3.3 70B -> Motor Local 0 tokens), interruptor de motor en cabecera y blindaje dinamico de autorizaciones de seguridad nacional y permisos W-2.
* **Fase 5: Mini-CRM Glass Pipeline y Preparacion:** Tablero Kanban bidireccional de 5 estados, metricas de embudo y conversion en tiempo real, preparacion contextual en tarjetas y notas estructuradas con etiquetas rapidas.

### 8.2. Fases Faltantes Planificadas (Post-Core)

#### Fase 6: Automatizacion Desatendida y Alertas en Segundo Plano (Daemon / Workers)
* **Objetivo:** Convertir GlassMatch AI en un centinela autonomo que rastree vacantes sin requerir que el usuario abra la aplicacion.
* **Alcance Tecnico:**
  1. Tarea programada en segundo plano (*Background Cron Worker*) configurable por el usuario (ej. ejecucion cada 6, 12 o 24 horas).
  2. Deteccion proactiva de "Vacantes Elite" (Afinidad semantica >= 85%).
  3. Sistema de alertas discretas locales en Windows (notificaciones nativas del sistema operativo) o webhook privado (bot de Telegram / Discord propio del usuario) con enlace directo a la oferta.
  4. Prevencion de sobre-extraccion mediante limites de peticiones y rotacion de intervalos.

#### Fase 7: Soberania de Datos, Respaldo y Analitica Historica
* **Objetivo:** Ofrecer control y portabilidad total de los datos del candidato y analisis estadistico de su proceso de busqueda.
* **Alcance Tecnico:**
  1. Exportador universal de datos a formatos abiertos: CSV, JSON y reporte consolidado de postulaciones en PDF.
  2. Backup y Restauracion en 1 clic de la base de datos SQLite (`prisma/dev.db`), facilitando migracion entre maquinas.
  3. Panel de Analitica Historica:
     * Tiempo promedio de respuesta por empresa o tipo de tecnologia.
     * Grafico de dispersion de salarios ofrecidos vs habilidades demandadas.
     * Registro de motivos de descarte y empresas bloqueadas.

#### Fase 8: Sastrería de CV por Oferta (Resume Tailoring para ATS Externos)
* **Objetivo:** Asistir al candidato en la adaptacion etica de su CV para superar los filtros ATS propios de cada empresa.
* **Alcance Tecnico:**
  1. Analizador diferencial de brechas lexicas entre el CV actual y la descripcion de la vacante aprobada.
  2. Generador de versiones optimizadas del CV en formato Markdown / PDF limpio, reordenando logros y enfatizando competencias reales requeridas por la oferta sin inventar experiencia.
  3. Vista comparativa interactiva (*Diff Viewer*) para que el usuario audite y apruebe cada sugerencia antes de exportar el documento.

---

## 9. Checklist de Auditoria Externa y Seguridad

| Area de Auditoria | Estatus | Mecanismo de Control |
| :--- | :--- | :--- |
| **Privacidad de Datos** | Aprobado | Almacenamiento 100% local en SQLite. Sin telemetria externa, sin base de datos cloud de terceros. |
| **Seguridad de Credenciales** | Aprobado | Claves de API (`GEMINI_API_KEY`, `GROQ_API_KEY`) almacenadas en `.env.local` excluido de Git o cifradas en tabla `AppConfig`. |
| **Resiliencia ante Caidas de Red** | Aprobado | Cascada en 4 niveles con degradacion transparente al motor heuristico determinista local (0 tokens). |
| **Concurrencia de Base de Datos** | Aprobado | SQLite con `journal_mode = WAL`, `busy_timeout = 5000` y transacciones explicitas para evitar bloqueos de archivo. |
| **Consistencia de Tipos** | Aprobado | TypeScript en modo estricto en el 100% del codigo fuente, verificado mediante compilador Turbopack. |
| **Integridad de Salida de IA** | Aprobado | Forzado de esquemas JSON estructurados (`response_format: { type: "json_object" }` y `response_mime_type: "application/json"`). |
| **Cumplimiento de Estilo** | Aprobado | Cero emojis en codigo, mensajes de commit, logs y documentacion formal de arquitectura. |

---
*Fin del documento maestro de contexto y auditoria de GlassMatch AI.*

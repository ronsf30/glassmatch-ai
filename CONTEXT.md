# CONTEXT.md — Documento Maestro de Contexto y Auditoria Tecnica
## Proyecto: GlassMatch AI (Caribbean Sea Glass Edition)
**Version:** 0.5.0 (Fase 7 Soberania de Datos, Respaldo y Analitica Historica)  
**Fecha de corte:** 10 de Septiembre de 2026  
**Repositorio Oficial:** https://github.com/ronsf30/glassmatch-ai (Rama: main)  
**Proposito del documento:** Proporcionar una radiografia tecnica exhaustiva, rigurosa y sin ambiguedades de toda la arquitectura, modelos de datos, endpoints, logica algoritmica y estado de desarrollo de la aplicacion para revision, auditoria de seguridad, analisis de codigo y evaluacion por personal de ingenieria y agentes de IA externos.

---

## 1. Resumen Ejecutivo y Mision del Sistema

GlassMatch AI es una plataforma local y privada disenada para ingenieros de software, disenadores de producto y profesionales tecnicos que buscan empleo remoto e internacional. Su proposito fundamental es erradicar el 100% de los falsos positivos y postulaciones inviables generadas por los motores de recomendacion tradicionales.

El sistema se rige por los siguientes principios no negociables:
1. **Confianza Cero ATS (Zero-Trust ATS Engine):** Toda oferta laboral entrante se presume incompatible (0% Match) por defecto. Solo tras superar una bateria de 5 Kill Switches deterministas y semanticos se autoriza el calculo de afinidad y se persiste en el inventario.
2. **Cascada de Inteligencia Artificial en 4 Niveles:** Garantiza operatividad ininterrumpida combinando modelos de ultima generacion con aislamiento multi-nube y fallback determinista local con cero consumo de tokens.
3. **Centinela Autonomo y Vigilancia en Segundo Plano (Fase 6):** Operacion desatendida mediante temporizadores en la aplicacion y un demonio independiente en Node.js que escanea portales y despacha alertas instantaneas a Webhooks de Discord, Telegram o Slack ante vacantes de alta afinidad (>= 85%).
4. **Privacidad Absoluta (Local-First):** La base de datos relacional reside exclusivamente en el equipo del usuario mediante SQLite nativo con transaccionalidad WAL, sin telemetria ni dependencias de bases de datos centralizadas en la nube.
5. **Diseno de Autor Caribbean Sea Glass:** Interfaz grafica de alto contraste inspirada en iOS Glass Design y visionOS, orientada a reducir la fatiga cognitiva durante la busqueda laboral.
6. **Filosofia "Standing on Giants":** Aprovecha herramientas de codigo abierto consolidadas (JobSpy, Next.js 16, SQLite, Tailwind v4) orquestadas mediante logica semantica avanzada.

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
- **Sistema de Alertas y Webhooks:** Modulo nativo `src/lib/notifications.ts` con formateo automatico para Discord Embeds, Telegram Markdown y Slack.
- **Scrapers Auxiliares:** Python 3 con librerias `jobspy` y `pypdf`, con forzado de encoding UTF-8 para compatibilidad absoluta en Windows.
- **Entorno de Red:** Resolucion local forzada IPv4 (`127.0.0.1:3000`).

---

## 3. Arquitectura del Arbol de Archivos

```
glassmatch-ai/
├── .env.local                     # Variables locales de entorno (GEMINI_API_KEY, GROQ_API_KEY) [GitIgnore]
├── .env.local.example             # Plantilla segura de variables de entorno
├── .gitignore                     # Exclusion de .env, *.db, *.db-wal, *.db-shm y __pycache__
├── Iniciar-GlassMatch.bat         # Script de inicio rapido de la aplicacion en Windows
├── Iniciar-Centinela.bat          # Script de ejecucion del Centinela Daemon en segundo plano
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
│   ├── requirements.txt           # Dependencias Python
│   └── worker.mjs                 # Script autonomo Node.js del Centinela (ejecucion desatendida 24/7)
└── src/
    ├── app/
    │   ├── globals.css            # Clases de utilidad y diseno Caribbean Sea Glass
    │   ├── layout.tsx             # Shell HTML raiz con fuentes tipograficas
    │   ├── page.tsx               # Controlador principal de vistas (Tabs: Radar, Pipeline, Studio, Analytics)
    │   └── api/
    │       ├── backup/route.ts           # GET descargar snapshot SQLite dev.db, POST restaurar con verificacion
    │       ├── config/
    │       │   ├── gemini/route.ts       # GET/POST diagnostico y conmutacion de estrategia Gemini
    │       │   └── backup-ai/route.ts    # GET/POST diagnostico y clave de Groq Cloud
    │       ├── cv/parse/route.ts         # POST parseo multimodal de CV (Gemini Base64 / Python)
    │       ├── export/
    │       │   ├── csv/route.ts          # GET exportacion tabular en CSV con BOM UTF-8 para Excel
    │       │   └── json/route.ts         # GET exportacion integral estructurada en JSON
    │       ├── interview/route.ts        # POST simulador de preguntas de entrevista tecnica
    │       ├── jobs/
    │       │   ├── route.ts              # GET listar vacantes aprobadas, POST crear, DELETE purgar
    │       │   └── [id]/status/route.ts  # PATCH actualizar estado en el pipeline y notas
    │       ├── match/route.ts            # POST evaluacion aislada candidato vs vacante
    │       ├── pitch/route.ts            # POST generador de pitches de contacto por tono
    │       ├── profile/route.ts          # GET/PUT perfil persistido en SQLite
    │       ├── sync/route.ts             # POST sincronizacion y descarte Kill Switch (exporta executeSync)
    │       └── worker/
    │           ├── config/route.ts       # GET/POST configuracion del Centinela en SQLite y prueba de webhook
    │           └── run/route.ts          # POST ejecucion autonoma, deteccion elite y despacho de alertas
    ├── components/
    │   ├── layout/
    │   │   ├── AmbientGlow.tsx           # Efectos ambientales difusos
    │   │   └── GlassHeader.tsx           # Barra de navegacion flotante con 4 pestanas y selector de motor
    │   ├── modules/
    │   │   ├── MatchRadarPreview.tsx     # Estacion de busqueda, filtros avanzados y feed de vacantes
    │   │   ├── GlassPipelinePreview.tsx  # Kanban bidireccional de 5 estados con metricas de embudo
    │   │   ├── ProfileStudioPreview.tsx  # Estudio de CV, limites tecnicos, configuracion de IA y Centinela
    │   │   ├── AnalyticsStudioPreview.tsx# Soberania de datos, inteligencia salarial, auditoria y backups
    │   │   ├── ExecutiveReportModal.tsx  # Reporte ejecutivo imprimible y exportable a PDF (@media print)
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
    │   └── AppContext.tsx                # Estado global, sincronizacion reactiva y runner in-app del Centinela
    ├── lib/
    │   ├── ai-providers.ts               # Integracion de cliente Groq Cloud y OpenAI compatible
    │   ├── db.ts                         # Conexion e inicializacion nativa de SQLite
    │   ├── gemini.ts                     # Cascada de IA en 4 niveles y bateria de 5 Kill Switches
    │   ├── notifications.ts              # Despachador universal de Webhooks (Discord, Telegram, Slack)
    │   └── utils.ts                      # Deduplicacion canonica, parseo salarial progresivo y utilidades
    └── types/
        └── index.ts                      # Definiciones exhaustivas de tipos TypeScript
```

---

## 4. Esquema Relacional de Base de Datos (SQLite Local)

La persistencia se gestiona de forma local e independiente en `prisma/dev.db` bajo 5 tablas relacionales:

### 4.1. Tabla `AppConfig`
Gestiona la configuracion dinamica en caliente sin necesidad de reiniciar el servidor:
* `key TEXT PRIMARY KEY`: Clave de configuracion (`gemini_api_key`, `gemini_strategy`, `backup_ai_key`, `backup_ai_provider`, `backup_ai_model`, `ai_engine_mode`, `worker_enabled`, `worker_interval_hours`, `worker_threshold`, `worker_webhook_url`, `worker_last_run`, `worker_last_status`).
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

## 6. Centinela Autonomo y Alertas en Segundo Plano (Fase 6)

### 6.1. Arquitectura Dual de Ejecucion
El Centinela opera bajo dos modalidades complementarias:
1. **Ejecucion In-App (`AppContext.tsx`):**
   * Mientras la aplicacion esta abierta en el navegador, un temporizador reactivo consulta la configuracion en SQLite cada 10 minutos. Si ha transcurrido el intervalo programado (ej. 6 horas desde la ultima ejecucion), dispara de forma transparente el escaneo en `/api/worker/run`.
   * Si detecta vacantes con afinidad >= umbral, lanza una notificacion nativa de escritorio del sistema operativo (*Web Notification API*).
2. **Demonio Autonomo Headless (`scripts/worker.mjs` y `Iniciar-Centinela.bat`):**
   * Proceso Node.js independiente que puede dejarse en ejecucion continua en la consola o programarse mediante el Programador de Tareas de Windows.
   * Realiza peticiones no bloqueantes a `/api/worker/run`, registra logs con marca temporal y respeta los intervalos de espera sin consumir recursos de navegador.

### 6.2. Despachador Universal de Webhooks (`src/lib/notifications.ts`)
* **Deteccion Automatica de Plataforma:**
  * **Discord:** Detecta URLs `discord.com/api/webhooks` y emite payloads enriquecidos con tarjetas visuales (*Embeds*), color esmeralda (#10B981) para ofertas elite, detalles salariales, fortalezas detectadas y enlace directo.
  * **Telegram:** Detecta URLs `api.telegram.org/bot` y envia mensajes formateados en Markdown directo al chat o canal del usuario.
  * **Slack / Generico:** Envia mensajes estructurados en texto plano JSON.
* **Boton de Prueba en Interfaz:** Permite validar la recepcion del mensaje de prueba en el canal antes de activar el centinela.

---

## 7. Modulos de Experiencia de Usuario y Pipeline CRM

### 7.1. Estacion Central de Comando y Match Radar (`MatchRadarPreview.tsx`)
* Barra unificada de busqueda y extraccion en vivo.
* Panel desplegable de 5 columnas de filtros avanzados (afinidad, modalidad, idioma, criterio salarial progresivo respetando `$0`, permisos y visado EE. UU.).
* Visualizador circular MatchRing escalable.

### 7.2. Mini-CRM Glass Pipeline (`GlassPipelinePreview.tsx`)
* Tablero Kanban bidireccional de 5 estados (`saved`, `applied`, `interviewing`, `offered`, `rejected`).
* Conmutador para mostrar u ocultar la columna de archivadas.
* Controles rapidos `<` y `>` mas selector desplegable de salto directo en tarjetas.
* Metricas de conversion en tiempo real (Tasa de Respuesta y Tasa de Oferta).
* Acciones contextuales de preparacion ("Simular Entrevista" y "Pitch Reclutador").

### 7.3. Modal de Notas Estructuradas (`JobNotesModal.tsx`)
* Etiquetas de progreso en 1 clic con insercion de fecha automatica en SQLite.

### 7.4. Panel del Centinela en Profile Studio (`ProfileStudioPreview.tsx`)
* Tarjeta dedicada para configurar estado (Activo/Inactivo), intervalo (3h, 6h, 12h, 24h), umbral de alerta (75% a 90%), URL de Webhook, prueba de conexion, ejecucion inmediata y monitor de estado.

### 7.5. Modulo de Soberania y Analitica Historica (`AnalyticsStudioPreview.tsx` y Modales)
* **Inteligencia Salarial de Mercado:** Calculo reactivo de mediana salarial, promedio, porcentaje de ofertas por encima del piso configurado por el candidato (`UserProfile.minSalary`) y distribucion por bandas (<$60k, $60k-$90k, $90k-$120k, $120k-$150k, >$150k).
* **Metricas de Embudo y Conversion Historica:** Tasa de respuesta (% de aplicadas que avanzan a entrevistas u ofertas) y tasa de cierre de oferta (% de entrevistas convertidas en ofertas finales).
* **Auditoria de Descarte y Barreras ATS:** Desglose categorizado de descartes por Kill Switch (Geografia/Visa, Disciplina, Exclusiones tecnicas, Idioma, Seniority).
* **Gestion de Lista Negra de Empresas:** Listado en tiempo real de empresas con vacantes en estado descartado (`rejected`) con accion de 1 clic para desbloquear y permitir nuevas postulaciones.
* **Exportador Universal de Datos:**
  * Endpoint `/api/export/csv`: Genera archivo tabular con Byte Order Mark UTF-8 (`\uFEFF`) para renderizado impecable en Microsoft Excel sobre Windows.
  * Endpoint `/api/export/json`: Descarga estructura consolidada con perfil, vacantes, evaluaciones cualitativas, configuracion y metricas.
* **Reporte Ejecutivo Imprimible (`ExecutiveReportModal.tsx`):** Modal de alta fidelidad con resumen KPI, desglose tabular de postulaciones activas y estilos dedicados `@media print` para generacion instantanea de PDF mediante el dialogo de impresion del navegador.
* **Respaldo y Restauracion de Base de Datos (`/api/backup`):**
  * Descarga directa en caliente del snapshot binario `prisma/dev.db`.
  * Restauracion mediante carga de archivo `.db` con validacion de cabecera binaria (*magic bytes* `SQLite format 3\0`), copia de seguridad preventiva (`dev.db.bak`) y verificacion de integridad relacional (`PRAGMA integrity_check`).

---

## 8. Estado del Proyecto y Fases Faltantes (Roadmap de Evolucion)

### 8.1. Fases Completadas (1 a 7)
* **Fase 1: Arquitectura Base y Diseno Glass UI:** Next.js 16 Turbopack, Tailwind v4, Framer Motion, diseno Caribbean Sea Glass.
* **Fase 2: Ingestion de CV y Perfil del Candidato:** Multimodal OCR con Gemini Base64, fallback en Python UTF-8, heuristica de seniority, deteccion de limites tecnicos con negaciones (`no domino` -> `excludedSkills`) y persistencia relacional SQLite.
* **Fase 3: Motor ATS Zero-Trust y Estacion Unificada:** Deduplicacion canonica por huella, barra unificada de busqueda y extraccion en vivo, panel de 5 columnas de filtros avanzados y evaluacion salarial progresiva respetando `$0`.
* **Fase 4: Redundancia Multi-Cloud y Blindaje Legal:** Cascada en 4 niveles (Gemini Flash/Lite -> Google alternativo -> Groq Cloud Llama 3.3 70B -> Motor Local 0 tokens), interruptor de motor en cabecera y blindaje dinamico de autorizaciones de seguridad nacional y permisos W-2.
* **Fase 5: Mini-CRM Glass Pipeline y Preparacion:** Tablero Kanban bidireccional de 5 estados, metricas de embudo y conversion en tiempo real, preparacion contextual en tarjetas y notas estructuradas con etiquetas rapidas.
* **Fase 6: Automatizacion Desatendida y Alertas por Webhook:** Demonio autonomo en segundo plano (`scripts/worker.mjs`, `Iniciar-Centinela.bat`), temporizador in-app, despachador universal de Webhooks (Discord, Telegram, Slack) con prueba de conexion y panel de administracion en Estudio de Perfil.
* **Fase 7: Soberania de Datos, Respaldo y Analitica Historica:** Exportador universal a CSV (con UTF-8 BOM para Excel) y JSON integral, reporte ejecutivo imprimible/PDF (@media print), respaldo binario y restauracion SQLite con validacion de cabecera y comprobacion de integridad, e inteligencia salarial de mercado vs piso personal, embudo de conversion y auditoria de descartes Kill Switch.

### 8.2. Fases Faltantes Planificadas (Post-Core)

#### Fase 8: Sastreria de CV por Oferta (Resume Tailoring para ATS Externos)
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
| **Automatizacion y Webhooks** | Aprobado | Despacho seguro con timeout de 6 segundos y aislamiento de errores para evitar caidas del servidor. |
| **Cumplimiento de Estilo** | Aprobado | Cero emojis en codigo, mensajes de commit, logs y documentacion formal de arquitectura. |

---
*Fin del documento maestro de contexto y auditoria de GlassMatch AI.*

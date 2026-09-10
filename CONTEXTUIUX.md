# CONTEXTUIUX.md — Auditoria Integral de Interfaz y Experiencia de Usuario (UI/UX)
## Proyecto: GlassMatch AI (Caribbean Sea Glass Edition)
**Modulo Auditado:** Modal de Analisis Manual de Vacantes ("+ Nueva Vacante" / `QuickAddModal.tsx`) y Tour Guiado (`TutorialModal.tsx`)  
**Fecha de evaluacion:** Septiembre 2026  
**Destinatarios:** Auditores de producto, disenadores de interfaces, desarrolladores frontend y agentes de IA externos.

---

## 1. Proposito y Funcion de la Ventana "Analizar Vacante con Gemini AI"

La ventana modal emergente accesible mediante el boton **"+ Nueva Vacante"** en la barra de navegacion (`GlassHeader.tsx`) cumple la funcion de **Analizador Asincrono Unico**. 

Su objetivo operativo es permitir al usuario evaluar al instante cualquier oferta laboral encontrada fuera del sistema (por ejemplo, en LinkedIn, portales corporativos, hilos de Twitter/X, mensajes directos de reclutadores, WhatsApp o correos electronicos) sin tener que esperar o ejecutar una sincronizacion masiva de todo el mercado.

### Flujo de Trabajo (Workflow):
1. **Captura:** El candidato localiza una vacante externa y copia el texto descriptivo o la URL.
2. **Entrada de Datos:** Abre el modal e ingresa el titulo del puesto, la empresa empleadora y pega el cuerpo de la descripcion.
3. **Pre-Filtrado y Sanitizacion:** El sistema sanitiza el HTML y ejecuta los 5 Kill Switches deterministas en 0 ms.
4. **Analisis Semantico:** Si la oferta supera los Kill Switches, se invoca a Gemini 2.0 Flash para obtener:
   - Match Score ponderado (0 a 100).
   - Resumen ejecutivo del encaje.
   - Puntos fuertes y brechas detectadas.
   - Consejos personalizados para la entrevista tecnica.
   - Pitch de contacto sugerido en primer contacto.
5. **Inyeccion Inmediata:** La vacante se inserta directamente en la base de datos local SQLite (`JobOffer` + `JobMatch` + `ApplicationTracker`) y se muestra en la primera posicion del Match Radar sin recargar la aplicacion.

---

## 2. Radiografia y Auditoria UI/UX Componente por Componente (`QuickAddModal.tsx`)

A continuacion se desglosa la anatomia visual, el comportamiento y el diagnostico ergonomico de cada elemento presente en la interfaz de la ventana:

### 2.1. Fondo y Contenedor Translúcido (Backdrop & Container)
- **Implementacion:**
  - Telon de fondo: `bg-slate-900/30 backdrop-blur-xs` animado con Framer Motion.
  - Tarjeta modal: `GlassCard` con `bg-white/95 backdrop-blur-3xl`, borde sutil `border-teal-500/25` y sombra profunda difusa `shadow-[0_20px_60px_rgba(13,148,136,0.2)]`.
- **Evaluacion UI/UX:**
  - **Acierto:** El contraste del fondo desenfocado centra la atencion del usuario en el formulario y respeta el lenguaje visual "Caribbean Sea Glass".
  - **Oportunidad de Mejora:** El desenfoque del backdrop (`backdrop-blur-xs`) es muy tenue; elevarlo a `backdrop-blur-sm` o `md` aumenta el aislamiento visual y reduce distracciones con las tarjetas del fondo.

### 2.2. Cabecera del Modal (Header)
- **Implementacion:**
  - Icono `Sparkles` turquesa encapsulado en caja de cristal con borde perimetral.
  - Titulo: "Analizar Vacante con Gemini AI" (16px, `font-bold`, color pizarra profunda `text-slate-900`).
  - Subtitulo: "Diagnóstico semántico instantáneo y pitch personalizado" (12px, `text-slate-500`).
  - Boton de cierre `X`: Esquina superior derecha con hover suave y feedback tactil.
- **Evaluacion UI/UX:**
  - **Acierto:** Comunica de inmediato el valor de la ventana y el motor de IA responsable.
  - **Accesibilidad:** Cumple ratios de contraste WCAG AA.

### 2.3. Selector de Modalidad de Entrada (Tab Switcher)
- **Implementacion:**
  - Pestaña 1: "Pegar Descripción / Texto" (Icono `FileText`).
  - Pestaña 2: "Pegar Enlace (URL)" (Icono `Link`).
  - Contenedor con fondo gris tenue `bg-slate-100/80` y pastilla activa blanca con sombra y borde turquesa.
- **Evaluacion UI/UX y Hallazgo Funcional Critico:**
  - **Acierto Ergonomico:** La alternativa de pestañas segmentadas es familiar y eficiente.
  - **Punto Critico Detectado (Gap de Producto):** En la pestaña "Pegar Enlace (URL)", el codigo actual genera una descripcion simulada basada en la URL pero no realiza scraping web dinamico del enlace introducido por el usuario. Si el usuario solo pega un link externo sin que haya un scraper activo para ese dominio arbitrario, el analisis resultante carecera de los requisitos reales de la oferta.
  - **Recomendacion UX:** Se debe priorizar y recomendar por defecto la pestaña "Pegar Descripción / Texto" agregando un micro-copy indicativo: *"Recomendado: Pega el texto completo para un diagnostico 100% preciso con tu perfil"*.

### 2.4. Campos "Puesto / Título" y "Empresa"
- **Implementacion:**
  - Grid de dos columnas horizontales con labels de 12px `font-semibold text-slate-700`.
  - Placeholders contextuales: `ej. Staff Frontend Eng.` y `ej. Supabase / OpenAI`.
  - Altura de 36px (`h-9`), bordes redondeados `rounded-xl` y foco turquesa `focus:border-teal-500`.
- **Evaluacion UI/UX:**
  - **Acierto:** Ahorran espacio vertical al estar dispuestos en dos columnas paralelas.
  - **Oportunidad de Mejora:** Anadir la etiqueta `(Opcional)` junto al label, ya que si el usuario no los llena, el analizador deduce titulos genericos.

### 2.5. Area de Texto ("Descripción de la Vacante")
- **Implementacion:**
  - `textarea` de 5 filas fijas con `resize-none`.
  - Placeholder orientador: *"Pega aquí los requisitos, responsabilidades y descripción de la oferta laboral..."*.
- **Evaluacion UI/UX:**
  - **Acierto:** Altura suficiente para mostrar los primeros parrafos pegados sin desbordar la pantalla en portatiles de 13 pulgadas.
  - **Oportunidad de Mejora:** Anadir un contador dinamico de caracteres o palabras pegadas (ej. *"1,250 caracteres detectados"*) para dar retroalimentacion instantanea de que el texto no esta vacio o truncado.

### 2.6. Estado de Carga y Animacion de Espera (Processing State)
- **Implementacion:**
  - Reemplazo dinamico del formulario por un contenedor de espera animado.
  - Doble anillo pulsante turquesa (`animate-spin` y `animate-ping`).
  - Mensaje dinámico en dos etapas: *"Conectando con Gemini Flash AI..."* y *"Evaluando brechas y fortalezas con tu perfil..."*.
- **Evaluacion UI/UX:**
  - **Acierto:** Excelente reduccion de la carga cognitiva y de la percepcion de espera mediante animaciones fluidas que informan el progreso real.

### 2.7. Pie de Formulario y Boton de Accion Principal (Footer & CTA)
- **Implementacion:**
  - Indicador lateral: *"Salida estructurada en esquema JSON"* en color verde azulado `text-teal-800`.
  - Boton "Cancelar" estilo fantasma (`variant="ghost"`).
  - Boton "Ejecutar Match AI" turquesa brillante con icono `Sparkles`.
- **Evaluacion UI/UX:**
  - **Acierto:** Clara jerarquia visual entre la accion primaria y secundaria.
  - **Hallazgo Critico:** El texto *"Salida estructurada en esquema JSON"* es un detalle tecnico interno irrelevante para el candidato. 
  - **Recomendacion UX:** Sustituir ese texto por un mensaje centrado en el beneficio del usuario: *"Evaluacion Zero-Trust bajo tus limites tecnicos"*.

---

## 3. Auditoria de Consistencia Funcional del Analizador Manual

Durante la auditoria del codigo de `QuickAddModal.tsx`, se detectaron 2 inconsistencias funcionales que deben atenderse:

| Elemento | Comportamiento Actual | Riesgo Detectado | Solucion Recomendada |
| :--- | :--- | :--- | :--- |
| **Salario por Defecto** | Asigna `$100,000 - $130,000 USD` de forma cableada en codigo | Si la vacante pegada no tenia salario o era para un rol Junior de $25,000 USD, genera datos salariales falsos en el CRM. | Asignar `null` o `"A convenir / No especificado"` si el texto no incluye rango salarial explicito. |
| **Manejo de Descarte (Kill Switch)** | Si la vacante recibe 0% o es incompatible, el codigo asignaba un score de respaldo de 85% y la guardaba igual | Viola el principio Zero-Trust del sistema, permitiendo que vacantes descartadas por Kill Switch entren al radar. | Si `isMatch === false` o `matchScore === 0`, no guardar la oferta y mostrar un toast o modal de descarte: *"Vacante rechazada por ATS: [Motivo]"*. |

---

## 4. Auditoria del Modulo de Tutorial (`TutorialModal.tsx`)

Se realizo una auditoria exhaustiva de los 5 pasos actuales del tutorial interactivo para determinar su vigencia frente a la version real de la aplicacion:

### 4.1. Diagnostico de Desalineacion en el Tutorial Actual

1. **Omision Total del Analizador Manual:**
   - El tour interactivo explica el Match Radar, el Sincronizador de Empleo, el Pipeline, el Perfil y el Simulador de Entrevistas.
   - **Problema:** En ningun paso se le explica al usuario la existencia de la ventana **"+ Nueva Vacante"**. El usuario novato desconoce que puede pegar cualquier oferta externa de LinkedIn o un correo y evaluarla en 2 segundos.

2. **Desalineacion en los Portales del Sincronizador (Paso 2):**
   - El tutorial afirma textualmente: *"Portales integrados: LinkedIn • Indeed • Glassdoor • ZipRecruiter"*.
   - **Realidad:** El colector en produccion en `/api/sync/route.ts` opera de forma real con: **LinkedIn Guest API, Remotive, Jobicy y Arbeitnow**. Indicar portales que requieren API keys corporativas de pago o scrapers pesados desorienta al usuario.

3. **Desalineacion en las Columnas del Glass Pipeline (Paso 3):**
   - El tutorial afirma: *"organizar tus procesos en cuatro fases: Guardadas, Postuladas, Entrevistas, Ofertas"*.
   - **Realidad:** El CRM implementado cuenta con **6 columnas transaccionales**: `Descubiertas`, `Guardadas`, `Postuladas`, `En Entrevista`, `Oferta Recibida` y `Descartadas`.

---

## 5. Propuesta de Actualizacion para `TutorialModal.tsx`

Para que el tutorial sea 100% didactico y fiel a la aplicacion, se recomienda actualizar la estructura de 5 a 6 pasos:

### Paso 1: Introduccion a GlassMatch AI
- Explicar la filosofia de eliminacion de ruido laboral y motor ATS Zero-Trust con almacenamiento privado en SQLite.

### Paso 2: El Match Radar y los 5 Kill Switches
- Explicar el anillo de compatibilidad (MatchRing) y como el sistema descarta automaticamente el 100% de ofertas incompatibles por idioma, residencia o limites tecnicos.

### Paso 3: Analisis Manual de Ofertas Externas (NUEVO PASO)
- **Titulo:** Analisis Instantaneo ("+ Nueva Vacante")
- **Descripcion:** Explicar como pegar cualquier oferta encontrada en internet o redes para recibir en 2 segundos el diagnostico semantico de Gemini, los puntos fuertes y la carta de presentacion personalizada.

### Paso 4: Sincronizacion Multi-Canal en Vivo
- Corregir los proveedores a: LinkedIn, Remotive, Jobicy y Arbeitnow con regulacion anti-baneo mediante jitter de 1.2 a 2.5 segundos.

### Paso 5: CRM Glass Pipeline de 6 Fases
- Actualizar el diagrama visual para mostrar las 6 etapas reales: Descubiertas, Guardadas, Postuladas, En Entrevista, Ofertas y Descartadas, junto al bloc de notas confidencial.

### Paso 6: Profile Studio y Simulador de Entrevistas
- Carga multimodal de CV (PDF), seleccion interactiva de limites tecnicos excluidos y simulador de llamadas tecnicas con preguntas punzantes.

---

## 6. Matriz de Recomendaciones UI/UX para Revision Externa

| Prioridad | Area | Accion Concreta | Impacto |
| :--- | :--- | :--- | :--- |
| **Alta** | `QuickAddModal.tsx` | Enlazar el resultado del analisis para no guardar vacantes con score 0% y alertar el motivo del descarte. | Integridad del principio Zero-Trust. |
| **Alta** | `TutorialModal.tsx` | Incorporar el paso de "+ Nueva Vacante" y corregir el numero de columnas del Pipeline (de 4 a 6). | Onboarding claro y veraz para nuevos usuarios. |
| **Media** | `QuickAddModal.tsx` | Eliminar el salario cableado de $100k-$130k USD cuando se analiza texto manual sin datos salariales. | Previene datos falsos en el CRM. |
| **Media** | `QuickAddModal.tsx` | Reemplazar el micro-copy *"Salida estructurada en esquema JSON"* por *"Evaluado bajo tus reglas ATS activas"*. | Centrado en el usuario, no en detalles tecnicos de ingenieria. |
| **Baja** | `QuickAddModal.tsx` | Anadir contador dinamico de caracteres en el textarea de descripcion. | Retroalimentacion visual inmediata. |

---
*Fin del documento de auditoria UI/UX de GlassMatch AI.*

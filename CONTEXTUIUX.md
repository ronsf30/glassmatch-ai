# CONTEXTUIUX.md — Auditoria Integral de Interfaz, Diseno y Experiencia de Usuario (UI/UX)
## Proyecto: GlassMatch AI (Caribbean Sea Glass Edition)
**Version:** 0.2.0 (Fase 4 Multi-Cloud & Zero-Trust ATS)  
**Fecha de evaluacion:** 10 de Septiembre de 2026  
**Repositorio Oficial:** https://github.com/ronsf30/glassmatch-ai (Rama: main)  
**Destinatarios:** Auditores de producto, disenadores de sistemas de diseno, desarrolladores frontend, auditores de accesibilidad y agentes de IA externos.

---

## 1. Filosofia y Sistema de Diseno "Caribbean Sea Glass"

GlassMatch AI implementa un lenguaje visual denominado **Caribbean Sea Glass**, concebido para transformar la experiencia de busqueda laboral en un entorno calmado, transparente, preciso y libre de sobrecarga cognitiva.

### 1.1. Paleta Cromatica y Roles Semanticos
El sistema de diseno utiliza tokens basados en Tailwind CSS v4 con variables semanticas estandarizadas:

- **Mar Profundo / Texto Principal (`slate-900` / `#0f172a`):** Proporciona un contraste tipografico de maximo rigor sobre fondos claros, asegurando legibilidad sin fatiga visual.
- **Pizarra Media / Micro-copys (`slate-500` / `#64748b` a `slate-600` / `#475569`):** Utilizado para metadatos, etiquetas secundarias y fechas de seguimiento.
- **Agua Cristalina / Turquesa Primario (`teal-500` / `#14b8a6`, `teal-600` / `#0d9488`):** Color de identidad de marca. Representa fluidez, precision y confianza.
- **Brisa Marina / Cyan Secundario (`cyan-500` / `#06b6d4`, `cyan-600` / `#0891b2`):** Utilizado en gradientes decorativos, anillos de compatibilidad de alto rendimiento y estados hover.
- **Verde Esmeralda Operativo (`emerald-500` / `#10b981`, `emerald-600` / `#059669`):** Estados de salud de IA activos, afinidad sobresaliente (Score >= 85%) y conexiones exitosas.
- **Ambar de Cuota y Advertencia (`amber-500` / `#f59e0b`, `amber-600` / `#d97706`):** Notificaciones de cuota excedida (HTTP 429), alertas de brecha tecnica o compatibilidad media (70% a 84%).
- **Carmesi de Descarte / Error (`rose-500` / `#f43f5e`, `rose-600` / `#e11d48`):** Acciones destructivas, vacantes descartadas por Kill Switch o fallo critico de infraestructura.

### 1.2. Materialidad Translucida (Glassmorphism Avanzado)
El diseno de superficies no utiliza fondos opacos solidos; se basa en refraccion fisica simulada:
- **Tarjetas de Cristal Base (`GlassCard.tsx`):**
  - Fondo: `bg-white/70` a `bg-white/90` con `backdrop-blur-xl` o `backdrop-blur-2xl`.
  - Bordes perimetrales: `border border-white/60` con realces tenues en `border-teal-500/20`.
  - Sombras difusas: `shadow-[0_8px_32px_rgba(13,148,136,0.06)]` que transmiten elevacion sin saturar de tinta oscura la interfaz.
- **Fondos de Modales y Drawers:**
  - Telon de fondo (`backdrop`): `bg-slate-900/40` con desenfoque adaptativo `backdrop-blur-md`.

### 1.3. Movimiento y Micro-interacciones
- **Libreria:** Framer Motion 13.
- **Fisica:** Animaciones con amortiguacion (`damping: 25`, `stiffness: 300`) en expansiones y transiciones modales.
- **Feedback visual:** Efectos sutiles de elevacion al cursor (`hover:-translate-y-0.5`), transicion de color de borde a 200 ms y pulsos de estado (`animate-pulse`) en sondas de conexion en tiempo real.

---

## 2. Anatomia y Auditoria por Modulo de Interfaz

---

### 2.1. Barra de Navegacion Superior (`GlassHeader.tsx`)

La cabecera actua como el centro neuronal de navegacion, control de estado global e invocacion de acciones rapidas.

#### Elementos Estructurales:
1. **Identidad de Marca:**
   - Logotipo de gema con gradiente turquesa y tipografia en peso 800: "GlassMatch AI".
   - Subtitulo de estado: "Caribbean Sea Glass Edition — Multi-Cloud ATS".
2. **Badge de Salud y Modelo de IA Dinamico:**
   - **Estado Operativo Normal:** Pastilla verde esmeralda con punto pulsante (`bg-emerald-500`), texto del modelo activo (ej. "Gemini 3.8 Flash-Lite").
   - **Estado de Cuota Excedida / Advertencia:** Pastilla ambar con icono de alerta (`bg-amber-500`), texto "Gemini Cuota Excedida (HTTP 429)" con tooltip explicativo.
   - **Estado de Respaldo Multi-Cloud Activo:** Pastilla cyan con indicador "Groq Llama 3.3 70B (Respaldo)".
   - **Estado Offline / Motor Local:** Pastilla gris pizarra "Motor Local Zero-Trust".
3. **Pestanas Principales de Navegacion (Tabs):**
   - **Radar:** Icono `Compass`, acceso al listado y filtrado de vacantes evaluadas.
   - **Pipeline:** Icono `Kanban`, acceso al tablero CRM de postulaciones.
   - **Perfil:** Icono `UserCheck`, acceso al Profile Studio, configuracion de IA y subida de CV.
4. **Disparadores Globales:**
   - Boton "+ Nueva Vacante": Abre `QuickAddModal.tsx` con atajo directo.
   - Boton "Como Funciona": Abre el tour guiado interactivo de 6 pasos (`TutorialModal.tsx`).
   - Boton "Sincronizar": Invoca la ingestion multi-portal con spinner interactivo y estado de progreso.

#### Evaluacion de Calidad UI/UX:
- **Aciertos:**
  - El usuario siempre tiene visibilidad del modelo de IA que esta respondiendo sin tener que navegar a la pantalla de configuracion.
  - La alternancia de pestanas preserva el estado en memoria sin recargar el DOM.
- **Cumplimiento de Accesibilidad:** Cumple ratio de contraste 4.8:1 para texto e iconos sobre la barra translucida fija (`sticky top-0 z-40`).

---

### 2.2. Radar de Compatibilidad Laboral (`MatchRadarPreview.tsx` y `MatchRing.tsx`)

Es el modulo de visualizacion principal donde se muestran las vacantes que superaron la bateria de 5 Kill Switches.

#### Componente Destacado: Visualizador Radial (`MatchRing.tsx`)
- **Implementacion:** SVG vectorial con propiedad parametrica `strokeDasharray` y `strokeDashoffset` calculada dinamicamente:
  - Radio: 38px, Trazo: 6px.
  - Gradiente vectorial SVG segun rango de score:
    - **Score >= 85%:** Gradiente `emerald-400` a `teal-500` (Alta Afinidad).
    - **Score 70% - 84%:** Gradiente `teal-400` a `cyan-500` (Buena Compatibilidad).
    - **Score < 70%:** Tono `amber-400` (Afinidad Marginal).
  - Micro-optimizacion: Se implemento `strokeLinecap="round"` y transicion CSS fluida en milisegundos para evitar parpadeos visuales al montar o filtrar tarjetas.

#### Anatomia de la Tarjeta de Vacante (`JobCard`):
1. **Encabezado:** Titulo del puesto (16px `font-bold`), Empresa empleadora con insignia de portal de origen (LinkedIn, Remotive, Jobicy, Arbeitnow, Manual).
2. **Anillo Lateral:** Visualizacion compacta del porcentaje de encaje y nivel jerarquico deducido (Junior, Mid, Senior, Lead).
3. **Pildoras de Metadatos:** Ubicacion y modalidad (Remoto Global, Remoto Pais, Hibrido), Salario inferido o detectado, Fecha de publicacion.
4. **Etiquetas de Stack Tecnologico:** Badges redondeados con borde sutil turquesa mostrando las tecnologias principales encontradas en la oferta.
5. **Caja de Diagnostico Ejecutivo:** Resumen semantico de 2 lineas generado por el modelo de IA destacando la razon fundamental del match.
6. **Botonera de Accion Inmediata:**
   - Boton "Inspeccionar Vacante": Despliega el drawer lateral con el analisis completo.
   - Boton "Mover a Pipeline": Agrega la vacante a la etapa "Guardadas" o "Postuladas" con un solo clic.

#### Barra de Filtrado y Controles:
- **Filtro de Afinidad:** Segmentador rapido: `Todas`, `Score >= 70%`, `Score >= 80%`, `Score >= 90%`.
- **Filtro de Idioma:** Selector `Todos`, `Solo Espanol`, `Solo Ingles`.
- **Caja de Busqueda Reactiva:** Input con icono `Search` que filtra en tiempo real por coincidencia de texto en puesto, empresa o tecnologias.

---

### 2.3. Tablero CRM Glass Pipeline (`GlassPipelinePreview.tsx`)

Permite gestionar el ciclo de vida completo de las postulaciones del candidato a lo largo de 6 columnas transaccionales:

#### Las 6 Etapas Transaccionales:
1. **Descubiertas:** Vacantes que entraron por sincronizacion automatica o captura manual y tienen alta afinidad.
2. **Guardadas:** Vacantes seleccionadas por el candidato para postular a corto plazo.
3. **Postuladas:** Aplicacion formal realizada (envio de CV, formulario corporativo o mensaje a reclutador).
4. **En Entrevista:** Procesos activos con screening de RRHH, prueba tecnica o entrevista cultural.
5. **Oferta Recibida:** Propuesta laboral en fase de evaluacion o negociacion de compensacion.
6. **Descartadas:** Procesos concluidos por el candidato o rechazos del empleador.

#### Caracteristicas de Experiencia de Usuario:
- **Cabecera de Embudo (Funnel Metrics):** Indicadores numericos superiores con el recuento total de vacantes en proceso activo, ratio de avance a entrevista y tiempo promedio en dias.
- **Selectores de Transicion Rapida:** Cada tarjeta en el pipeline dispone de un menu desplegable optimizado que permite mover la postulacion a cualquiera de las otras 5 etapas con actualizacion inmediata en la base de datos local SQLite.
- **Bloc de Notas Confidencial Integrado:** Acceso a un area de notas por vacante donde el usuario puede registrar preguntas realizadas en la entrevista, rangos salariales conversados o datos de contacto del entrevistador.

---

### 2.4. Profile Studio y Centro de Control de IA (`ProfileStudioPreview.tsx`)

Es el panel de configuracion central donde convergen la identidad del profesional y la orquestacion de la infraestructura de IA.

#### 2.4.1. Tarjeta 1: Selector de Estrategia Gemini 3.8 (Con Feedback de Cuota en Vivo)
- **Pestana "Maxima Precision" (Gemini 3.8 Flash):**
  - **Uso:** Analisis ATS de maxima profundidad analitica y deteccion exhaustiva de sutilezas tecnicas.
  - **Comportamiento ante Cuota Excedida (HTTP 429):**
    - Despliega una alerta ambar con borde `border-amber-500/30` y fondo `bg-amber-50/80`.
    - Mensaje textual claro: *"Cuota gratuita de Gemini Flash agotada (HTTP 429: Resource has been exhausted). Cambia a Ahorro Inteligente o activa Groq Cloud para continuar operando sin interrupcion"*.
    - Proporciona retroalimentacion honesta y comprensible de por que esa pestana particular esta temporalmente en pausa.
- **Pestana "Ahorro Inteligente" (Gemini 3.8 Flash-Lite):**
  - **Uso:** Analisis rapido, optimizacion de costos de API y respuesta inmediata.
  - **Comportamiento en Vivo:**
    - Despliega un panel verde esmeralda con borde `border-emerald-500/30` y fondo `bg-emerald-50/80`.
    - Mensaje textual: *"Operativo con Gemini 3.8 Flash-Lite. Consumo minimo de tokens y respuesta inmediata"*.
    - Brinda luz verde al usuario para trabajar de inmediato con total normalidad.
- **Mecanismo de Guardado:** Al hacer clic en cualquiera de las dos pestanas, la seleccion se persiste en milisegundos en la base de datos SQLite (`AppConfig`) a traves del endpoint `/api/config/gemini`, manteniendo la preferencia al reiniciar la aplicacion.

#### 2.4.2. Tarjeta 2: Proveedor de Respaldo Multi-Cloud (Groq Cloud Llama 3.3 70B)
- **Interruptor Maestro (Toggle Switch):** Activa o desactiva la participacion de Groq Cloud como escalon Nivel 3 en la cascada de llamadas.
- **Campo de Credencial (API Key):** Input protegido de tipo contrasena con mascara y boton para revelar/ocultar caracteres.
- **Selector de Modelo:** Permite alternar entre `llama-3.3-70b-versatile` (70 mil millones de parametros, alta precision) y `llama-3.1-8b-instant` (ultrarrapido).
- **Boton de Diagnostico en Vivo ("Probar Conexion"):**
  - Ejecuta una llamada de comprobacion contra `/api/config/backup-ai`.
  - Muestra un spinner de medicion y retorna la latencia exacta en milisegundos (ej. *"Conexion exitosa — Latencia: 312 ms — Modelo: llama-3.3-70b-versatile"*).

#### 2.4.3. Extractor de CV Multimodal y Limites Tecnicos
- **Zona de Carga Drag & Drop:**
  - Acepta archivos PDF con retroalimentacion inmediata de carga.
  - Ejecuta en backend el script `scripts/extract_cv_pdf.py` con codificacion UTF-8 forzada.
  - Extrae y presenta en pantalla: Titulo profesional detectado, anos de experiencia, nivel de ingles detectado y lista estructurada de tecnologias dominadas.
- **Matriz de Limites Tecnicos Excluidos (Zero-Trust Hard Exclusions):**
  - Interfaz interactiva de etiquetas removibles para definir tecnologias expresamente rechazadas (ej. `PHP`, `C++`, `Java legacy`, `Modalidad Presencial`).
  - El motor Zero-Trust ATS utiliza esta lista para ejecutar el Kill Switch correspondiente antes de consultar cualquier API de inteligencia artificial.

---

### 2.5. Inspector Lateral de Vacantes (`JobInspectorDrawer.tsx`)

Panel deslizante que se despliega desde el lateral derecho al inspeccionar cualquier vacante del radar o pipeline.

#### Estructura y Secciones:
1. **Encabezado del Drawer:** Titulo del rol, empresa con enlace externo al portal original, boton de cierre rapido (Esc o clic fuera).
2. **Desglose de Compatibilidad ATS:**
   - Barra de progreso interactiva con el Match Score global.
   - Puntos fuertes detectados (lista con marcas verdes de verificacion).
   - Brechas o areas de mejora (lista con marcas ambar de advertencia).
   - Justificacion analitica detallada de por que se obtuvo dicha calificacion.
3. **Generador de Pitches de Contacto en 3 Tonos:**
   - **Tono Directo y Ejecutivo:** Mensaje corto enfocado en impacto de negocio, metricas y soluciones directas para lideres tecnicos o directores.
   - **Tono Consultivo y Tecnico:** Mensaje estructurado destacando arquitectura, buenas practicas y stack tecnologico afín para Hiring Managers.
   - **Tono Entusiasta y Cultural:** Mensaje calido destacando alineacion con la mision de la compania y producto para reclutadores de talento.
   - **Botonera de Copiado:** Cada tono incluye un boton "Copiar al portapapeles" con confirmacion visual temporal de 2 segundos ("Copiado").
4. **Simulador de Entrevista Tecnica Interactiva:**
   - Presenta preguntas desafiantes formuladas por la IA basadas en las brechas especificas detectadas entre el CV y la vacante.
   - Area de texto interactiva para ensayar respuestas.
   - Evaluador de respuesta que califica la solidez tecnica y la claridad de la argumentacion del candidato.

---

### 2.6. Modal de Analisis Manual de Ofertas (`QuickAddModal.tsx`)

Permite ingresar cualquier oferta externa de LinkedIn, correos o foros sin esperar una sincronizacion automatica masiva.

#### Flujo de Uso y Caracteristicas:
- **Pestana 1 (Pegar Texto / Descripcion):** Area de texto optimizada para pegar los requisitos de la vacante, puesto y empresa.
- **Pestana 2 (Pegar URL):** Permite ingresar la URL de una vacante corporativa.
- **Pre-Filtrado Zero-Trust:** Ejecuta de inmediato los Kill Switches de limites tecnicos. Si la vacante solicita una tecnologia vetada en el perfil, el sistema informa del descarte sin consumir tokens de IA.
- **Estado de Carga Semantica:** Animacion con anillo de pulso turquesa y micro-mensajes progresivos informando de la conexion con el modelo de IA.
- **Inyeccion Automatica:** Tras la evaluacion exitosa, la vacante se guarda en SQLite y se posiciona en el radar en primer lugar.

---

### 2.7. Tour Guiado de Onboarding (`TutorialModal.tsx`)

Modal interactivo de 6 pasos concebido para guiar a usuarios nuevos a traves de la arquitectura completa del sistema:

1. **Paso 1: Bienvenido a GlassMatch AI:** Explicacion de la filosofia Zero-Trust ATS y eliminacion radical de falsos positivos.
2. **Paso 2: El Match Radar y los 5 Kill Switches:** Como funciona el anillo de compatibilidad y los filtros de descarte previo.
3. **Paso 3: Analisis Instantaneo ("+ Nueva Vacante"):** Como evaluar ofertas individuales externas en 2 segundos.
4. **Paso 4: Sincronizador Multi-Canal en Vivo:** Integracion con LinkedIn, Remotive, Jobicy y Arbeitnow con temporizacion anti-baneo.
5. **Paso 5: CRM Glass Pipeline de 6 Fases:** Como organizar el avance de postulaciones entre Descubiertas, Guardadas, Postuladas, En Entrevista, Ofertas y Descartadas.
6. **Paso 6: Profile Studio y Estrategia Multi-Cloud:** Configuracion de CV en PDF, selector de estrategia Gemini 3.8 y respaldo con Groq Cloud 70B.

---

## 3. Matriz de Auditoria de Accesibilidad, Ergonomia y Rendimiento

| Modulo / Componente | Criterio WCAG Evaluado | Estado Actual | Observacion Tecnica / Diagnostico |
| :--- | :--- | :--- | :--- |
| **`GlassHeader.tsx`** | Contraste de texto (1.4.3) | Cumple (4.8:1) | Tipografia `slate-900` sobre cristal blanco con desenfoque de 24px. |
| **`MatchRing.tsx`** | Uso del color (1.4.1) | Cumple | El porcentaje numerico textual acompana siempre al anillo cromatico. |
| **`ProfileStudioPreview.tsx`** | Notificacion de errores (3.3.1) | Cumple | La alerta ambar de cuota 429 proporciona explicacion clara y via de solucion. |
| **`JobInspectorDrawer.tsx`** | Control de foco por teclado (2.1.2) | Cumple | El drawer atrapa el foco y permite cierre con tecla Escape (`Radix UI Dialog`). |
| **`QuickAddModal.tsx`** | Etiquetas en formularios (3.3.2) | Cumple | Todos los inputs poseen labels semanticos visibles e identificadores unicos. |
| **Pipeline Drag / Drop** | Alternativa accesible (2.5.5) | Cumple | Cada tarjeta ofrece selectores desplegables nativos para cambio de columna sin arrastrar. |

---

## 4. Auditoria de Estados del Sistema y Resiliencia Visual

El sistema esta disenado para comunicar de manera transparente cualquier contingencia de conectividad o consumo de tokens:

```
[Inicio de Evaluacion de Vacante]
               |
      (Kill Switches = Superados)
               |
               v
  +--------------------------+
  | Estrategia Gemini 3.8    |
  | Nivel 1: Flash / Lite    |
  +--------------------------+
         /             \
    [HTTP 200]     [HTTP 429 Cuota]
        |               \
        v                v
[Feedback Emerald]  +-----------------------------------+
[UI Operativa]      | Nivel 2: Gemini 3.8 Alternativo   |
                    +-----------------------------------+
                           /                     \
                      [HTTP 200]             [HTTP 429]
                          |                       \
                          v                        v
                  [Feedback Emerald]      +-------------------------------+
                                          | Nivel 3: Groq Cloud Llama 70B |
                                          +-------------------------------+
                                                 /                 \
                                            [HTTP 200]          [Fallo API]
                                                |                    \
                                                v                     v
                                        [Feedback Cyan]       +--------------------------+
                                        [Badge: Groq Cloud]   | Nivel 4: Motor Local ATS |
                                                              +--------------------------+
                                                                     /
                                                               [Feedback Pizarra]
                                                               [Badge: Motor Local]
```

### Protocolo de Feedback Visual ante Cuota Excedida:
1. **Deteccion Inmediata:** Si Gemini Flash retorna error 429, la interfaz no se congela ni muestra modales bloqueantes.
2. **Senalizacion Ambar:** El selector de estrategia en `ProfileStudioPreview.tsx` despliega el aviso informativo de agotamiento de cuota.
3. **Continuidad Operativa:** El badge de la cabecera indica inmediatamente que el sistema ha escalado a Gemini Flash-Lite o a Groq Cloud, garantizando que el usuario puede seguir evaluando vacantes sin interrupcion.

---

## 5. Conclusiones de la Auditoria UI/UX

1. **Madurez del Sistema de Diseno:** La estetica "Caribbean Sea Glass" ha logrado un equilibrio optimo entre modernidad visual (translucidez, gradientes marinos) y estricta funcionalidad ergonomica (contraste superior, jerarquia tipografica sin distracciones).
2. **Transparencia hacia el Usuario:** La integracion del feedback en tiempo real de los modelos de IA (distinguiendo entre Flash con cuota agotada y Flash-Lite 100% operativo) elimina la incertidumbre tecnica y ofrece una experiencia de uso sumamente profesional.
3. **Arquitectura Modular Robusta:** Los componentes de visualizacion (`MatchRing`, `JobCard`, `PipelineBoard`, `InspectorDrawer`) estan desacoplados de la logica de red, lo que permite auditar y extender cualquier seccion del frontend con minimo riesgo de regresion.

---
*Fin del documento de auditoria UI/UX de GlassMatch AI.*

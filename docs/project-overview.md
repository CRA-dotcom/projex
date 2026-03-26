# DESC - Deliverable Engine for Service Control

## Resumen Ejecutivo

DESC es un sistema automatizado de generacion y control de entregables profesionales para una firma de consultoria multidisciplinaria. El sistema reemplaza el trabajo manual de crear cotizaciones, contratos y entregables mes a mes, delegando la generacion a IA y la orquestacion a workflows automatizados.

El objetivo final: **cero intervencion humana** desde que un cliente contrata un servicio hasta que recibe su entregable en la nube.

---

## El Problema que Resuelve

Actualmente el proceso es manual:
- Un Excel distribuye la proyeccion financiera anual del cliente entre los diferentes servicios
- Cada mes, alguien debe revisar que servicios tocan, solicitar la informacion al cliente, generar el entregable manualmente y entregarlo
- La calidad del entregable depende de quien lo haga y cuanto tiempo le dedique
- No hay estandarizacion: cada entregable se ve diferente aunque sea el mismo servicio

DESC automatiza todo este flujo para que los entregables se generen con calidad de agencia profesional, de forma consistente y sin intervencion.

---

## Las Dos Etapas del Proceso

### Etapa 1: Proyeccion Financiera (Planificacion)

**Que hace:** Distribuye el presupuesto anual del cliente entre todos los servicios que necesita, mes por mes.

**Reglas de negocio:**
- El gasto en cada area no puede superar un porcentaje del ingreso anual del cliente (ej: legal max 8%)
- Los montos deben estar alineados a precios de mercado
- Hay topes absolutos por servicio (ej: legal no puede pasar de $200,000 MXN/mes)
- La distribucion se ajusta al tamano de facturacion anual del cliente
- El resultado es una **Matriz de Proyeccion**: un calendario donde cada celda dice que servicio se presta en que mes y por cuanto

**Input:** Datos financieros del cliente (facturacion anual, tamano de empresa, servicios requeridos)
**Output:** Matriz de Proyeccion anual (cliente x mes x servicio x monto)

#### Logica de la Calculadora (Excel actual - ya funcional)

La calculadora tiene 5 hojas interconectadas:

**Hoja 1 - Configuracion (Inputs manuales):**
- Nombre del Cliente
- Venta Anual Proyectada (ej: $50,000,000)
- Presupuesto Total a Contratar (ej: $30,000,000)
- Industria
- Tasa de Comision (ej: 2%)

**Benchmarks de Mercado (9 servicios):**

| Servicio | Tipo | Min % | Max % | % Elegido (default=promedio) | Activo |
|----------|------|-------|-------|------------------------------|--------|
| Legal | Base | 1% | 3% | 2% | Si/No |
| Contable | Base | 2% | 4% | 3% | Si/No |
| TI | Base | 4% | 7% | 5.5% | Si/No |
| Marketing | Base | 10% | 15% | 12.5% | Si/No |
| RH | Base | 3% | 5% | 4% | Si/No |
| Admin | Base | 3% | 5% | 4% | Si/No |
| Comisiones | Comodin | - | - | = Tasa Comision | Si/No |
| Logistica | Comodin | 4% | 8% | 6% | Si/No |
| Construccion | Comodin | 2% | 5% | 3.5% | Si/No |

**Hoja 2 - Estacionalidad:**
- 12 meses con venta mensual proyectada
- Factor de Estacionalidad (FE) = Venta del Mes / (Venta Anual / 12)
- FE > 1 = temporada alta, FE < 1 = temporada baja

**Hoja 3 - Matriz de Proyeccion (Calculos automaticos):**
1. Calcula comisiones anuales = Venta Anual x Tasa Comision
2. Presupuesto restante = Presupuesto Total - Comisiones
3. Suma pesos de servicios activos (excluyendo comisiones)
4. Asignacion anual por servicio = Presupuesto Restante x (Peso servicio / Suma pesos activos)
5. Asignacion mensual base = Asignacion anual / 12
6. Monto mensual ajustado = Asignacion mensual base x FE del mes
7. Comisiones mensuales = Venta mensual x Tasa Comision (proporcional a ventas)

**Hoja 4 - Facturacion:**
- Por cada servicio: Concepto del Servicio (manual), Clave SAT (manual), Montos mensuales (vinculados a Matriz)

**Hoja 5 - Dashboard:**
- Ventas vs Pago total de servicios por mes
- Diferencia vs presupuesto promedio

### Etapa 2: Generacion de Entregables (Ejecucion)

**Que hace:** Para cada servicio asignado en un mes, genera automaticamente:
1. **Cotizacion** - Se genera al momento de contratar (primera vez)
2. **Contrato** - Se genera al contratar el primer servicio
3. **Entregable** - Se genera al emitir la factura del mes/servicio correspondiente

**Variables de facturacion por cliente:**
- Semanal (clientes que usan la factura para pagar nomina)
- Quincenal
- Mensual (clientes que requieren sacar utilidades al cierre)

---

## Areas de Servicio y sus Inputs

Cada area requiere informacion especifica del cliente para poder generar entregables personalizados:

| Area | Inputs Requeridos | Ejemplo de Entregable |
|------|-------------------|----------------------|
| **Legal** | Actas, Asambleas | Actas constitutivas, contratos legales, dictamenes |
| **Contable** | Estados Financieros, Balanzas, Estados de cuenta | Declaraciones, reportes contables, balanzas de comprobacion |
| **Financiero** | Proyecciones, datos del ejercicio anterior | Analisis financiero, proyecciones de flujo, reportes de rentabilidad |
| **Marketing** | Identidad Corporativa | Estrategias de marca, planes de marketing, material corporativo |
| **RH/Administrativo** | Procesos, Organigrama, Mision, Vision, Objetivos, Perfiles, Flujogramas de trabajo | Manuales de procedimientos, politicas internas, descripciones de puesto |
| **Construccion** | Obras, Presupuestos, Planos | Presupuestos de obra, cronogramas, reportes de avance |
| **Logistica** | Cartera de clientes y ubicaciones | Rutas optimizadas, planes de distribucion |

---

## Triggers del Sistema

| # | Trigger | Que Dispara |
|---|---------|-------------|
| 1 | **Pago realizado y confirmado** | Genera la factura y dispara la generacion del entregable del mes |
| 2 | **Cliente sube requisitos a la nube** | Marca inputs como recibidos, habilita la generacion |
| 3 | **Diagrama de Flujo de Programacion ejecutado por area** | Activa el workflow de generacion segun calendario |
| 4 | **Primer dia del mes (calendario)** | Revisa la Matriz de Proyeccion y envia solicitudes de informacion |
| 5 | **Contratacion del primer servicio** | Genera cotizacion y contrato |

---

## Flujo de Trabajo Automatizado

```
[Calendario: Inicio de Mes]
        |
        v
[Revisar Matriz de Proyeccion]
        |
        v
[Filtrar: Que servicios tocan este mes para cada cliente?]
        |
        v
[Enviar solicitud personalizada al cliente]
  (solo pide los inputs del servicio activo)
        |
        v
[Cliente envia informacion] -----> [Se marca "Recibida" en BD]
        |
        v
[Se confirma pago / se genera factura]
        |
        v
[Agente Creador (IA)]
  - Recibe: plantilla del servicio + datos del cliente + mes
  - Genera: entregable en formato profesional
        |
        v
[Agente Auditor (IA)]
  - Compara entregable vs requisitos del Archivo Maestro
  - Compara vs informacion enviada por el cliente
  - Si hay errores: devuelve al Agente Creador
  - Si esta correcto: aprueba
        |
        v
[Generar PDF con branding]
        |
        v
[Subir a carpeta compartida del cliente]
        |
        v
[Marcar como "Entregado" en Matriz de Control]
```

---

## Arquitectura Tecnica Propuesta

### Componentes

| Componente | Herramienta | Funcion |
|------------|-------------|---------|
| **Orquestador** | n8n | Maneja la logica de negocio, conecta todos los servicios, ejecuta workflows |
| **IA - Generacion** | Claude API (Sonnet) | Genera entregables siguiendo plantillas con precision |
| **IA - Auditoria** | Claude API | Valida calidad y completitud antes de entregar |
| **Base de Datos** | Airtable | Matriz de Proyeccion, control de estatus, registro de clientes |
| **Formularios** | Tally.so | Recoleccion de informacion del cliente (formularios condicionales) |
| **Almacenamiento** | Google Drive | Carpetas por cliente, entregables en PDF |
| **Generacion PDF** | Google Docs API / CloudConvert | Convierte el output de IA a PDF con branding |
| **Comunicacion** | Email / WhatsApp API | Notificaciones y solicitudes automaticas al cliente |

### Modelo de Datos (Base de Datos Central)

**Tabla: Clientes**
- ID Cliente
- Nombre / Razon Social
- Facturacion Anual
- Tamano de empresa
- Frecuencia de facturacion (semanal/quincenal/mensual)
- Carpeta Drive (link)

**Tabla: Matriz de Proyeccion**
- ID Cliente (relacion)
- Mes
- Servicio (Legal, Contable, Financiero, Marketing, RH, Construccion, Logistica)
- Monto a Facturar
- Estatus Info (Pendiente / Recibida)
- Estatus Entregable (No iniciado / En proceso / Generado / Entregado)
- Estatus Pago (Pendiente / Confirmado)

**Tabla: Plantillas de Servicio**
- Servicio
- Tipo de Entregable
- Plantilla (template para IA)
- Inputs requeridos
- Criterios de validacion (para el Agente Auditor)

**Tabla: Entregables Generados**
- ID Entregable
- ID Cliente (relacion)
- Mes
- Servicio
- Archivo PDF (link)
- Fecha de generacion
- Estatus de auditoria (Aprobado / Rechazado / Corregido)

---

## El Reto Principal

> "Lo complicado hasta ahorita es crear cada servicio. Que la IA lo desarrolle como se veria si lo hace una agencia de marketing o una firma de consultoria financiera."

El nucleo del proyecto es que cada entregable tenga **calidad profesional real**, no un documento generico. Esto requiere:

1. **Plantillas maestras por servicio** - Templates detallados que definan estructura, tono, profundidad y formato de cada tipo de entregable
2. **Prompts especializados por area** - Cada servicio necesita un prompt que haga a la IA actuar como un especialista de esa industria
3. **Datos de contexto del cliente** - La personalizacion depende de que tan buena sea la informacion recolectada
4. **Doble validacion (Creador + Auditor)** - El agente auditor asegura que no se entregue basura

---

## Alcance del Proyecto (Por Definir)

### Fase 1: Fundamentos
- [ ] Definir y documentar cada servicio con sus entregables especificos
- [ ] Crear plantillas maestras para cada tipo de entregable
- [ ] Disenar el modelo de datos en Airtable
- [ ] Migrar la logica del Excel de proyeccion financiera a la BD

### Fase 2: Motor de Generacion
- [ ] Crear prompts especializados por servicio
- [ ] Implementar el Agente Creador con Claude API
- [ ] Implementar el Agente Auditor
- [ ] Configurar generacion de PDF con branding

### Fase 3: Automatizacion
- [ ] Configurar workflows en n8n
- [ ] Implementar formularios dinamicos (Tally)
- [ ] Conectar triggers (calendario, pagos, uploads)
- [ ] Configurar notificaciones (email/WhatsApp)

### Fase 4: Integracion y Pruebas
- [ ] Pruebas con datos reales de un cliente piloto
- [ ] Ajustes de calidad en plantillas y prompts
- [ ] Deployment en produccion

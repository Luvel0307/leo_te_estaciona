# Leonel Te Estaciona · Demo

Demo web de **movilidad inteligente** para el estacionamiento de la Universidad Anáhuac, Campus Córdoba-Orizaba.
Muestra la disponibilidad por zona con datos **simulados**. Todavía no se conecta a las cámaras ni tiene registro de usuarios.

## Qué incluye

| Sección | Contenido |
|---|---|
| **Inicio** | Cajones totales / ocupados / disponibles, mapa del campus con zonas A-B-C, zona recomendada, disponibilidad por zona |
| **Mapa** | Buscador de edificios, mapa con zoom y globo de la zona elegida, tiempo estimado de búsqueda, botón “Cómo llegar” (Google Maps) |
| **Zonas** | Detalle por zona con los cajones libres u ocupados uno por uno, y la sección de visión artificial con las fotos reales del estacionamiento y detecciones de vehículos precargadas |
| **Estado** | Medidor de ocupación, tendencia en vivo, ocupación esperada por hora, **simulador de hora** (para enseñar la hora pico) y estado del sistema |
| **Usuario** | Perfil de prueba guardado solo en el navegador, destino frecuente con recomendación y aviso cuando la zona tiene menos de 5 lugares |

Los datos se actualizan cada 8 s (meta SMART: ≤ 10 s).

## Estructura

```
index.html          → página única con las 5 secciones
css/styles.css      → estilos (paleta naranja/gris de la plantilla)
js/config.js        → ⚙️ zonas, cajones, lugares del buscador, curva por hora y cámaras
js/sim.js           → motor de simulación (lo que en el futuro reemplazará la API de YOLO)
js/app.js           → interfaz
assets/img/         → foto aérea, fotos de cámara, mascota y logo
render.yaml         → configuración para Render
```

### Ajustes rápidos (en `js/config.js`)
- **Cajones por zona**: `cajones` (deben sumar 375).
- **Nombres del buscador**: lista `lugares` y la zona más cercana a cada uno. Revisa que correspondan a los edificios reales.
- **Forma de las zonas en el mapa**: `formas` usa coordenadas sobre la foto aérea de 700 × 524 px.
- **Picos de demanda**: `curvaHoraria`.

## Probarlo en tu computadora
Abre `index.html` con doble clic, o, si prefieres un servidor local:
```bash
python -m http.server 8000   # luego entra a http://localhost:8000
```

## Subir a GitHub
1. En github.com → **New repository** → nombre `leonel-te-estaciona` → *Create repository*.
2. Clic en **“uploading an existing file”** y arrastra **el contenido** de esta carpeta (no la carpeta completa: `index.html` debe quedar en la raíz).
3. **Commit changes**.

O desde la terminal:
```bash
cd leonel-te-estaciona
git init && git add . && git commit -m "Demo Leonel Te Estaciona"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/leonel-te-estaciona.git
git push -u origin main
```

## Desplegar en Render (gratis)
1. En dashboard.render.com → **New +** → **Static Site**.
2. Conecta tu cuenta de GitHub y elige el repositorio `leonel-te-estaciona`.
3. Configura:
   - **Branch**: `main`
   - **Build Command**: *(déjalo vacío)*
   - **Publish Directory**: `.`
4. **Create Static Site**. En 1–2 minutos queda en `https://leonel-te-estaciona.onrender.com` (o el nombre que elijas).

> Alternativa: **New + → Blueprint**, elige el repo y Render leerá `render.yaml` automáticamente.

Cada vez que hagas *push* a `main`, Render vuelve a publicar solo. Los sitios estáticos de Render no se “duermen”, así que el demo abre al instante.

## Siguiente paso (versión con cámaras)
Reemplazar `js/sim.js` por una llamada a una API (por ejemplo, un servicio en Python con YOLO) que devuelva:
```json
{ "zonas": { "A": [true, false, ...], "B": [...], "C": [...] }, "timestamp": 1731200000 }
```
La interfaz ya trabaja con ese formato (un arreglo de ocupado/libre por cajón).

---
Proyecto de Ingeniería del Producto · Sistemas Integrales de Gestión — Universidad Anáhuac Campus Córdoba-Orizaba.
*Los datos mostrados son simulados y no corresponden a la ocupación real.*

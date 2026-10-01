# 🌌 CosmoScope 3D

[![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)](https://threejs.org/)
[![NASA Data](https://img.shields.io/badge/Data-NASA%20Exoplanet%20Archive-blue?logo=nasa)](https://exoplanetarchive.ipac.caltech.edu/)
[![Python](https://img.shields.io/badge/Python-3.7+-yellow?logo=python)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**CosmoScope 3D** es un explorador astronómico interactivo en tres dimensiones que permite navegar, analizar y comparar más de **4.750 sistemas estelares** y **6.344 exoplanetas confirmados**, utilizando datos reales procedentes del [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/).

---

## ✨ Características Principales

* 🪐 **Visualización 3D Interactiva**: Simulación dinámica con Three.js que representa la estrella anfitriona y los planetas orbitando a escala visual ajustada.
* 🌿 **Modelo Físico de Zona Habitable**: Implementación del modelo matemático de **Kopparapu et al. (2013/2014)**, calculando tanto la zona habitable conservadora (límites de evaporación y congelación desbocada) como la optimista (Venus reciente y Marte primitivo).
* 🌡️ **Cálculo de Temperatura de Equilibrio**: Determinación física de temperaturas ($T_{\text{eq}}$) en Kelvin y Celsius para todos los planetas según el flujo incidente y albedo planetario, eliminando registros nulos.
* ⚖️ **Física Planetaria y Gravedad Superficial**: Estimaciones empíricas de masa y cálculo de la gravedad superficial ($g$) en relación a la Tierra.
* 🔭 **Buscador y Filtros Avanzados**:
  * Búsqueda en tiempo real por nombre de sistema o constelación con navegación por teclado (Flechas y Enter).
  * Filtro por habitabilidad (planetas en zona habitable conservadora u optimista).
  * Filtro por rangos térmicos: Templados (200–320 K), Cálidos (> 320 K) y Gélidos (< 200 K).
  * Filtro por tipo espectral de la estrella (Solar G/F, Enanas Frías K/M, Gigantes A/B).
* 📜 **Descripciones Científicas Detalladas**: Fichas contextualizadas para sistemas emblemáticos (*TRAPPIST-1, Kepler-16 Tatooine, Proxima Centauri, Kepler-452, Kepler-186, 55 Cancri, WASP-12, WASP-76, TOI-700, LHS 1140, etc.*) y generación procedural para el resto del catálogo.
* 🌌 **Soporte Offline**: Todas las librerías 3D (`three.module.js`, `OrbitControls.js`) y datos astronómicos están incluidos localmente sin depender de CDNs externas.

---

## 🚀 Cómo Ejecutar el Proyecto

### Opción 1: Con Python (Recomendada)
Para evitar restricciones de seguridad CORS al cargar módulos locales en el navegador:
```bash
python run_app.py
```
O simplemente haz doble clic en **`Iniciar_CosmoScope_3D.bat`**. La aplicación iniciará un servidor HTTP ligero en segundo plano y abrirá automáticamente la ventana de CosmoScope 3D.

### Opción 2: Cualquier Servidor Web Local
Puedes utilizar cualquier servidor estático (como la extensión Live Server de VS Code, `npx serve`, o `python -m http.server 8000`) dentro de esta carpeta y acceder a:
```
http://localhost:8000/
```

---

## 🎮 Controles y Navegación

* **Clic Izquierdo + Arrastrar**: Rotar la cámara orbital alrededor del sistema.
* **Rueda del Ratón**: Zoom hacia el interior o exterior del sistema estelar.
* **Clic Derecho + Arrastrar**: Desplazamiento panorámico (pan).
* **Hover (Pasar el ratón)**: Muestra un tooltip con los datos físicos en tiempo real (radio, masa, gravedad, temperatura en K/°C y habitabilidad).
* **Buscador Superior**: Escribe el nombre del sistema (ej: `TRAPPIST-1`, `Kepler-452`, `Sistema Solar`) y pulsa `Enter` para viajar instantáneamente.
* **Panel Lateral Izquierdo**: Despliega filtros avanzados y métricas globales.

---

## 📁 Estructura del Proyecto

```
Carta_Gib/
│
├── index.html                 # Interfaz de usuario principal y estructura DOM
├── style.css                  # Estilos visuales, tema espacial y componentes HUD
├── app.js                     # Controlador lógico, filtros, buscador y descripciones
├── scene3d.js                 # Motor de renderizado 3D (Three.js), órbitas e iluminación
│
├── systems_data.js            # Base de datos formateada para consumo directo en JavaScript
├── nasa_systems.json          # Archivo fuente JSON estructurado con los sistemas estelares
│
├── prepare_data.py            # Script de procesamiento astrofísico (Zonas habitables, Teq, g)
├── fetch_nasa.py              # Script para consultar la API TAP de NASA Exoplanet Archive
├── run_app.py                 # Servidor de ejecución y lanzador de ventana de escritorio
│
├── assets/                    # Recursos visuales (fondo estelar galáctico)
│   └── bg_cosmos.jpg
├── libs/                      # Librerías cliente locales
│   ├── three.module.js
│   └── OrbitControls.js
│
├── app_icon.ico               # Icono de la aplicación
├── Iniciar_CosmoScope_3D.bat  # Acceso directo para ejecución en Windows
├── .gitignore                 # Archivos ignorados para el control de versiones Git
├── LICENSE                    # Licencia de código abierto MIT
└── README.md                  # Documentación del proyecto
```

---

## 🔬 Fuentes Científicas y Referencias

1. **NASA Exoplanet Archive**: Caltech/IPAC, DOI: [10.26133/NEA1](https://exoplanetarchive.ipac.caltech.edu/).
2. **Kopparapu et al. (2013, 2014)**: *Habitable Zones around Main-Sequence Stars: New Estimates*. The Astrophysical Journal.
3. **Chen & Kipping (2017)**: *Probabilistic Forecasting of the Masses and Radii of Other Worlds*. The Astrophysical Journal.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

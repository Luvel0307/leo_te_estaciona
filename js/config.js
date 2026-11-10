/* =========================================================
   LEONEL TE ESTACIONA · Configuración del demo
   Edita este archivo para ajustar zonas, cajones y lugares.
   ========================================================= */
window.LTE_CONFIG = {
  campus: "Universidad Anáhuac · Campus Córdoba-Orizaba",
  totalCajones: 375,
  intervaloActualizacion: 8, // segundos (objetivo SMART: ≤ 10 s)

  // Coordenadas sobre la foto aérea (assets/img/campus-aereo.jpg, 700 x 524 px)
  zonas: [
    {
      id: "A",
      nombre: "Zona A",
      descripcion: "Bahías diagonales junto a canchas y pista",
      color: "#E01B1B",
      cajones: 110,
      factorDemanda: 1.04, // > 1 = se llena más rápido que el promedio
      minutosDesdeAcceso: 2,
      pin: [329, 226],
      formas: [
        { tipo: "poly", puntos: "318,203 331,203 319,254 307,254" },
        { tipo: "poly", puntos: "339,200 352,200 339,250 328,250" }
      ]
    },
    {
      id: "B",
      nombre: "Zona B",
      descripcion: "Franja central y acceso norte",
      color: "#3D8BE0",
      cajones: 140,
      factorDemanda: 0.86,
      minutosDesdeAcceso: 3,
      pin: [397, 168],
      formas: [
        { tipo: "poly", puntos: "390,102 404,102 404,228 390,228" },
        { tipo: "poly", puntos: "362,90 428,90 428,99 362,99" }
      ]
    },
    {
      id: "C",
      nombre: "Zona C",
      descripcion: "Anillo perimetral del edificio circular",
      color: "#F5D234",
      cajones: 125,
      factorDemanda: 0.93,
      minutosDesdeAcceso: 4,
      pin: [460, 98],
      formas: [{ tipo: "anillo", cx: 460, cy: 142, r1: 30, r2: 41 }]
    }
  ],

  // Lugares para el buscador. Ajusta nombres y zona más cercana según el campus real.
  lugares: [
    { nombre: "Edificio E3", zona: "B" },
    { nombre: "Biblioteca", zona: "B" },
    { nombre: "Cafetería", zona: "B" },
    { nombre: "Edificio circular", zona: "C" },
    { nombre: "Auditorio", zona: "C" },
    { nombre: "Canchas de tenis", zona: "A" },
    { nombre: "Campo de fútbol / Pista", zona: "A" },
    { nombre: "Gimnasio", zona: "A" },
    { nombre: "Rectoría", zona: "B" },
    { nombre: "Acceso principal", zona: "A" }
  ],

  // Ocupación base esperada por hora (0–1). Picos según la encuesta (7:00–10:00).
  curvaHoraria: {
    0: 0.03, 1: 0.03, 2: 0.03, 3: 0.03, 4: 0.03, 5: 0.05, 6: 0.18,
    7: 0.62, 8: 0.88, 9: 0.95, 10: 0.94, 11: 0.91, 12: 0.89, 13: 0.86,
    14: 0.78, 15: 0.72, 16: 0.70, 17: 0.66, 18: 0.60, 19: 0.50,
    20: 0.36, 21: 0.20, 22: 0.08, 23: 0.04
  },

  // Cámaras de prueba (imágenes estáticas). Cajas en % de la imagen.
  camaras: [
    {
      id: "CAM-01",
      nombre: "Cámara 01 · Edificio E3 (vista poniente)",
      imagen: "assets/img/cam-01.jpg",
      zona: "B",
      detecciones: [
        [0, 81.2, 13.4, 9.0, 0.94], [10.3, 77.9, 17.5, 9.6, 0.96], [27.5, 77.9, 10.0, 5.9, 0.91],
        [45.9, 76.3, 11.9, 5.0, 0.88], [37.2, 84.2, 25.0, 11.6, 0.97], [46.6, 79.6, 20.6, 11.3, 0.93],
        [58.8, 80.4, 7.8, 4.6, 0.86], [65.0, 77.9, 15.0, 9.6, 0.95], [75.3, 77.1, 8.4, 6.2, 0.89],
        [75.3, 74.6, 10.3, 3.7, 0.78]
      ]
    },
    {
      id: "CAM-02",
      nombre: "Cámara 02 · Edificio E3 (vista oriente)",
      imagen: "assets/img/cam-02.jpg",
      zona: "B",
      detecciones: [
        [30.6, 78.8, 29.7, 21.2, 0.97], [22.5, 72.9, 29.4, 18.8, 0.96], [18.4, 69.2, 20.0, 10.4, 0.94],
        [17.5, 66.7, 13.8, 6.7, 0.88], [70.6, 67.9, 12.8, 8.8, 0.95], [81.3, 70.0, 14.4, 10.0, 0.93],
        [92.5, 72.5, 7.5, 10.0, 0.84], [52.8, 65.0, 9.7, 5.8, 0.90], [58.4, 65.4, 8.8, 6.3, 0.87],
        [64.1, 65.8, 11.6, 7.5, 0.91]
      ]
    }
  ]
};

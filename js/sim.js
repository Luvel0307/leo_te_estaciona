/* =========================================================
   Motor de simulación (sustituye a cámaras + YOLO en el demo)
   Cada zona tiene un arreglo de cajones (true = ocupado).
   En producción, este módulo se reemplazaría por un fetch()
   a la API que publique el modelo de visión artificial.
   ========================================================= */
(function () {
  const CFG = window.LTE_CONFIG;
  const listeners = [];

  const state = {
    modo: "real",          // "real" = hora actual | "manual" = hora elegida
    horaManual: 9,
    ultimaActualizacion: Date.now(),
    historial: [],         // [{t, pct, porZona:{A:pct,...}}]
    zonas: {}
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function horaActual() {
    if (state.modo === "manual") return state.horaManual;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }

  function ocupacionObjetivo(hora, factor) {
    const h0 = Math.floor(hora) % 24, h1 = (h0 + 1) % 24, f = hora - Math.floor(hora);
    const base = CFG.curvaHoraria[h0] * (1 - f) + CFG.curvaHoraria[h1] * f;
    return Math.min(0.985, Math.max(0.01, base * factor));
  }

  function init() {
    const hora = horaActual();
    CFG.zonas.forEach(z => {
      const objetivo = ocupacionObjetivo(hora, z.factorDemanda);
      const cajones = Array.from({ length: z.cajones }, () => Math.random() < objetivo);
      state.zonas[z.id] = { cajones, entradas: 0, salidas: 0, flujo: 0 };
    });
    registrarHistorial();
    // Prellenar historial para que las gráficas no inicien vacías
    for (let i = 0; i < 24; i++) paso(true);
  }

  function paso(silencioso) {
    const hora = horaActual();
    CFG.zonas.forEach(z => {
      const zs = state.zonas[z.id];
      const ocupados = zs.cajones.filter(Boolean).length;
      const objetivo = Math.round(ocupacionObjetivo(hora, z.factorDemanda) * z.cajones);
      const delta = Math.round((objetivo - ocupados) * 0.3 + rand(-2.4, 2.4));
      let entradas = 0, salidas = 0;
      // Rotación natural: algunos llegan y otros se van aunque el total no cambie
      const rotacion = Math.round(rand(0, 2.5) * (ocupados / z.cajones));
      const libres = () => zs.cajones.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
      const llenos = () => zs.cajones.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
      const llenar = n => { const L = libres(); for (let k = 0; k < n && L.length; k++) { const j = L.splice(Math.floor(Math.random() * L.length), 1)[0]; zs.cajones[j] = true; entradas++; } };
      const vaciar = n => { const O = llenos(); for (let k = 0; k < n && O.length; k++) { const j = O.splice(Math.floor(Math.random() * O.length), 1)[0]; zs.cajones[j] = false; salidas++; } };
      vaciar(rotacion); llenar(rotacion);
      if (delta > 0) llenar(delta); else if (delta < 0) vaciar(-delta);
      zs.entradas = entradas; zs.salidas = salidas;
      zs.flujo = entradas + salidas;
    });
    state.ultimaActualizacion = Date.now();
    registrarHistorial();
    if (!silencioso) emit();
  }

  function registrarHistorial() {
    const r = resumen();
    const porZona = {};
    r.zonas.forEach(z => (porZona[z.id] = z.pct));
    state.historial.push({ t: Date.now(), pct: r.pct, porZona });
    if (state.historial.length > 40) state.historial.shift();
  }

  function tiempoBusqueda(disp, total) {
    const ratio = disp / total;
    if (disp >= 15 || ratio > 0.15) return { texto: "1–2 min", nivel: "Bajo", min: 1.5 };
    if (disp >= 8) return { texto: "2–4 min", nivel: "Bajo", min: 3 };
    if (disp >= 3) return { texto: "4–7 min", nivel: "Medio", min: 5.5 };
    return { texto: "7+ min", nivel: "Alto", min: 8 };
  }

  function nivelFlujo(f) {
    if (f >= 6) return "Alto";
    if (f >= 3) return "Medio";
    return "Bajo";
  }

  function resumen() {
    let total = 0, ocupados = 0, flujo = 0;
    const zonas = CFG.zonas.map(z => {
      const zs = state.zonas[z.id];
      const occ = zs.cajones.filter(Boolean).length;
      total += z.cajones; ocupados += occ; flujo += zs.flujo;
      const disp = z.cajones - occ;
      return {
        ...z,
        ocupados: occ,
        disponibles: disp,
        pct: Math.round((occ / z.cajones) * 100),
        cajonesEstado: zs.cajones,
        flujo: nivelFlujo(zs.flujo),
        entradas: zs.entradas,
        salidas: zs.salidas,
        busqueda: tiempoBusqueda(disp, z.cajones)
      };
    });
    const recomendada = zonas.slice().sort((a, b) => (b.disponibles / b.cajones) - (a.disponibles / a.cajones) || b.disponibles - a.disponibles)[0];
    return {
      total, ocupados,
      disponibles: total - ocupados,
      pct: Math.round((ocupados / total) * 1000) / 10,
      flujo: nivelFlujo(flujo / 2),
      zonas, recomendada,
      hora: horaActual(),
      ultimaActualizacion: state.ultimaActualizacion
    };
  }

  function emit() { const r = resumen(); listeners.forEach(fn => fn(r, state)); }

  window.LTE_SIM = {
    state,
    init,
    resumen,
    ocupacionObjetivo,
    onUpdate(fn) { listeners.push(fn); },
    start() { setInterval(() => paso(false), CFG.intervaloActualizacion * 1000); emit(); },
    forzar() { paso(false); },
    setModo(modo, hora) {
      state.modo = modo;
      if (typeof hora === "number") state.horaManual = hora;
      // Al cambiar de hora, converge rápido para que el demo se note
      for (let i = 0; i < 14; i++) paso(true);
      emit();
    }
  };
})();

/* =========================================================
   LEONEL TE ESTACIONA · Interfaz
   ========================================================= */
(function () {
  const CFG = window.LTE_CONFIG;
  const SIM = window.LTE_SIM;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const NS = "http://www.w3.org/2000/svg";
  const zonaPorId = id => CFG.zonas.find(z => z.id === id);

  const ui = {
    zonaSel: null,
    zonaDetalle: null,
    zoomNivel: 1,
    ultimo: null,
    prevCajones: {},
    alertaPrev: null
  };

  /* ---------------- Almacenamiento local seguro ---------------- */
  const store = {
    get(k, def) { try { const v = localStorage.getItem("lte_" + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem("lte_" + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ---------------- Navegación ---------------- */
  const TABS = ["inicio", "mapa", "zonas", "estado", "usuario"];
  function mostrarTab() {
    const t = (location.hash || "#inicio").slice(1);
    const tab = TABS.includes(t) ? t : "inicio";
    TABS.forEach(n => ($("#tab-" + n).hidden = n !== tab));
    $$(".nav a").forEach(a => a.classList.toggle("activo", a.dataset.tab === tab));
    if (tab !== "inicio") window.scrollTo({ top: document.querySelector(".nav").offsetTop, behavior: "smooth" });
  }
  window.addEventListener("hashchange", mostrarTab);
  document.addEventListener("click", e => {
    const g = e.target.closest("[data-goto]");
    if (g) { location.hash = g.dataset.goto; }
  });

  /* ---------------- Toast ---------------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.innerHTML = `<img src="assets/img/leonel.png" alt="" />${msg}`;
    t.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("on"), 3800);
  }

  /* ---------------- Mapa SVG ---------------- */
  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function anilloPath(f) {
    const { cx, cy, r1, r2 } = f;
    return `M${cx - r2},${cy} a${r2},${r2} 0 1,0 ${2 * r2},0 a${r2},${r2} 0 1,0 ${-2 * r2},0 Z ` +
           `M${cx - r1},${cy} a${r1},${r1} 0 1,1 ${2 * r1},0 a${r1},${r1} 0 1,1 ${-2 * r1},0 Z`;
  }

  const VIEWS = ["130 30 540 404", "215 45 340 254", "0 0 220 165"];

  function crearMapa(contenedor, opciones) {
    const svg = el("svg", { viewBox: VIEWS[opciones.zoom || 0], role: "img", "aria-label": "Mapa del campus con zonas de estacionamiento" });
    svg.style.transition = "all .4s";
    el("image", { href: "assets/img/campus-aereo.jpg", x: 0, y: 0, width: 700, height: 524, preserveAspectRatio: "none" }, svg);
    el("rect", { x: 0, y: 0, width: 700, height: 524, fill: "rgba(0,0,0,.08)" }, svg);

    const capas = {};
    CFG.zonas.forEach(z => {
      const g = el("g", { class: "z-grupo", "data-zona": z.id }, svg);
      z.formas.forEach(f => {
        const attrs = { class: "z-forma", fill: z.color, "fill-opacity": .82, stroke: "#fff", "stroke-width": 1.1, "data-zona": z.id };
        if (f.tipo === "poly") el("polygon", { ...attrs, points: f.puntos }, g);
        if (f.tipo === "anillo") el("path", { ...attrs, d: anilloPath(f), "fill-rule": "evenodd" }, g);
      });
      const pin = el("g", { class: "z-pin", "data-zona": z.id, transform: `translate(${z.pin[0]},${z.pin[1]})` }, svg);
      el("circle", { r: 7, fill: z.color, class: "z-pulso" }, pin);
      el("circle", { r: 8.5, fill: "#fff", stroke: z.color, "stroke-width": 2.4 }, pin);
      const t = el("text", { "text-anchor": "middle", y: 3.6, "font-size": 10, fill: "#222" }, pin);
      t.textContent = z.id;
      const badge = el("g", { transform: "translate(8,-11)" }, pin);
      el("rect", { x: 0, y: -6, rx: 5, width: 20, height: 11, fill: "#111", opacity: .85 }, badge);
      const bt = el("text", { x: 10, y: 2.2, "text-anchor": "middle", "font-size": 7.5, fill: "#fff", "font-family": "Montserrat, sans-serif", "font-weight": 700 }, badge);
      capas[z.id] = { g, bt };
    });

    let globo = null;
    if (opciones.globo) {
      globo = el("g", { class: "globo", "pointer-events": "none" }, svg);
    }

    svg.addEventListener("click", e => {
      const n = e.target.closest("[data-zona]");
      if (n) opciones.onZona && opciones.onZona(n.getAttribute("data-zona"));
    });

    contenedor.innerHTML = "";
    contenedor.appendChild(svg);

    return {
      svg,
      setView(vb) { svg.setAttribute("viewBox", vb); },
      update(r, sel) {
        r.zonas.forEach(z => {
          capas[z.id].bt.textContent = z.disponibles;
          $$(".z-forma", capas[z.id].g).forEach(f => f.classList.toggle("sel", z.id === sel));
        });
        if (globo) {
          globo.innerHTML = "";
          const z = r.zonas.find(x => x.id === sel);
          if (!z) return;
          const vb = svg.getAttribute("viewBox").split(" ").map(Number);
          const s = vb[2] / 340; // escala del globo según el zoom
          const w = 70 * s, h = 34 * s;
          let x = z.pin[0] - w / 2, y = z.pin[1] - h - 16 * s;
          if (y < vb[1] + 2) y = z.pin[1] + 16 * s;
          const g = el("g", {}, globo);
          el("rect", { x, y, width: w, height: h, rx: 5 * s, fill: "#fff", stroke: "#222", "stroke-width": .6 * s, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }, g);
          const tail = y < z.pin[1]
            ? `${z.pin[0] - 4 * s},${y + h - .3} ${z.pin[0] + 4 * s},${y + h - .3} ${z.pin[0]},${y + h + 6 * s}`
            : `${z.pin[0] - 4 * s},${y + .3} ${z.pin[0] + 4 * s},${y + .3} ${z.pin[0]},${y - 6 * s}`;
          el("polygon", { points: tail, fill: "#fff" }, g);
          const lines = [[z.nombre, 9, 800], [`${z.disponibles} Disponibles`, 7.2, 600], [`${z.pct}% ocupación`, 7.2, 600]];
          lines.forEach((l, i) => {
            const t = el("text", { x: z.pin[0], y: y + (10 + i * 9.5) * s, "text-anchor": "middle", "font-size": l[1] * s, "font-weight": l[2], fill: i === 0 ? z.color === "#F5D234" ? "#9a7b00" : z.color : "#222" }, g);
            t.textContent = l[0];
          });
        }
      }
    };
  }

  /* ---------------- INICIO ---------------- */
  let mapaInicio, mapaGrande;

  function renderZonasCards(r) {
    const cont = $("#zonas-cards");
    if (!cont.children.length) {
      cont.innerHTML = r.zonas.map(z => `
        <button class="zcard" data-zona="${z.id}">
          <h4><span class="dot" style="background:${z.color}"></span>${z.nombre}</h4>
          <div class="nums">
            <div><b class="js-d">0</b><small>Disponibles</small></div>
            <span class="sep"></span>
            <div><b class="js-p">0%</b><small>Ocupación</small></div>
          </div>
          <span class="barra"><i style="background:${z.color}"></i></span>
        </button>`).join("");
      cont.addEventListener("click", e => {
        const b = e.target.closest(".zcard");
        if (b) { seleccionarZona(b.dataset.zona); location.hash = "mapa"; }
      });
    }
    r.zonas.forEach(z => {
      const c = $(`.zcard[data-zona="${z.id}"]`, cont);
      $(".js-d", c).textContent = z.disponibles;
      $(".js-p", c).textContent = z.pct + "%";
      $(".barra i", c).style.width = z.pct + "%";
    });
  }

  function renderReco(r) {
    const z = r.recomendada;
    $("#reco-zona").textContent = z.nombre;
    $("#reco-texto").textContent = `Es la zona con mayor disponibilidad en este momento (${z.disponibles} lugares) y un tiempo de búsqueda más bajo`;
    $("#reco-flujo").textContent = r.flujo;
    $("#reco-busqueda").textContent = `${z.busqueda.nivel} · ${z.busqueda.texto}`;
    $("#reco-btn").onclick = () => { seleccionarZona(z.id); location.hash = "mapa"; };
  }

  function animarNumero(nodo, valor) {
    const ini = parseInt(nodo.textContent, 10);
    if (isNaN(ini) || ini === valor) { nodo.textContent = valor; return; }
    const t0 = performance.now(), dur = 600;
    (function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      nodo.textContent = Math.round(ini + (valor - ini) * p);
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }

  /* ---------------- MAPA ---------------- */
  function seleccionarZona(id) {
    ui.zonaSel = id;
    ui.zonaDetalle = id;
    if (ui.ultimo) render(ui.ultimo);
    if (ui.zoomNivel === 2) aplicarZoom();
  }

  function aplicarZoom() {
    if (!mapaGrande) return;
    if (ui.zoomNivel === 2) {
      const z = zonaPorId(ui.zonaSel);
      const w = 220, h = 165;
      const x = Math.max(0, Math.min(700 - w, z.pin[0] - w / 2));
      const y = Math.max(0, Math.min(524 - h, z.pin[1] - h / 2 + 20));
      mapaGrande.setView(`${x} ${y} ${w} ${h}`);
    } else {
      mapaGrande.setView(VIEWS[ui.zoomNivel]);
    }
    if (ui.ultimo) mapaGrande.update(ui.ultimo, ui.zonaSel);
  }

  function renderMapaTab(r) {
    const z = r.zonas.find(x => x.id === ui.zonaSel);
    const chip = $("#chip-zona");
    $(".dot", chip).style.background = z.color;
    $(".chip-tit b", chip).textContent = z.nombre;
    $(".js-d", chip).textContent = z.disponibles;
    $(".js-p", chip).textContent = z.pct + "%";
    const bi = $(".barra i", chip); bi.style.width = z.pct + "%"; bi.style.background = z.color;
    $("#mb-busqueda").textContent = z.busqueda.texto;
    $("#mb-ruta").textContent = (z.minutosDesdeAcceso || 3) + " min";
    $$("#leyenda button").forEach(b => b.classList.toggle("sel", b.dataset.zona === z.id));
    mapaGrande.update(r, ui.zonaSel);
  }

  function initBuscador() {
    const input = $("#buscar"), lista = $("#sugerencias");
    let idx = -1, items = [];
    const opciones = [
      ...CFG.zonas.map(z => ({ nombre: z.nombre, zona: z.id, extra: z.descripcion })),
      ...CFG.lugares.map(l => ({ nombre: l.nombre, zona: l.zona, extra: "Zona " + l.zona + " más cercana" }))
    ];
    const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    function pintar() {
      const q = norm(input.value.trim());
      items = opciones.filter(o => !q || norm(o.nombre).includes(q) || norm(o.extra).includes(q)).slice(0, 7);
      lista.innerHTML = items.length
        ? items.map((o, i) => `<li data-i="${i}" class="${i === idx ? "act" : ""}">${o.nombre}<span>${o.extra}</span></li>`).join("")
        : `<li>Sin resultados<span>Prueba “E3” o “Zona B”</span></li>`;
      lista.hidden = false;
    }
    function elegir(o) {
      if (!o) return;
      input.value = o.nombre;
      lista.hidden = true;
      $("#buscar-sel").textContent = "→ Zona " + o.zona;
      seleccionarZona(o.zona);
      const z = ui.ultimo.zonas.find(x => x.id === o.zona);
      toast(`${o.nombre}: ${z.nombre} tiene <b>&nbsp;${z.disponibles} lugares&nbsp;</b> libres`);
    }
    input.addEventListener("focus", () => { idx = -1; pintar(); });
    input.addEventListener("input", () => { idx = -1; pintar(); });
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { idx = Math.min(items.length - 1, idx + 1); pintar(); e.preventDefault(); }
      if (e.key === "ArrowUp") { idx = Math.max(0, idx - 1); pintar(); e.preventDefault(); }
      if (e.key === "Enter") { elegir(items[Math.max(0, idx)]); input.blur(); }
      if (e.key === "Escape") { lista.hidden = true; input.blur(); }
    });
    lista.addEventListener("mousedown", e => {
      const li = e.target.closest("li[data-i]");
      if (li) elegir(items[+li.dataset.i]);
    });
    input.addEventListener("blur", () => setTimeout(() => (lista.hidden = true), 150));
  }

  /* ---------------- ZONAS ---------------- */
  function renderZonasTab(r) {
    const seg = $("#seg-zonas");
    if (!seg.children.length) {
      seg.innerHTML = r.zonas.map(z => `<button data-zona="${z.id}"><span class="dot" style="background:${z.color}"></span>${z.nombre}</button>`).join("");
      seg.addEventListener("click", e => {
        const b = e.target.closest("button");
        if (b) { ui.zonaDetalle = b.dataset.zona; renderZonasTab(ui.ultimo); }
      });
    }
    $$("button", seg).forEach(b => b.classList.toggle("sel", b.dataset.zona === ui.zonaDetalle));

    const z = r.zonas.find(x => x.id === ui.zonaDetalle);
    const cont = $("#zona-detalle");
    if (cont.dataset.zona !== z.id) {
      cont.dataset.zona = z.id;
      cont.innerHTML = `
        <div class="zd-info">
          <h3><span class="dot" style="background:${z.color};width:34px;height:34px"></span>${z.nombre}</h3>
          <p>${z.descripcion}</p>
          <div class="zd-stats">
            <div><b class="js-d"></b><span>Disponibles</span></div>
            <div><b class="js-p"></b><span>Ocupación</span></div>
            <div><b class="js-f"></b><span>Flujo vehicular</span></div>
            <div><b class="js-b"></b><span>Búsqueda estimada</span></div>
          </div>
        </div>
        <div class="zd-cajones">
          <h4>${z.cajones} cajones monitoreados <small><span><i style="background:var(--verde)"></i>Libre</span><span><i style="background:#d7372f"></i>Ocupado</span></small></h4>
          <div class="cajones-grid">${z.cajonesEstado.map((o, i) => `<span class="cajon" title="${z.id}-${String(i + 1).padStart(3, "0")}"></span>`).join("")}</div>
        </div>`;
      ui.prevCajones[z.id] = null;
    }
    $(".js-d", cont).textContent = z.disponibles;
    $(".js-p", cont).textContent = z.pct + "%";
    $(".js-f", cont).textContent = z.flujo;
    $(".js-b", cont).textContent = z.busqueda.texto;
    const prev = ui.prevCajones[z.id];
    $$(".cajon", cont).forEach((c, i) => {
      const oc = z.cajonesEstado[i];
      c.classList.toggle("oc", oc);
      if (prev && prev[i] !== oc) { c.classList.remove("cambio"); void c.offsetWidth; c.classList.add("cambio"); }
    });
    ui.prevCajones[z.id] = z.cajonesEstado.slice();
  }

  function initCamaras() {
    const cont = $("#cams");
    cont.innerHTML = CFG.camaras.map(c => {
      const prom = Math.round(c.detecciones.reduce((a, d) => a + d[4], 0) / c.detecciones.length * 100);
      return `
      <figure class="cam">
        <div class="cam-vista">
          <img src="${c.imagen}" alt="${c.nombre}" loading="lazy" />
          ${c.detecciones.map(d => `<div class="det" style="left:${d[0]}%;top:${d[1]}%;width:${d[2]}%;height:${d[3]}%"><span>auto ${d[4].toFixed(2)}</span></div>`).join("")}
          <div class="scan"></div>
          <div class="cam-hud"><span class="rec">${c.id} · DEMO</span><span class="js-reloj"></span></div>
        </div>
        <figcaption class="cam-pie"><span>${c.nombre}</span><span><b>${c.detecciones.length}</b> vehículos · conf. media <b>${prom}%</b></span></figcaption>
      </figure>`;
    }).join("");
    $("#toggle-det").addEventListener("change", e => cont.classList.toggle("sin-det", !e.target.checked));
  }

  /* ---------------- ESTADO ---------------- */
  function renderGauge(r) {
    const pct = r.pct / 100;
    const ang = Math.PI * pct;
    const x = 150 - 110 * Math.cos(ang), y = 150 - 110 * Math.sin(ang);
    const color = pct > .9 ? "#e01b1b" : pct > .75 ? "#ff5a00" : "#2fbf4a";
    $("#gauge").innerHTML = `
      <svg viewBox="0 0 300 175">
        <path d="M40 150 A110 110 0 0 1 260 150" fill="none" stroke="#3b3b3b" stroke-width="26" stroke-linecap="round"/>
        <path d="M40 150 A110 110 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="26" stroke-linecap="round"/>
        <text x="150" y="132" text-anchor="middle" font-size="46" fill="#fff" font-family="Titan One, sans-serif">${r.pct}%</text>
        <text x="150" y="165" text-anchor="middle" font-size="13" fill="#ddd" font-family="Montserrat, sans-serif">${r.ocupados} de ${r.total} cajones ocupados</text>
      </svg>`;
    $("#st-entradas").textContent = r.zonas.reduce((a, z) => a + z.entradas, 0);
    $("#st-salidas").textContent = r.zonas.reduce((a, z) => a + z.salidas, 0);
  }

  function renderTendencia() {
    const H = SIM.state.historial;
    const W = 520, Ht = 200, P = { l: 34, r: 10, t: 10, b: 22 };
    const xs = i => P.l + (i / Math.max(1, H.length - 1)) * (W - P.l - P.r);
    const ys = v => P.t + (1 - v / 100) * (Ht - P.t - P.b);
    let s = `<svg viewBox="0 0 ${W} ${Ht}">`;
    [0, 25, 50, 75, 100].forEach(v => {
      s += `<line x1="${P.l}" x2="${W - P.r}" y1="${ys(v)}" y2="${ys(v)}" stroke="#ffffff1c"/>`;
      s += `<text x="${P.l - 6}" y="${ys(v) + 4}" text-anchor="end" font-size="10" fill="#bbb">${v}%</text>`;
    });
    const series = [{ id: "total", color: "#fff", w: 3, get: h => h.pct }].concat(CFG.zonas.map(z => ({ id: z.id, color: z.color, w: 2, get: h => h.porZona[z.id] })));
    series.forEach(se => {
      const pts = H.map((h, i) => `${xs(i).toFixed(1)},${ys(se.get(h)).toFixed(1)}`).join(" ");
      s += `<polyline points="${pts}" fill="none" stroke="${se.color}" stroke-width="${se.w}" stroke-linejoin="round" stroke-linecap="round" ${se.id === "total" ? 'stroke-dasharray="5 4"' : ""}/>`;
    });
    s += `<text x="${W - P.r}" y="${Ht - 4}" text-anchor="end" font-size="10" fill="#bbb">ahora</text>`;
    s += `<text x="${P.l}" y="${Ht - 4}" font-size="10" fill="#bbb">−${Math.round((H.length - 1) * CFG.intervaloActualizacion / 60)} min</text>`;
    $("#chart-tendencia").innerHTML = s + "</svg>";
    if (!$("#leyenda-tend").children.length) {
      $("#leyenda-tend").innerHTML = `<span><i style="background:#fff"></i>Total</span>` + CFG.zonas.map(z => `<span><i style="background:${z.color}"></i>${z.nombre}</span>`).join("");
    }
  }

  function renderHoras(r) {
    const W = 1000, Ht = 240, P = { l: 40, r: 10, t: 16, b: 28 };
    const horas = []; for (let h = 6; h <= 22; h++) horas.push(h);
    const bw = (W - P.l - P.r) / horas.length;
    const ys = v => P.t + (1 - v) * (Ht - P.t - P.b);
    const hAct = Math.floor(r.hora);
    let s = `<svg viewBox="0 0 ${W} ${Ht}">`;
    [0, .5, 1].forEach(v => {
      s += `<line x1="${P.l}" x2="${W - P.r}" y1="${ys(v)}" y2="${ys(v)}" stroke="#ffffff1c"/>`;
      s += `<text x="${P.l - 6}" y="${ys(v) + 4}" text-anchor="end" font-size="12" fill="#bbb">${v * 100}%</text>`;
    });
    horas.forEach((h, i) => {
      const v = CFG.curvaHoraria[h];
      const x = P.l + i * bw + bw * .15, w = bw * .7;
      const act = h === hAct;
      const pico = h >= 7 && h <= 10;
      s += `<rect x="${x}" y="${ys(v)}" width="${w}" height="${ys(0) - ys(v)}" rx="6" fill="${act ? "#ff5a00" : pico ? "#8a8a8a" : "#6b6b6b"}"/>`;
      if (act) s += `<text x="${x + w / 2}" y="${ys(v) - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#ff7a2e">ahora</text>`;
      s += `<text x="${x + w / 2}" y="${Ht - 8}" text-anchor="middle" font-size="12" fill="${act ? "#ff7a2e" : "#ccc"}">${h}h</text>`;
    });
    $("#chart-horas").innerHTML = s + "</svg>";
  }

  function initSimulador() {
    const slider = $("#hora-slider"), out = $("#hora-out");
    const fmt = h => `${Math.floor(h)}:${h % 1 ? "30" : "00"}`;
    const aplicar = () => {
      const modo = $('input[name="modo"]:checked').value;
      slider.disabled = modo === "real";
      out.textContent = modo === "real" ? "Ahora" : fmt(+slider.value);
      SIM.setModo(modo, +slider.value);
    };
    $$('input[name="modo"]').forEach(r => r.addEventListener("change", aplicar));
    slider.addEventListener("input", () => (out.textContent = fmt(+slider.value)));
    slider.addEventListener("change", aplicar);
    $$(".sim-presets button").forEach(b => b.addEventListener("click", () => {
      $('input[name="modo"][value="manual"]').checked = true;
      slider.value = b.dataset.h;
      aplicar();
      toast(`Simulando las ${fmt(+b.dataset.h)} h`);
    }));
    $("#btn-forzar").addEventListener("click", () => SIM.forzar());
    out.textContent = "Ahora";
    $("#st-intervalo").textContent = `${CFG.intervaloActualizacion} s · meta ≤ 10 s`;
  }

  /* ---------------- USUARIO ---------------- */
  function initUsuario() {
    const p = store.get("perfil", { nombre: "", tipo: "Estudiante", destino: CFG.lugares[0].nombre, alerta: false });
    const sel = $("#u-destino");
    sel.innerHTML = CFG.lugares.map(l => `<option>${l.nombre}</option>`).join("");
    $("#u-nombre").value = p.nombre;
    $("#u-tipo").value = p.tipo;
    sel.value = p.destino;
    $("#u-alerta").checked = p.alerta;
    pintarSaludo(p);
    $("#form-perfil").addEventListener("submit", e => {
      e.preventDefault();
      const np = { nombre: $("#u-nombre").value.trim(), tipo: $("#u-tipo").value, destino: sel.value, alerta: $("#u-alerta").checked };
      store.set("perfil", np);
      pintarSaludo(np);
      if (ui.ultimo) renderUsuario(ui.ultimo);
      toast("Perfil guardado en este dispositivo");
    });
  }
  function perfil() { return store.get("perfil", { nombre: "", tipo: "Estudiante", destino: CFG.lugares[0].nombre, alerta: false }); }
  function pintarSaludo(p) { $("#saludo").textContent = p.nombre ? `¡Hola, ${p.nombre}!` : "¡Hola!"; }

  function renderUsuario(r) {
    const p = perfil();
    const lugar = CFG.lugares.find(l => l.nombre === p.destino) || CFG.lugares[0];
    const cercana = r.zonas.find(z => z.id === lugar.zona);
    let html;
    if (cercana.disponibles >= 5) {
      html = `<small>Para llegar a ${lugar.nombre}</small><b>${cercana.nombre}</b><p>${cercana.disponibles} lugares libres · búsqueda ${cercana.busqueda.texto}. Es la más cercana a tu destino.</p>`;
    } else {
      const alt = r.recomendada;
      html = `<small>Para llegar a ${lugar.nombre}</small><b>${alt.nombre}</b><p>${cercana.nombre} está casi llena (${cercana.disponibles} libres). Te conviene ${alt.nombre}: ${alt.disponibles} lugares y ${alt.minutosDesdeAcceso || 3} min desde el acceso.</p>`;
    }
    $("#u-reco").innerHTML = html;

    // Alerta
    if (p.alerta) {
      const baja = cercana.disponibles < 5;
      if (baja && ui.alertaPrev === false) toast(`Aviso: ${cercana.nombre} tiene solo ${cercana.disponibles} lugares`);
      ui.alertaPrev = baja;
    } else ui.alertaPrev = null;
    if (p.alerta && ui.alertaPrev === null) ui.alertaPrev = cercana.disponibles < 5;
  }

  /* ---------------- Ciclo de render ---------------- */
  function render(r) {
    ui.ultimo = r;
    if (!ui.zonaSel) { ui.zonaSel = r.recomendada.id; ui.zonaDetalle = r.recomendada.id; }
    animarNumero($("#kpi-total"), r.total);
    animarNumero($("#kpi-ocupados"), r.ocupados);
    animarNumero($("#kpi-disp"), r.disponibles);
    mapaInicio.update(r, null);
    renderZonasCards(r);
    renderReco(r);
    renderMapaTab(r);
    renderZonasTab(r);
    renderGauge(r);
    renderTendencia();
    renderHoras(r);
    renderUsuario(r);
  }

  function tickReloj() {
    const s = Math.max(0, Math.round((Date.now() - SIM.state.ultimaActualizacion) / 1000));
    $$(".js-hace").forEach(n => (n.textContent = `Hace ${s} s`));
    const now = new Date();
    const hhmmss = now.toLocaleTimeString("es-MX", { hour12: false });
    $$(".js-reloj").forEach(n => (n.textContent = hhmmss));
  }

  /* ---------------- Arranque ---------------- */
  function init() {
    mapaInicio = crearMapa($("#mapa-inicio"), {
      zoom: 0,
      onZona: id => { seleccionarZona(id); location.hash = "mapa"; }
    });
    mapaGrande = crearMapa($("#mapa-grande"), { zoom: 1, globo: true, onZona: id => seleccionarZona(id) });
    $("#leyenda").innerHTML = CFG.zonas.map(z => `<button data-zona="${z.id}"><span class="dot" style="background:${z.color}"></span>${z.nombre}</button>`).join("");
    $("#leyenda").addEventListener("click", e => { const b = e.target.closest("button"); if (b) seleccionarZona(b.dataset.zona); });
    $("#zoom-in").addEventListener("click", () => { ui.zoomNivel = Math.min(2, ui.zoomNivel + 1); aplicarZoom(); });
    $("#zoom-out").addEventListener("click", () => { ui.zoomNivel = Math.max(0, ui.zoomNivel - 1); aplicarZoom(); });
    $("#chip-zona").addEventListener("click", () => { location.hash = "zonas"; });
    $("#como-llegar").href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("Universidad Anáhuac Córdoba-Orizaba");

    initBuscador();
    initCamaras();
    initSimulador();
    initUsuario();

    SIM.init();
    SIM.onUpdate(render);
    SIM.start();
    mostrarTab();
    setInterval(tickReloj, 1000);
    tickReloj();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

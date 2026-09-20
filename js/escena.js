import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CONFIG } from "./config.js";

// Detección de dispositivo móvil para optimización de rendimiento
const esMovil = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) || window.innerWidth < 768;

const contenedor = document.getElementById("escena");
const escena = new THREE.Scene();

// Espacio cósmico profundo y elegante
escena.background = new THREE.Color(0x020207);
escena.fog = new THREE.FogExp2(0x020208, 0.0028);

const camara = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camara.position.set(0, 36, 75);

const renderizador = new THREE.WebGLRenderer({
  antialias: !esMovil, // Desactivar antialias pesado en móviles para 60 FPS estables
  alpha: true,
  powerPreference: "high-performance"
});

// En celulares limitamos el pixelRatio a 1.5 para ahorrar batería y GPU
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, esMovil ? 1.5 : 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.toneMapping = THREE.ACESFilmicToneMapping;
renderizador.toneMappingExposure = 1.0;
contenedor.appendChild(renderizador.domElement);

// Luces
escena.add(new THREE.AmbientLight(0xffffff, 0.85));
const luzSolar = new THREE.PointLight(0xffeedd, 3.8, 140);
escena.add(luzSolar);

// ==================================================
// 1. NEBULOSAS SUTILES DE FONDO (OPTIMIZADAS)
// ==================================================
function crearTexturaNebulosaSuave(colorCentro, colorBorde) {
  const canvas = document.createElement("canvas");
  canvas.width = 256; // 256px optimizado para menor consumo de VRAM
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const centroX = 128;
  const centroY = 128;
  const radio = 120;

  const grad = ctx.createRadialGradient(centroX, centroY, 0, centroX, centroY, radio);
  grad.addColorStop(0, colorCentro);
  grad.addColorStop(0.4, colorCentro);
  grad.addColorStop(0.75, colorBorde);
  grad.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const numManchas = esMovil ? 6 : 10;
  for (let i = 0; i < numManchas; i++) {
    const rx = 70 + Math.random() * 115;
    const ry = 70 + Math.random() * 115;
    const rrad = 25 + Math.random() * 45;
    const subGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rrad);
    subGrad.addColorStop(0, colorCentro);
    subGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = subGrad;
    ctx.beginPath();
    ctx.arc(rx, ry, rrad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const grupoNebulosas = new THREE.Group();

const coloresNebulosas = [
  { centro: "rgba(110, 45, 170, 0.22)", borde: "rgba(35, 12, 85, 0.05)" },
  { centro: "rgba(25, 95, 190, 0.20)", borde: "rgba(8, 28, 90, 0.04)" },
  { centro: "rgba(180, 60, 115, 0.18)", borde: "rgba(70, 15, 45, 0.04)" },
  { centro: "rgba(40, 140, 150, 0.17)", borde: "rgba(12, 50, 70, 0.03)" }
];

const nubesPorTipo = esMovil ? 3 : 5;
coloresNebulosas.forEach((paleta) => {
  const textura = crearTexturaNebulosaSuave(paleta.centro, paleta.borde);
  const material = new THREE.SpriteMaterial({
    map: textura,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.35
  });

  for (let i = 0; i < nubesPorTipo; i++) {
    const nube = new THREE.Sprite(material);
    const dist = 58 + Math.random() * 65;
    const angulo = Math.random() * Math.PI * 2;
    const altura = (Math.random() - 0.5) * 45;

    nube.position.set(
      Math.cos(angulo) * dist,
      altura,
      Math.sin(angulo) * dist
    );

    const tamano = 48 + Math.random() * 35;
    nube.scale.set(tamano, tamano, 1);
    grupoNebulosas.add(nube);
  }
});
escena.add(grupoNebulosas);

// ==================================================
// 2. CONSTELACIONES CÓSMICAS
// ==================================================
const grupoConstelaciones = new THREE.Group();

const esquemasConstelaciones = [
  [
    [-35, 24, -45], [-32, 18, -48], [-28, 12, -44],
    [-38, 30, -42], [-24, 32, -46],
    [-40, 6, -42],  [-22, 4, -48]
  ],
  [
    [32, 28, -50], [38, 33, -48], [44, 27, -52], [50, 31, -49], [55, 25, -51]
  ],
  [
    [-45, -15, 35], [-38, -12, 40], [-30, -14, 38], [-22, -18, 36],
    [-18, -25, 34], [-26, -26, 36], [-30, -14, 38]
  ],
  [
    [28, -18, -40], [33, -12, -42], [39, -15, -45],
    [35, -23, -43], [28, -28, -40], [21, -23, -37],
    [17, -15, -35], [23, -12, -38], [28, -18, -40]
  ]
];

const matLineasConstelacion = new THREE.LineBasicMaterial({
  color: 0x88bbff,
  transparent: true,
  opacity: 0.28
});

const matPuntoConstelacion = new THREE.PointsMaterial({
  color: 0xe6f2ff,
  size: 0.65,
  transparent: true,
  opacity: 0.75,
  blending: THREE.AdditiveBlending
});

esquemasConstelaciones.forEach((puntos) => {
  const puntosVector = puntos.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const geoLineas = new THREE.BufferGeometry().setFromPoints(puntosVector);
  const lineas = new THREE.Line(geoLineas, matLineasConstelacion);
  grupoConstelaciones.add(lineas);

  const geoPuntos = new THREE.BufferGeometry().setFromPoints(puntosVector);
  const nodos = new THREE.Points(geoPuntos, matPuntoConstelacion);
  grupoConstelaciones.add(nodos);
});
escena.add(grupoConstelaciones);

// ==================================================
// 3. POLVO ESTELAR DE FONDO
// ==================================================
const geoPolvoEstrellas = new THREE.BufferGeometry();
const cantPolvo = esMovil ? 450 : 800;
const posPolvo = new Float32Array(cantPolvo * 3);
const coloresPolvo = new Float32Array(cantPolvo * 3);

for (let i = 0; i < cantPolvo; i++) {
  const radio = 42 + Math.random() * 95;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);

  posPolvo[i * 3] = radio * Math.sin(phi) * Math.cos(theta);
  posPolvo[i * 3 + 1] = radio * Math.sin(phi) * Math.sin(theta);
  posPolvo[i * 3 + 2] = radio * Math.cos(phi);

  const tono = Math.random();
  if (tono > 0.6) {
    coloresPolvo[i * 3] = 0.85; coloresPolvo[i * 3 + 1] = 0.9; coloresPolvo[i * 3 + 2] = 1.0;
  } else if (tono > 0.3) {
    coloresPolvo[i * 3] = 1.0; coloresPolvo[i * 3 + 1] = 0.85; coloresPolvo[i * 3 + 2] = 0.95;
  } else {
    coloresPolvo[i * 3] = 0.75; coloresPolvo[i * 3 + 1] = 0.85; coloresPolvo[i * 3 + 2] = 0.95;
  }
}

geoPolvoEstrellas.setAttribute("position", new THREE.BufferAttribute(posPolvo, 3));
geoPolvoEstrellas.setAttribute("color", new THREE.BufferAttribute(coloresPolvo, 3));

const matPolvo = new THREE.PointsMaterial({
  size: 0.16,
  vertexColors: true,
  transparent: true,
  opacity: 0.55,
  blending: THREE.AdditiveBlending
});
const polvoEstelar = new THREE.Points(geoPolvoEstrellas, matPolvo);
escena.add(polvoEstelar);

// ==================================================
// 4. ROSAS BLANCAS PROCEDURALES EN EL ESPACIO
// ==================================================
function crearTexturaRosaBlancaEquilibrada() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.font = "84px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🌹", 64, 64);

  const imgData = ctx.getImageData(0, 0, 128, 128);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 15) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.min(255, data[i + 3] * 1.15);
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const canvasFinal = document.createElement("canvas");
  canvasFinal.width = 128;
  canvasFinal.height = 128;
  const ctxFinal = canvasFinal.getContext("2d");

  ctxFinal.shadowColor = "#ffffff";
  ctxFinal.shadowBlur = 14;
  ctxFinal.drawImage(canvas, 0, 0);

  const texture = new THREE.CanvasTexture(canvasFinal);
  texture.needsUpdate = true;
  return texture;
}

const texturaRosa = crearTexturaRosaBlancaEquilibrada();
const materialRosa = new THREE.SpriteMaterial({
  map: texturaRosa,
  color: 0xffffff,
  transparent: true,
  opacity: 0.92
});

const grupoRosas = new THREE.Group();
const rosasArray = [];
const numRosas = CONFIG.cantidadEstrellas || (esMovil ? 90 : 150);

for (let i = 0; i < numRosas; i++) {
  const sprite = new THREE.Sprite(materialRosa);
  
  const radio = 34 + Math.random() * 85;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);

  sprite.position.x = radio * Math.sin(phi) * Math.cos(theta);
  sprite.position.y = (radio * Math.sin(phi) * Math.sin(theta)) * 0.72;
  sprite.position.z = radio * Math.cos(phi);

  const escala = 1.3 + Math.random() * 1.0;
  sprite.scale.set(escala, escala, 1);

  sprite.userData = {
    esRosa: true,
    rotacionVel: (Math.random() - 0.5) * 0.005
  };

  grupoRosas.add(sprite);
  rosasArray.push(sprite);
}
escena.add(grupoRosas);

// ==================================================
// 5. SOL Y PLANETAS
// ==================================================
const cargadorTexturas = new THREE.TextureLoader();
cargadorTexturas.setCrossOrigin("anonymous");

// Sol
const texturaSol = cargadorTexturas.load(CONFIG.sol.textura);
const sol = new THREE.Mesh(
  new THREE.SphereGeometry(CONFIG.sol.radio, esMovil ? 24 : 32, esMovil ? 24 : 32),
  new THREE.MeshBasicMaterial({
    map: texturaSol,
    color: 0xffb338
  })
);
sol.userData = { ...CONFIG.sol };
escena.add(sol);

// Halo de resplandor
const matHaloSol = new THREE.SpriteMaterial({
  map: crearTexturaNebulosaSuave("rgba(255, 175, 50, 0.40)", "rgba(255, 100, 10, 0.05)"),
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 0.45
});
const haloSol = new THREE.Sprite(matHaloSol);
haloSol.scale.set(CONFIG.sol.radio * 2.8, CONFIG.sol.radio * 2.8, 1);
sol.add(haloSol);

// Planetas
const planetasMeshes = [];
CONFIG.planetas.forEach((datos) => {
  const texturaPlaneta = cargadorTexturas.load(datos.textura);
  const malla = new THREE.Mesh(
    new THREE.SphereGeometry(datos.radio, esMovil ? 20 : 32, esMovil ? 20 : 32),
    new THREE.MeshStandardMaterial({
      map: texturaPlaneta,
      color: datos.colorFallback,
      roughness: 0.7,
      metalness: 0.1
    })
  );
  malla.userData = datos;
  escena.add(malla);
  planetasMeshes.push(malla);

  // Anillos de Saturno
  if (datos.tieneAnillo) {
    const geometriaAnillo = new THREE.RingGeometry(datos.radio + 0.3, datos.radio + 1.2, esMovil ? 36 : 64);
    const materialAnillo = new THREE.MeshBasicMaterial({
      color: 0xe6dac3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const anillo = new THREE.Mesh(geometriaAnillo, materialAnillo);
    anillo.rotation.x = Math.PI / 2;
    malla.add(anillo);
  }

  // Guía de Órbita
  const geometriaOrbita = new THREE.RingGeometry(datos.distancia - 0.065, datos.distancia + 0.065, esMovil ? 64 : 128);
  const materialOrbita = new THREE.MeshBasicMaterial({
    color: 0xc8e0ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending
  });
  const orbita = new THREE.Mesh(geometriaOrbita, materialOrbita);
  orbita.rotation.x = Math.PI / 2;
  escena.add(orbita);
});

// ==================================================
// 6. CONTROLES E INTERACCIÓN
// ==================================================
const controles = new OrbitControls(camara, renderizador.domElement);
controles.enableDamping = true;
controles.dampingFactor = 0.05;
controles.maxDistance = 160;

const raycaster = new THREE.Raycaster();
const raton = new THREE.Vector2();

// Elementos DOM
const infoPanel = document.getElementById("info-planeta");
const tarjetaInner = document.getElementById("tarjeta-inner");
const infoTitulo = document.getElementById("info-titulo");
const infoDesc = document.getElementById("info-desc");
const infoVideo = document.getElementById("info-video");
const infoMensaje = document.getElementById("info-mensaje");
const btnGirarFrente = document.getElementById("btn-girar-frente");
const btnGirarAtras = document.getElementById("btn-girar-atras");
const botonesCerrar = document.querySelectorAll(".btn-cerrar-accion");

const modalPalabra = document.getElementById("modal-palabra");
const textoPalabraModal = document.getElementById("texto-palabra-modal");
const btnCerrarModal = document.getElementById("cerrar-modal-palabra");
const contenedorFlotantes = document.getElementById("contenedor-palabras-flotantes");

if (btnCerrarModal) {
  btnCerrarModal.addEventListener("click", () => {
    modalPalabra.hidden = true;
  });
}

if (btnGirarFrente) {
  btnGirarFrente.addEventListener("click", (e) => {
    e.stopPropagation();
    tarjetaInner.classList.add("girada");
  });
}

if (btnGirarAtras) {
  btnGirarAtras.addEventListener("click", (e) => {
    e.stopPropagation();
    tarjetaInner.classList.remove("girada");
  });
}

botonesCerrar.forEach((btn) => {
  btn.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    ocultarTarjeta();
  });
});

function obtenerPalabraAleatoria() {
  const lista = CONFIG.palabrasBonitas || ["Amor", "Magia", "Luz", "Sonrisa", "Universo"];
  const indice = Math.floor(Math.random() * lista.length);
  return lista[indice];
}

function mostrarPalabraFlotante(palabra, x, y) {
  const elemento = document.createElement("div");
  elemento.className = "palabra-flotante-pop";
  elemento.textContent = palabra;
  elemento.style.left = `${x}px`;
  elemento.style.top = `${y}px`;

  contenedorFlotantes.appendChild(elemento);

  setTimeout(() => {
    elemento.remove();
  }, 2500);
}

function mostrarModalPalabra(palabra) {
  if (textoPalabraModal && modalPalabra) {
    textoPalabraModal.textContent = palabra;
    modalPalabra.hidden = false;

    clearTimeout(window._timeoutPalabra);
    window._timeoutPalabra = setTimeout(() => {
      modalPalabra.hidden = true;
    }, 4500);
  }
}

// ==================================================
// 7. PANTALLA COMPLETA
// ==================================================
const btnFullscreen = document.getElementById("btn-fullscreen");

function toggleFullscreen() {
  const doc = document;
  const docEl = doc.documentElement;

  const requestFullscreen = docEl.requestFullscreen ||
                            docEl.webkitRequestFullscreen ||
                            docEl.mozRequestFullScreen ||
                            docEl.msRequestFullscreen;

  const exitFullscreen = doc.exitFullscreen ||
                         doc.webkitExitFullscreen ||
                         doc.mozCancelFullScreen ||
                         doc.msExitFullscreen;

  const fullscreenElement = doc.fullscreenElement ||
                            doc.webkitFullscreenElement ||
                            doc.mozFullScreenElement ||
                            doc.msFullscreenElement;

  if (!fullscreenElement) {
    if (requestFullscreen) {
      requestFullscreen.call(docEl).catch(console.warn);
    }
  } else {
    if (exitFullscreen) {
      exitFullscreen.call(doc).catch(console.warn);
    }
  }
}

function actualizarIconoFullscreen() {
  const fullscreenElement = document.fullscreenElement ||
                            document.webkitFullscreenElement ||
                            document.mozFullScreenElement ||
                            document.msFullscreenElement;

  if (btnFullscreen) {
    btnFullscreen.innerHTML = fullscreenElement ? "<span>✕</span>" : "<span>⛶</span>";
  }
}

if (btnFullscreen) {
  btnFullscreen.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });
}

document.addEventListener("fullscreenchange", actualizarIconoFullscreen);
document.addEventListener("webkitfullscreenchange", actualizarIconoFullscreen);
document.addEventListener("mozfullscreenchange", actualizarIconoFullscreen);
document.addEventListener("MSFullscreenChange", actualizarIconoFullscreen);

// ==================================================
// 8. REPRODUCTOR MUSICAL SIN REPETIR
// ==================================================
const audioFondo = new Audio();
audioFondo.preload = "auto";

const panelMusica = document.getElementById("reproductor-musica");
const musicaTitulo = document.getElementById("musica-titulo");
const musicaArtista = document.getElementById("musica-artista");
const btnMusicaPlay = document.getElementById("btn-musica-play");
const btnMusicaPrev = document.getElementById("btn-musica-prev");
const btnMusicaNext = document.getElementById("btn-musica-next");

const listaCanciones = CONFIG.canciones && CONFIG.canciones.length > 0
  ? CONFIG.canciones
  : [{ titulo: "Love Story", artista: "Indila", ruta: "./assets/Indila - Love Story.mp3" }];

let ordenReproduccion = [];
let indiceOrdenActual = 0;
let pausadoPorVideo = false;

function barajarCanciones() {
  ordenReproduccion = Array.from({ length: listaCanciones.length }, (_, i) => i);
  for (let i = ordenReproduccion.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordenReproduccion[i], ordenReproduccion[j]] = [ordenReproduccion[j], ordenReproduccion[i]];
  }
  indiceOrdenActual = 0;
}

function cargarCancion(indiceEnOrden, reproducirInmediatamente = false) {
  if (listaCanciones.length === 0) return;

  const indiceCancion = ordenReproduccion[indiceEnOrden];
  const cancion = listaCanciones[indiceCancion];

  musicaTitulo.textContent = cancion.titulo;
  musicaArtista.textContent = cancion.artista;
  audioFondo.src = cancion.ruta;
  audioFondo.load();

  if (reproducirInmediatamente) {
    audioFondo.play().catch(() => {});
  }
}

function siguienteCancion() {
  indiceOrdenActual++;
  if (indiceOrdenActual >= ordenReproduccion.length) {
    barajarCanciones();
  }
  cargarCancion(indiceOrdenActual, !audioFondo.paused);
}

function anteriorCancion() {
  indiceOrdenActual--;
  if (indiceOrdenActual < 0) {
    indiceOrdenActual = ordenReproduccion.length - 1;
  }
  cargarCancion(indiceOrdenActual, !audioFondo.paused);
}

barajarCanciones();
cargarCancion(0, false);

btnMusicaPlay.addEventListener("click", (e) => {
  e.stopPropagation();
  if (audioFondo.paused) {
    pausadoPorVideo = false;
    audioFondo.play().catch(console.warn);
  } else {
    audioFondo.pause();
  }
});

btnMusicaNext.addEventListener("click", (e) => {
  e.stopPropagation();
  siguienteCancion();
});

btnMusicaPrev.addEventListener("click", (e) => {
  e.stopPropagation();
  anteriorCancion();
});

audioFondo.addEventListener("play", () => {
  panelMusica.classList.add("reproduciendo");
  btnMusicaPlay.textContent = "⏸";
});

audioFondo.addEventListener("pause", () => {
  panelMusica.classList.remove("reproduciendo");
  btnMusicaPlay.textContent = "►";
});

audioFondo.addEventListener("ended", () => {
  siguienteCancion();
  audioFondo.play().catch(() => {});
});

// ==================================================
// 9. PILARES DE ROSAS ROJAS 3D GIRATORIAS
// ==================================================
function crearEscenaPilarRosa(canvasId, colorLuzPilar) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const scenePilar = new THREE.Scene();
  const cameraPilar = new THREE.PerspectiveCamera(40, 160 / 220, 0.1, 100);
  cameraPilar.position.set(0, 0.3, 7.5);

  const rendererPilar = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !esMovil });
  rendererPilar.setPixelRatio(Math.min(window.devicePixelRatio, esMovil ? 1.5 : 2));
  rendererPilar.setSize(160, 220, false);

  scenePilar.add(new THREE.AmbientLight(0xffffff, 1.2));
  const lightDirect = new THREE.DirectionalLight(colorLuzPilar, 3.2);
  lightDirect.position.set(4, 5, 5);
  scenePilar.add(lightDirect);

  const lightPoint = new THREE.PointLight(0xff4d6d, 2.0, 15);
  lightPoint.position.set(0, 2, 4);
  scenePilar.add(lightPoint);

  const grupoRosa3D = new THREE.Group();

  const geoCentro = new THREE.SphereGeometry(0.5, 16, 16);
  const matCentro = new THREE.MeshStandardMaterial({
    color: 0x8a031e,
    roughness: 0.3,
    metalness: 0.15
  });
  const centroRosa = new THREE.Mesh(geoCentro, matCentro);
  centroRosa.position.y = 0.5;
  grupoRosa3D.add(centroRosa);

  const matPetalosInternos = new THREE.MeshStandardMaterial({
    color: 0xc9184a,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const matPetalosExternos = new THREE.MeshStandardMaterial({
    color: 0xe63946,
    roughness: 0.4,
    metalness: 0.08,
    side: THREE.DoubleSide
  });

  const numCapas = esMovil ? 12 : 16;
  for (let i = 0; i < numCapas; i++) {
    const radioCapa = 0.55 + i * 0.08;
    const angulo = i * 2.399;
    const geoPetalo = new THREE.SphereGeometry(
      0.6 + i * 0.04,
      12,
      12,
      0,
      Math.PI * 0.75,
      0,
      Math.PI * 0.65
    );

    const matActual = i < (numCapas / 2) ? matPetalosInternos : matPetalosExternos;
    const petalo = new THREE.Mesh(geoPetalo, matActual);
    petalo.position.set(
      Math.cos(angulo) * radioCapa * 0.45,
      0.5 + (i * 0.035) - 0.2,
      Math.sin(angulo) * radioCapa * 0.45
    );
    petalo.rotation.x = Math.PI * 0.22 + (i * 0.03);
    petalo.rotation.y = angulo;
    petalo.rotation.z = Math.sin(i) * 0.22;
    grupoRosa3D.add(petalo);
  }

  const geoTallo = new THREE.CylinderGeometry(0.1, 0.1, 3.2, 12);
  const matTallo = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.6 });
  const tallo = new THREE.Mesh(geoTallo, matTallo);
  tallo.position.y = -1.4;
  grupoRosa3D.add(tallo);

  const geoHoja = new THREE.ConeGeometry(0.35, 1.1, 10);
  const matHoja = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.5 });
  
  const hoja1 = new THREE.Mesh(geoHoja, matHoja);
  hoja1.position.set(0.42, -0.9, 0);
  hoja1.rotation.z = -Math.PI * 0.35;
  grupoRosa3D.add(hoja1);

  const hoja2 = new THREE.Mesh(geoHoja, matHoja);
  hoja2.position.set(-0.42, -1.4, 0);
  hoja2.rotation.z = Math.PI * 0.35;
  grupoRosa3D.add(hoja2);

  scenePilar.add(grupoRosa3D);

  const controlsPilar = new OrbitControls(cameraPilar, canvas);
  controlsPilar.enableDamping = true;
  controlsPilar.enableZoom = false;
  controlsPilar.enablePan = false;
  controlsPilar.autoRotate = true;
  controlsPilar.autoRotateSpeed = 3.0;

  return {
    render: () => {
      controlsPilar.update();
      rendererPilar.render(scenePilar, cameraPilar);
    },
    resize: () => {
      const width = canvas.clientWidth || 160;
      const height = canvas.clientHeight || 220;
      cameraPilar.aspect = width / height;
      cameraPilar.updateProjectionMatrix();
      rendererPilar.setSize(width, height, false);
    }
  };
}

const pilarIzq = !esMovil ? crearEscenaPilarRosa("canvas-rosa-izq", 0xff758f) : null;
const pilarDer = !esMovil ? crearEscenaPilarRosa("canvas-rosa-der", 0xff4d6d) : null;

// ==================================================
// 10. ANIMACIÓN CINEMATOGRÁFICA DE ESCAPE (INICIO)
// ==================================================
const pantallaInicio = document.getElementById("pantalla-inicio");
const btnComenzarViaje = document.getElementById("btn-comenzar-viaje");

if (btnComenzarViaje && pantallaInicio) {
  btnComenzarViaje.addEventListener("click", (e) => {
    e.stopPropagation();

    if (audioFondo.paused) {
      audioFondo.play().catch(console.warn);
    }

    pantallaInicio.classList.add("animando-salida");

    const duracion = 2500;
    const tiempoInicio = performance.now();
    const posInicialZ = 75;
    const posFinalZ = 45;
    const posInicialY = 36;
    const posFinalY = 30;

    function animarVueloEntrada(tiempoActual) {
      const transcurrido = tiempoActual - tiempoInicio;
      const progreso = Math.min(transcurrido / duracion, 1);
      
      const ease = progreso < 0.5
        ? 4 * progreso * progreso * progreso
        : 1 - Math.pow(-2 * progreso + 2, 3) / 2;

      camara.position.z = posInicialZ + (posFinalZ - posInicialZ) * ease;
      camara.position.y = posInicialY + (posFinalY - posInicialY) * ease;

      if (progreso < 1) {
        requestAnimationFrame(animarVueloEntrada);
      } else {
        pantallaInicio.classList.add("oculta");
      }
    }

    requestAnimationFrame(animarVueloEntrada);
  });
}

// ==================================================
// 11. POINTER EVENTS EN LA ESCENA PRINCIPAL
// ==================================================
window.addEventListener("pointerdown", (event) => {
  if (
    (pantallaInicio && !pantallaInicio.classList.contains("animando-salida") && !pantallaInicio.classList.contains("oculta")) ||
    infoPanel.contains(event.target) ||
    (modalPalabra && modalPalabra.contains(event.target)) ||
    panelMusica.contains(event.target) ||
    (btnFullscreen && btnFullscreen.contains(event.target))
  ) {
    return;
  }

  raton.x = (event.clientX / window.innerWidth) * 2 - 1;
  raton.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(raton, camara);

  const objetosAstro = [sol, ...planetasMeshes];
  const interPlanetas = raycaster.intersectObjects(objetosAstro, false);

  if (interPlanetas.length > 0) {
    const datosPlaneta = interPlanetas[0].object.userData;
    mostrarTarjeta(datosPlaneta);
    return;
  }

  const interRosas = raycaster.intersectObjects(rosasArray, false);
  if (interRosas.length > 0) {
    const rosaClickeada = interRosas[0].object;
    
    const escalaOriginal = rosaClickeada.scale.x;
    rosaClickeada.scale.set(escalaOriginal * 1.6, escalaOriginal * 1.6, 1);
    setTimeout(() => {
      rosaClickeada.scale.set(escalaOriginal, escalaOriginal, 1);
    }, 300);

    const palabra = obtenerPalabraAleatoria();
    mostrarPalabraFlotante(palabra, event.clientX, event.clientY);
    mostrarModalPalabra(palabra);
  }
});

window.addEventListener("resize", () => {
  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);

  if (pilarIzq) pilarIzq.resize();
  if (pilarDer) pilarDer.resize();
});

// ==================================================
// 12. BUCLE DE ANIMACIÓN
// ==================================================
function animar(tiempo) {
  const t = tiempo * 0.001;

  sol.rotation.y += 0.002;

  planetasMeshes.forEach((malla) => {
    const datos = malla.userData;
    malla.position.x = Math.cos(t * datos.velocidad) * datos.distancia;
    malla.position.z = Math.sin(t * datos.velocidad) * datos.distancia;
    malla.rotation.y += 0.015;
  });

  grupoNebulosas.rotation.y = t * 0.0025;
  grupoConstelaciones.rotation.y = -t * 0.0015;
  polvoEstelar.rotation.y = -t * 0.002;
  grupoRosas.rotation.y = t * 0.01;

  if (pantallaInicio && !pantallaInicio.classList.contains("oculta")) {
    if (pilarIzq) pilarIzq.render();
    if (pilarDer) pilarDer.render();
  }

  controles.update();
  renderizador.render(escena, camara);
}

renderizador.setAnimationLoop(animar);

// ==================================================
// 13. TARJETA DE PLANETAS
// ==================================================
function mostrarTarjeta(datosPlaneta) {
  tarjetaInner.classList.remove("girada");

  infoTitulo.textContent = datosPlaneta.nombre;
  infoDesc.textContent = datosPlaneta.info;
  infoMensaje.textContent = datosPlaneta.mensajeReverso || "Un rincón especial en el cosmos.";

  const colorHex = datosPlaneta.colorTema || "#e7a9b5";
  infoPanel.style.setProperty("--color-planeta", colorHex);

  const videoAnterior = infoVideo.querySelector("video");
  if (videoAnterior) {
    videoAnterior.pause();
    videoAnterior.removeAttribute("src");
    videoAnterior.load();
  }
  infoVideo.innerHTML = "";

  if (datosPlaneta.video) {
    const video = document.createElement("video");
    video.src = datosPlaneta.video;
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.setAttribute("controlsList", "nodownload nofullscreen noremoteplayback");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.addEventListener("play", () => {
      if (!audioFondo.paused) {
        pausadoPorVideo = true;
        audioFondo.pause();
      }
    });

    video.addEventListener("pause", () => {
      if (pausadoPorVideo) {
        pausadoPorVideo = false;
        audioFondo.play().catch(() => {});
      }
    });

    video.addEventListener("ended", () => {
      if (pausadoPorVideo) {
        pausadoPorVideo = false;
        audioFondo.play().catch(() => {});
      }
    });

    infoVideo.appendChild(video);
    infoVideo.hidden = false;
  } else {
    infoVideo.hidden = true;
  }

  infoPanel.hidden = false;
}

function ocultarTarjeta() {
  const videoActivo = infoVideo.querySelector("video");
  if (videoActivo) {
    videoActivo.pause();
    videoActivo.removeAttribute("src");
    videoActivo.load();
  }
  infoVideo.innerHTML = "";
  infoVideo.hidden = true;
  infoPanel.hidden = true;
  tarjetaInner.classList.remove("girada");

  if (pausadoPorVideo) {
    pausadoPorVideo = false;
    audioFondo.play().catch(() => {});
  }
}
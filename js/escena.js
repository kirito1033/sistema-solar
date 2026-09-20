import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CONFIG } from "./config.js";

const contenedor = document.getElementById("escena");
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x020202);

const camara = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camara.position.set(0, 30, 45);

const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
contenedor.appendChild(renderizador.domElement);

// Luces
escena.add(new THREE.AmbientLight(0xffffff, 1));
const luzSolar = new THREE.PointLight(0xffffff, 20, 200);
escena.add(luzSolar);

// Textura procedural de Rosa Blanca en Canvas
function crearTexturaRosa() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.font = "80px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 15;
  ctx.fillText("🏶", 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 1. Rosas Blancas en lugar de estrellas (Sprites interactivos)
const texturaRosa = crearTexturaRosa();
const materialRosa = new THREE.SpriteMaterial({
  map: texturaRosa,
  color: 0xffffff,
  transparent: true,
  opacity: 0.95
});

const grupoRosas = new THREE.Group();
const rosasArray = [];
const numRosas = CONFIG.cantidadEstrellas || 150;

for (let i = 0; i < numRosas; i++) {
  const sprite = new THREE.Sprite(materialRosa);
  
  const radio = 35 + Math.random() * 85;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);

  sprite.position.x = radio * Math.sin(phi) * Math.cos(theta);
  sprite.position.y = (radio * Math.sin(phi) * Math.sin(theta)) * 0.7;
  sprite.position.z = radio * Math.cos(phi);

  const escala = 1.4 + Math.random() * 1.2;
  sprite.scale.set(escala, escala, 1);

  sprite.userData = {
    esRosa: true,
    rotacionVel: (Math.random() - 0.5) * 0.005
  };

  grupoRosas.add(sprite);
  rosasArray.push(sprite);
}
escena.add(grupoRosas);

// 2. Sol y Planetas
const cargadorTexturas = new THREE.TextureLoader();
cargadorTexturas.setCrossOrigin("anonymous");

// Sol
const texturaSol = cargadorTexturas.load(CONFIG.sol.textura);
const sol = new THREE.Mesh(
  new THREE.SphereGeometry(CONFIG.sol.radio, 32, 32),
  new THREE.MeshBasicMaterial({
    map: texturaSol,
    color: CONFIG.sol.colorFallback || 0xffaa00
  })
);
sol.userData = { ...CONFIG.sol };
escena.add(sol);

// Planetas
const planetasMeshes = [];
CONFIG.planetas.forEach((datos) => {
  const texturaPlaneta = cargadorTexturas.load(datos.textura);
  const malla = new THREE.Mesh(
    new THREE.SphereGeometry(datos.radio, 32, 32),
    new THREE.MeshStandardMaterial({
      map: texturaPlaneta,
      color: datos.colorFallback,
      roughness: 0.8
    })
  );
  malla.userData = datos;
  escena.add(malla);
  planetasMeshes.push(malla);

  // Anillos de Saturno
  if (datos.tieneAnillo) {
    const geometriaAnillo = new THREE.RingGeometry(datos.radio + 0.3, datos.radio + 1.2, 64);
    const materialAnillo = new THREE.MeshBasicMaterial({
      color: 0xe6dac3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const anillo = new THREE.Mesh(geometriaAnillo, materialAnillo);
    anillo.rotation.x = Math.PI / 2;
    malla.add(anillo);
  }

  // Guía de Órbita
  const geometriaOrbita = new THREE.RingGeometry(datos.distancia - 0.03, datos.distancia + 0.03, 64);
  const materialOrbita = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25
  });
  const orbita = new THREE.Mesh(geometriaOrbita, materialOrbita);
  orbita.rotation.x = Math.PI / 2;
  escena.add(orbita);
});

// 3. Controles de Órbita
const controles = new OrbitControls(camara, renderizador.domElement);
controles.enableDamping = true;
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

// Modal y Contenedor de Palabras Bonitas
const modalPalabra = document.getElementById("modal-palabra");
const textoPalabraModal = document.getElementById("texto-palabra-modal");
const btnCerrarModal = document.getElementById("cerrar-modal-palabra");
const contenedorFlotantes = document.getElementById("contenedor-palabras-flotantes");

if (btnCerrarModal) {
  btnCerrarModal.addEventListener("click", () => {
    modalPalabra.hidden = true;
  });
}

// Giros de tarjeta
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

// Botones de cerrar tarjeta
botonesCerrar.forEach((btn) => {
  btn.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    ocultarTarjeta();
  });
});

// Función para obtener una palabra bonita aleatoria
function obtenerPalabraAleatoria() {
  const lista = CONFIG.palabrasBonitas || ["Amor", "Magia", "Luz", "Sonrisa", "Universo"];
  const indice = Math.floor(Math.random() * lista.length);
  return lista[indice];
}

// Efecto visual: Palabra flotando en pantalla
function mostrarPalabraFlotante(palabra, x, y) {
  const elemento = document.createElement("div");
  elemento.className = "palabra-flotante-pop";
  elemento.textContent = `🏶 ${palabra}`;
  elemento.style.left = `${x}px`;
  elemento.style.top = `${y}px`;

  contenedorFlotantes.appendChild(elemento);

  setTimeout(() => {
    elemento.remove();
  }, 2500);
}

// Mostrar modal de palabra
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
// SISTEMA DE REPRODUCCIÓN DE MÚSICA SIN REPETIR & AUTOPLAY
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
let pausadoPorVideo = false; // Indicador de pausa automática por reproducción de video

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

// Inicializar lista barajada al cargar la página
barajarCanciones();
cargarCancion(0, false);

// Intento de Autoplay inmediato al cargar la página
function intentarAutoplay() {
  audioFondo.play().then(() => {
    panelMusica.classList.add("reproduciendo");
    btnMusicaPlay.textContent = "⏸";
  }).catch(() => {
    // Si las políticas estrictas de autoplay del navegador bloquean el audio al inicio,
    // se iniciará con cualquier primera interacción del usuario
    const iniciarEnInteraccion = () => {
      if (audioFondo.paused && !pausadoPorVideo) {
        audioFondo.play().catch(() => {});
      }
      window.removeEventListener("pointerdown", iniciarEnInteraccion);
      window.removeEventListener("keydown", iniciarEnInteraccion);
      window.removeEventListener("touchstart", iniciarEnInteraccion);
    };

    window.addEventListener("pointerdown", iniciarEnInteraccion, { once: true });
    window.addEventListener("keydown", iniciarEnInteraccion, { once: true });
    window.addEventListener("touchstart", iniciarEnInteraccion, { once: true });
  });
}

// Ejecutar intento de reproducción tan pronto se carga el script
if (document.readyState === "complete" || document.readyState === "interactive") {
  intentarAutoplay();
} else {
  window.addEventListener("DOMContentLoaded", intentarAutoplay);
}

// Eventos del reproductor manual
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
  btnMusicaPlay.textContent = "▶";
});

audioFondo.addEventListener("ended", () => {
  siguienteCancion();
  audioFondo.play().catch(() => {});
});

// ==================================================
// INTERACCIÓN CON PLANETAS Y CONTROL CRUZADO AUDIO/VIDEO
// ==================================================
window.addEventListener("pointerdown", (event) => {
  if (
    infoPanel.contains(event.target) ||
    (modalPalabra && modalPalabra.contains(event.target)) ||
    panelMusica.contains(event.target)
  ) {
    return;
  }

  raton.x = (event.clientX / window.innerWidth) * 2 - 1;
  raton.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(raton, camara);

  // 1. Evaluar planetas y Sol
  const objetosAstro = [sol, ...planetasMeshes];
  const interPlanetas = raycaster.intersectObjects(objetosAstro, false);

  if (interPlanetas.length > 0) {
    const datosPlaneta = interPlanetas[0].object.userData;
    mostrarTarjeta(datosPlaneta);
    return;
  }

  // 2. Evaluar clics en Rosas Blancas
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

// Redimensionar pantalla
window.addEventListener("resize", () => {
  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

// Bucle de animación
function animar(tiempo) {
  const t = tiempo * 0.001;

  sol.rotation.y += 0.002;

  planetasMeshes.forEach((malla) => {
    const datos = malla.userData;
    malla.position.x = Math.cos(t * datos.velocidad) * datos.distancia;
    malla.position.z = Math.sin(t * datos.velocidad) * datos.distancia;
    malla.rotation.y += 0.015;
  });

  grupoRosas.rotation.y = t * 0.015;

  controles.update();
  renderizador.render(escena, camara);
}

renderizador.setAnimationLoop(animar);

// Funciones de control de Tarjeta de Planetas con sincronización de Video y Audio
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

    // Sincronización: Al reproducir el video, pausar la música de fondo
    video.addEventListener("play", () => {
      if (!audioFondo.paused) {
        pausadoPorVideo = true;
        audioFondo.pause();
      }
    });

    // Sincronización: Al pausar o terminar el video, reanudar la música de fondo si fue pausada por el video
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

  // Reanudar la música de fondo al salir de la tarjeta si estaba pausada por el video
  if (pausadoPorVideo) {
    pausadoPorVideo = false;
    audioFondo.play().catch(() => {});
  }
}
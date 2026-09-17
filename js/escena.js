import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CONFIG } from "./config.js";

const contenedor = document.getElementById("escena");
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x020202); // Espacio casi negro

const camara = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camara.position.set(0, 30, 45); // Vista panorámica superior

const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
contenedor.appendChild(renderizador.domElement);

// Luces
escena.add(new THREE.AmbientLight(0xffffff, 1)); // Subimos la luz base de 0.3 a 0.8
const luzSolar = new THREE.PointLight(0xffffff, 20, 200); // Subimos la fuerza a 10 y el alcance a 200
escena.add(luzSolar);

// 1. Estrellas
const geometriaEstrellas = new THREE.BufferGeometry();
const posicionesEstrellas = new Float32Array(CONFIG.cantidadEstrellas * 3);
for (let i = 0; i < CONFIG.cantidadEstrellas * 3; i++) {
  posicionesEstrellas[i] = (Math.random() - 0.5) * 200; // Esparcir en un radio de 200 unidades
}
geometriaEstrellas.setAttribute('position', new THREE.BufferAttribute(posicionesEstrellas, 3));
const materialEstrellas = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
const estrellas = new THREE.Points(geometriaEstrellas, materialEstrellas);
escena.add(estrellas);

// === NUEVO: Cargador de texturas de la web ===
const cargadorTexturas = new THREE.TextureLoader();
cargadorTexturas.setCrossOrigin("anonymous"); // Fundamental para cargar imágenes de otras webs

// 2. Sol y Planetas
const texturaSol = cargadorTexturas.load(CONFIG.sol.textura);
const sol = new THREE.Mesh(
  new THREE.SphereGeometry(CONFIG.sol.radio, 32, 32),
  new THREE.MeshBasicMaterial({ 
    map: texturaSol, 
    color: 0xffaa00 // Un tono más naranja/dorado para el Sol
  }) 
);
// Le pasamos la información de nombre y descripción
sol.userData = {
  nombre: CONFIG.sol.nombre,
  info: CONFIG.sol.info,
  video: CONFIG.sol.video
};
escena.add(sol);

const planetasMeshes = [];
CONFIG.planetas.forEach(datos => {
  // Cargar textura web del planeta
  const texturaPlaneta = cargadorTexturas.load(datos.textura);
  
  // Crear Planeta
  const malla = new THREE.Mesh(
    new THREE.SphereGeometry(datos.radio, 32, 32),
    new THREE.MeshStandardMaterial({ 
      map: texturaPlaneta,
      color: datos.colorFallback, // Tinta la textura para diferenciar los planetas
      roughness: 0.8 
    })
  );
  malla.userData = datos; 
  escena.add(malla);
  planetasMeshes.push(malla);
  
  // === AÑADIR ANILLO A SATURNO ===
  if (datos.tieneAnillo) {
    const geometriaAnillo = new THREE.RingGeometry(datos.radio + 0.3, datos.radio + 1.2, 64);
    const materialAnillo = new THREE.MeshBasicMaterial({ 
      color: 0xe6dac3, // Color arena para los anillos
      side: THREE.DoubleSide, // Se ve por arriba y por abajo
      transparent: true, 
      opacity: 0.7 
    });
    const anillo = new THREE.Mesh(geometriaAnillo, materialAnillo);
    anillo.rotation.x = Math.PI / 2; // Acostar el anillo horizontalmente
    
    // Al agregarlo como hijo de la malla, seguirá al planeta automáticamente
    malla.add(anillo); 
  }

  // Crear Guía de Órbita
  const geometriaOrbita = new THREE.RingGeometry(datos.distancia - 0.03, datos.distancia + 0.03, 64);
  const materialOrbita = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
  const orbita = new THREE.Mesh(geometriaOrbita, materialOrbita);
  orbita.rotation.x = Math.PI / 2; // Acostar el anillo de la órbita
  escena.add(orbita);
});

// 3. Controles e Interacción
const controles = new OrbitControls(camara, renderizador.domElement);
controles.enableDamping = true;
controles.maxDistance = 150;

const raycaster = new THREE.Raycaster();
const raton = new THREE.Vector2();

const infoPanel = document.getElementById("info-planeta");
const infoTitulo = document.getElementById("info-titulo");
const infoDesc = document.getElementById("info-desc");
const infoVideo = document.getElementById("info-video");
const botonCerrar = document.getElementById("cerrar-tarjeta");

window.addEventListener("pointerdown", (event) => {
  /*
    Si el usuario toca dentro de la tarjeta, no ejecutar raycasting.
    Esto permite usar la X y los controles de video normalmente.
  */
  if (infoPanel.contains(event.target)) {
    return;
  }

  raton.x = (event.clientX / window.innerWidth) * 2 - 1;
  raton.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(raton, camara);

    const objetosInteractivos = [
    sol,
    ...planetasMeshes
  ];

  const intersecciones =
    raycaster.intersectObjects(
      objetosInteractivos,
      false
    );

  /*
    Solo se muestra/cambia la tarjeta cuando realmente se selecciona
    un planeta. Si pulsas el fondo, NO se oculta ni se detiene el video.
  */
  if (intersecciones.length > 0) {
    const datosPlaneta = intersecciones[0].object.userData;
    mostrarTarjeta(datosPlaneta);
  }
});

botonCerrar.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  ocultarTarjeta();
});

// 4. Adaptabilidad a la ventana (Responsive)
window.addEventListener('resize', () => {
  camara.aspect = window.innerWidth / window.innerHeight;
  camara.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

botonCerrar.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
  ocultarTarjeta();
});

// 5. Bucle de Animación
function animar(tiempo) {
  const t = tiempo * 0.001; 
  
  sol.rotation.y += 0.002; // El sol también gira lentamente
  
  planetasMeshes.forEach(malla => {
    const datos = malla.userData;
    malla.position.x = Math.cos(t * datos.velocidad) * datos.distancia;
    malla.position.z = Math.sin(t * datos.velocidad) * datos.distancia;
    malla.rotation.y += 0.015; // Rotar el planeta sobre su propio eje
  });
  
  estrellas.rotation.y = t * 0.01; // El fondo de estrellas gira lentamente

  controles.update();
  renderizador.render(escena, camara);
}

function mostrarTarjeta(datosPlaneta) {
  infoTitulo.textContent = datosPlaneta.nombre;
  infoDesc.textContent = datosPlaneta.info;

  // Detiene y elimina el video anterior solamente al seleccionar otro planeta.
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

    // Evita pantalla completa, descarga y reproducción remota
    // en navegadores que soporten estos controles.
    video.setAttribute(
      "controlsList",
      "nodownload nofullscreen noremoteplayback"
    );

    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

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
}


renderizador.setAnimationLoop(animar);


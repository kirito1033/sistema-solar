export const CONFIG = {
 cantidadEstrellas: 2000,
  sol: {
    nombre: "El Sol",
    info: "Lasso - No Pares de Bailar.",
    radio: 2,
    textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg",
    video: "./assets/lasso-no-pares-de-bailar.mp4",
    mensajeReverso: "Eres la luz que hace brillar todo mi universo."
  },
  planetas: [
    { nombre: "Mercurio", textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg", radio: 0.3, distancia: 4, velocidad: 0.8, colorFallback: 0x888888, info: "El más pequeño y cercano al Sol." },
    { nombre: "Venus", textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg", radio: 0.5, distancia: 6, velocidad: 0.6, colorFallback: 0xe3bb76, info: "Temperatura abrasadora y densas nubes." },
    {
      nombre: "Tierra",
      textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/earth_atmos_2048.jpg",
      radio: 0.55,
      distancia: 8.5,
      velocidad: 0.4,
      colorFallback: 0x2b82c9,
      info: "Lasso - No Pares de Bailar ",
      video: "./assets/lasso-no-pares-de-bailar.mp4",
      mensajeReverso: "No pares de bailar. Que este universo siempre tenga una canción para nosotros."
    },
    { nombre: "Marte", textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg", radio: 0.4, distancia: 11, velocidad: 0.3, colorFallback: 0xc1440e, info: "El planeta rojo." },
    { nombre: "Júpiter", textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg", radio: 1.5, distancia: 16, velocidad: 0.15, colorFallback: 0xd39c7e, info: "El gigante gaseoso." },
    { nombre: "Saturno", textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg", radio: 1.2, distancia: 21, velocidad: 0.1, colorFallback: 0xc5ab6e, tieneAnillo: true, info: "Famoso por su espectacular sistema de anillos." },
    { nombre: "Urano", textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg", radio: 0.8, distancia: 26, velocidad: 0.07, colorFallback: 0x66ccff, info: "Gigante de hielo inclinado." },
    { nombre: "Neptuno", textura: "https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/moon_1024.jpg", radio: 0.75, distancia: 31, velocidad: 0.05, colorFallback: 0x3333ff, info: "Mundo oscuro y frío." }
  ]
};
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

let ubicaciones = {};

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.on("join", (id) => {
    socket.join(id);
    console.log(`Cliente unido a la sala ${id}`);
    if (ubicaciones[id]) {
      socket.emit("ubicacion-actualizada", ubicaciones[id]);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });

  socket.on("stopSharing", (id) => {
    delete ubicaciones[id];
    io.to(id).emit("ubicacion-actualizada", null);
    console.log(`Rastreo finalizado para la sala ${id}`);
  });
});

app.post("/api/ubicacion", (req, res) => {
  const { id, coords, destination } = req.body;
  console.log("[POST] /api/ubicacion", req.body);

  if (id && coords) {
    if (!ubicaciones[id]) {
      ubicaciones[id] = { coords: coords, destination: destination || null };
    } else {
      ubicaciones[id].coords = coords;
    }
    io.to(id).emit("ubicacion-actualizada", ubicaciones[id]);
  }
  res.sendStatus(200);
});

app.post("/api/finalizar/:id", (req, res) => {
  const id = req.params.id;
  delete ubicaciones[id];
  io.to(id).emit("ubicacion-actualizada", null);
  console.log(`Rastreo ${id} finalizado y clientes notificados.`);
  res.json({ message: `Pedido ${id} finalizado y clientes notificados.` });
});

app.get("/track/:id", (req, res) => {
  const id = req.params.id;
  const apiKey = "AIzaSyC1fn5U9xyDTW3NFfcABAuwazeO39qyo2E"; // Sustituye por tu Google Maps API key

res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Seguimiento en tiempo real</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: 'Roboto', sans-serif;
      display: flex;
      flex-direction: column;
      background-color: #fffdf8;
    }

#mensajes-superiores {
  background-color: #ff6600;
  color: white;
  font-weight: 500;
  font-size: 16px;
  text-align: center;
  padding: 14px 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  border-radius: 20px;
  z-index: 9999;
}


    .mensaje {
      display: none;
      animation: fadeInOut 6s ease-in-out;
    }

    .mensaje.visible {
      display: block;
    }

    @keyframes fadeInOut {
      0% { opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { opacity: 0; }
    }

 #tiempo-llegada {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  background-color: #fff2e0;
  padding: 12px 20px;
  margin-top: 90px; /* empuja el texto hacia abajo del banner */
  margin-bottom: 10px;
  width: 90%;
  max-width: 600px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  align-self: center;
  z-index: 10;
}


    #expirado {
      display: none;
      margin-top: 50px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
    }

    #map {
      flex-grow: 1;
      width: 100%;
      display: none;
    }

    #loading {
      position: absolute;
      width: 100%;
      height: 100%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #666;
      z-index: 20;
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}"></script>
</head>
<body>
  <div id="mensajes-superiores">
    <div class="mensaje visible">🕒 Calculando tiempo estimado de llegada...</div>
<div class="mensaje">🍔 Tu pedido de Don Burgo ya viene en camino… ¡recién preparado :D!</div>
<div class="mensaje">🚴‍♂️ El sabor de Don Burgo llega con todo el esfuerzo detrás.</div>
<div class="mensaje">🌟 En Don Burgo cuidamos cada detalle, incluso el camino a tu puerta.</div>
<div class="mensaje">🧳 Llevar Don Burgo hasta ti es parte del buen servicio que nos define.</div>
<div class="mensaje">💼 Lo mejor de Don Burgo no solo está en la comida, también en cómo llega.</div>
<div class="mensaje">✨ Una entrega cálida, así como el sabor de Don Burgo.</div>
<div class="mensaje">🧡 Gracias por confiar en Don Burgo.</div>
<div class="mensaje">📦 Detrás de tu pedido hay dedicación. Así se vive la experiencia Don Burgo.</div>
<div class="mensaje">🍔 Si disfrutaste tu pedido de Don Burgo, ¡nos alegra saberlo con una propina para el repartidor!</div>
<div class="mensaje">😊 Un buen servicio merece ser recordado… o reconocido con una propina.</div>
<div class="mensaje">🙌 Cuando un cliente agradece, nuestros repartidores lo notan.</div>
<div class="mensaje">🧡 Si sentiste que fue un buen servicio, puedes expresarlo con una propina.</div>
<div class="mensaje">📦 Cada entrega lleva esfuerzo. Si lo valoras, ellos quedan agradecidos con tu propina.</div>
<div class="mensaje">✨ Tu reconocimiento motiva a seguir entregando con el corazón.</div>
<div class="mensaje">🚴‍♂️ Satisfacción completa: buena comida, buena atención y buenos detalles.</div>


  </div>

  <div id="tiempo-llegada">Calculando tiempo estimado de llegada...</div>
  <div id="loading">Cargando ubicación del repartidor...</div>
  <div id="map"></div>
  <div id="expirado">Orden entregada. ¡Gracias por su preferencia! 🥰</div>

  <script>
    const id = '${id}';
    let map, motoMarker, clientMarker, destinationMarker;
    let clientPosition = null;
    let directionsService, directionsRenderer;

    const socket = io();

    function initMap(initialMotoPosition, initialClientPosition) {
      const center = initialClientPosition || initialMotoPosition;
      map = new google.maps.Map(document.getElementById('map'), {
        center,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#ff6600',
          strokeWeight: 4,
          opacity: 0.9
        }
      });
      directionsRenderer.setMap(map);

      motoMarker = new google.maps.Marker({
        position: initialMotoPosition,
        map,
        title: 'Tu pedido',
        icon: {
          url: 'https://i.postimg.cc/h4HDzn3X/Chat-GPT-Image-1-jun-2025-02-34-48-a-m-2.png',
          scaledSize: new google.maps.Size(50, 50)
        }
      });

      if (initialClientPosition) {
        clientMarker = new google.maps.Marker({
          position: clientPosition,
          map,
          title: 'Tu ubicación',
          icon: {
            url: 'https://cdn-icons-png.flaticon.com/512/553/553416.png',
            scaledSize: new google.maps.Size(36, 36)
          }
        });
      }
    }

    function drawRoute(from, to) {
      if (!from || !to) return;
      directionsService.route(
        {
          origin: from,
          destination: to,
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            const route = result.routes[0].legs[0];
            const duration = route.duration.text;
            const distance = route.distance.text;

            const tiempoLlegada = document.getElementById('tiempo-llegada');
            tiempoLlegada.style.display = 'block';
            tiempoLlegada.innerHTML = "🕒 Tiempo estimado de llegada: <strong>" + duration + "</strong>" + (distance ? " (" + distance + ")" : "");
          } else {
            document.getElementById('tiempo-llegada').style.display = 'none';
          }
        }
      );
    }

    function requestClientLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clientPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            if (map && !clientMarker) {
              clientMarker = new google.maps.Marker({
                position: clientPosition,
                map,
                title: 'Tu ubicación',
                icon: {
                  url: 'https://cdn-icons-png.flaticon.com/512/484/484167.png',
                  scaledSize: new google.maps.Size(36, 36)
                }
              });
              map.setCenter(clientPosition);
            }
            if (motoMarker && motoMarker.getPosition()) {
              drawRoute(motoMarker.getPosition().toJSON(), clientPosition);
            }
          },
          (error) => {
            console.warn('Error al obtener ubicación del cliente:', error.message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }

    function joinRoom() {
      socket.emit('join', id);
    }

    socket.on('connect', () => {
      joinRoom();
      requestClientLocation();
    });

    socket.io.on('reconnect', () => {
      joinRoom();
      requestClientLocation();
    });

    socket.on('ubicacion-actualizada', (data) => {
      const coords = data ? data.coords : null;
      const destination = data ? data.destination : null;

      if (!coords) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('map').style.display = 'none';
        document.getElementById('mensajes-superiores').style.display = 'none';
        document.getElementById('tiempo-llegada').style.display = 'none';
        document.getElementById('expirado').style.display = 'block';
        return;
      }

      document.getElementById('loading').style.display = 'none';
      document.getElementById('map').style.display = 'block';
      document.getElementById('mensajes-superiores').style.display = 'block';

      const motoPosition = { lat: coords.latitude, lng: coords.longitude };

      if (!map) {
        initMap(motoPosition, clientPosition);
      } else {
        motoMarker.setPosition(motoPosition);
      }

      if (clientPosition) {
        drawRoute(motoPosition, clientPosition);
      }

      if (destination) {
        const destPosition = { lat: destination.latitude, lng: destination.longitude };
        if (!destinationMarker) {
          destinationMarker = new google.maps.Marker({
            position: destPosition,
            map,
            title: 'Destino',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }
          });
        } else {
          destinationMarker.setPosition(destPosition);
        }
      } else if (destinationMarker) {
        destinationMarker.setMap(null);
        destinationMarker = null;
      }
    });

    // Mensajes rotativos
    let mensajeIndex = 0;
    const mensajes = document.querySelectorAll('#mensajes-superiores .mensaje');

    function rotarMensajes() {
      mensajes.forEach((msg, i) => msg.classList.remove('visible'));
      mensajes[mensajeIndex].classList.add('visible');
      mensajeIndex = (mensajeIndex + 1) % mensajes.length;
    }

    setInterval(rotarMensajes, 6000);
    rotarMensajes();
  </script>
</body>
</html>`);

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Servidor en puerto", PORT);
});  
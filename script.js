const translations = {
  en: {
    title: "Tram Project",
    tramSimulation: "Tram Simulation",
    startTram: "Start Tram",
    stopTram: "Stop Tram",
    routeInfo: "Route Info",
    userLocationLabel: "Your Location",
    detectLocation: "Detect Location",
    travelTimeLabel: "Travel Time:",
    routeLabel: "Set Route",
    setRoute: "Set Route",
    showMap: "Show Route Map",
    hideMap: "Hide Route Map",
    input: "Input"
  },
  pl: {
    title: "Projekt Tramwajowy",
    tramSimulation: "Symulacja tramwaju",
    startTram: "Uruchom tramwaj",
    stopTram: "Zatrzymaj tramwaj",
    routeInfo: "Informacje o trasie",
    userLocationLabel: "Twoja lokalizacja",
    detectLocation: "Wykryj lokalizację",
    travelTimeLabel: "Czas podróży:",
    routeLabel: "Ustaw trasę",
    setRoute: "Ustaw trasę",
    showMap: "Pokaż mapę trasy",
    hideMap: "Ukryj mapę trasy",
    input: "Wprowadź"
  }
};

let tram = null;
let position = 0;
let intervalId = null;
let currentLang = 'en';
let elapsedTime = 0;
let timerId = null;
let mapVisible = false;
let currentLocation = "Detecting...";
let map;
let directionsService;
let directionsRenderer;

const routeTimes = {
  'Dworzec Główny-Plac Dominikański': 3,
  'Dworzec Główny-Rynek': 5,
  'Dworzec Główny-Plac Grunwaldzki': 8,
  'Rynek-Plac Bema': 4,
  'Rynek-Katedra': 6,
  'Plac Bema-Katedra': 5,
  'Plac Grunwaldzki-Leśnica': 22,
  'Plac Jana Pawła II-Psie Pole': 18,
  'Oporów-Nowy Dwór': 12,
  'Popowice-Pilczyce': 8,
  'Stadion Wrocław-Brochów': 15,
  'Politechnika-Sępolno': 5,
  'Kozanów-Osobowice': 10,
  'Świdnicka-Hala Targowa': 3,
  'Most Grunwaldzki-Plac Staszica': 6,
  'Oławska-Plac Dominikański': 4,
  'Leśnica-Oporów': 25,
  'Psie Pole-Biskupin': 20,
  'Katedra-Most Grunwaldzki': 7,
  'Nowy Dwór-Popowice': 10,
  'Pilczyce-Kozanów': 8,
  'Osobowice-Grabiszynek': 12,
  'Stadion Wrocław-Politechnika': 14,
  'Plac Staszica-Sępolno': 6
};

const predefinedLocations = [
  "Dworzec Główny", "Plac Dominikański", "Plac Grunwaldzki", "Rynek", "Hala Targowa",
  "Plac Bema", "Plac Jana Pawła II", "Świdnicka", "Oławska", "Katedra", "Most Grunwaldzki",
  "Leśnica", "Psie Pole", "Brochów", "Oporów", "Nowy Dwór", "Popowice", "Pilczyce",
  "Osobowice", "Grabiszynek", "Stadion Wrocław", "Politechnika", "Plac Staszica",
  "Sępolno", "Biskupin", "Kozanów"
];

function updateLanguage(lang) {
  const t = translations[lang];
  document.getElementById('title').textContent = t.title;
  document.getElementById('route-info').textContent = t.routeInfo;
  document.getElementById('tram-simulation').textContent = t.tramSimulation;
  document.querySelector('.start-btn').textContent = t.startTram;
  document.querySelector('.stop-btn').textContent = t.stopTram;
  document.getElementById('toggle-map-btn').textContent = mapVisible ? t.hideMap : t.showMap;
  document.getElementById('user-location-label').textContent = t.userLocationLabel;
  document.getElementById('detect-location-btn').textContent = t.detectLocation;
  document.getElementById('travel-time').textContent = `${t.travelTimeLabel} Not set`;
  document.getElementById('travel-time-simulation').textContent = `${t.travelTimeLabel} 00:00`;
  document.getElementById('route-label').textContent = t.routeLabel;
  document.getElementById('input-btn').textContent = t.input;
  document.getElementById('user-location').textContent = currentLocation;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateTravelTime() {
  const start = document.getElementById('start-input').value.trim();
  const end = document.getElementById('end-input').value.trim();
  const travelTimeDisplay = document.getElementById('travel-time');
  const inputBtn = document.getElementById('input-btn');

  if (start && end) {
    if (start === end) {
      alert("Start and End cannot be the same!");
      travelTimeDisplay.textContent = `${translations[currentLang].travelTimeLabel} Invalid route`;
      inputBtn.classList.add('hidden');
      return;
    }

    const key = `${start}-${end}`;
    const reverseKey = `${end}-${start}`;
    const travelMinutes = routeTimes[key] || routeTimes[reverseKey];

    if (travelMinutes) {
      travelTimeDisplay.textContent = `${translations[currentLang].travelTimeLabel} ${travelMinutes} mins`;
      inputBtn.classList.remove('hidden');
    } else {
      travelTimeDisplay.textContent = `${translations[currentLang].travelTimeLabel} Unknown route`;
      inputBtn.classList.add('hidden');
    }
  } else {
    travelTimeDisplay.textContent = `${translations[currentLang].travelTimeLabel} Not set`;
    inputBtn.classList.add('hidden');
  }
}

function startTram() {
  if (!intervalId) {
    elapsedTime = 0;
    const start = document.getElementById('start-input').value.trim();
    const end = document.getElementById('end-input').value.trim();
    const key = `${start}-${end}`;
    const reverseKey = `${end}-${start}`;
    const travelMinutes = routeTimes[key] || routeTimes[reverseKey] || 0;

    document.getElementById('travel-time-simulation').textContent = `${translations[currentLang].travelTimeLabel} ${formatTime(travelMinutes * 60)}`;
    const trackWidth = document.querySelector('.tram-track').offsetWidth - 60;
    intervalId = setInterval(() => {
      position = (position + 5) % trackWidth;
      tram.style.left = position + 'px';
    }, 100);
    timerId = setInterval(() => {
      elapsedTime++;
      if (elapsedTime >= travelMinutes * 60) {
        stopTram();
      }
      document.getElementById('travel-time-simulation').textContent = `${translations[currentLang].travelTimeLabel} ${formatTime(elapsedTime)}`;
    }, 1000);
  }
}

function stopTram() {
  clearInterval(intervalId);
  intervalId = null;
  clearInterval(timerId);
  timerId = null;
}

function toggleMap() {
  mapVisible = !mapVisible;
  const mapContainer = document.getElementById('map-container');
  mapContainer.classList.toggle('hidden', !mapVisible);
  document.getElementById('toggle-map-btn').textContent = mapVisible ? translations[currentLang].hideMap : translations[currentLang].showMap;
  if (mapVisible && map) {
    google.maps.event.trigger(map, 'resize');
    map.setOptions({ center: map.getCenter(), zoom: 13 });
  }
}

function detectLocation() {
  const userLocationDisplay = document.getElementById('user-location');
  userLocationDisplay.textContent = "Detecting...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentLocation = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
        const startInput = document.getElementById('start-input');
        startInput.value = currentLocation;
        document.getElementById('start').textContent = `Start: ${currentLocation}`;
        userLocationDisplay.textContent = currentLocation;

        if (map) {
          const newCenter = { lat: latitude, lng: longitude };
          map.setCenter(newCenter);
          new google.maps.Marker({
            position: newCenter,
            map: map,
            title: "Your Location"
          });
          map.setZoom(15);
        }
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get location timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        currentLocation = errorMessage;
        userLocationDisplay.textContent = errorMessage;
        console.error("Geolocation error:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    currentLocation = "Geolocation not supported by this browser.";
    userLocationDisplay.textContent = currentLocation;
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 51.107885, lng: 17.038538 }, // Center on Wrocław
    zoom: 12,
    styles: [
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#333333" }],
      },
      {
        featureType: "all",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#ffffff" }, { visibility: "on" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#d1e0f0" }],
      },
      {
        featureType: "transit.line",
        elementType: "geometry",
        stylers: [{ color: "#ff5555" }, { weight: 3 }],
      },
    ],
  });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    polylineOptions: {
      strokeColor: "#ff5555",
      strokeWeight: 4,
    },
  });
  directionsRenderer.setMap(map);

  detectLocation();
}

function setRoute() {
  const startInput = document.getElementById('start-input').value.trim();
  const endInput = document.getElementById('end-input').value.trim();

  if (!startInput || !endInput) {
    alert("Please enter both start and end locations.");
    return;
  }

  if (startInput === endInput) {
    alert("Start and End cannot be the same!");
    return;
  }

  const startIsPredefined = predefinedLocations.includes(startInput);
  const endIsPredefined = predefinedLocations.includes(endInput);

  if (startIsPredefined && endIsPredefined) {
    document.getElementById('start').textContent = `Start: ${startInput}`;
    document.getElementById('end').textContent = `End: ${endInput}`;
    updateTravelTime();
    alert("Route set with predefined locations. Map display is limited for these routes.");
    return;
  }

  const geocoder = new google.maps.Geocoder();
  const requests = [
    geocoder.geocode({ address: startInput + ", Wrocław, Poland" }),
    geocoder.geocode({ address: endInput + ", Wrocław, Poland" })
  ];

  Promise.all(requests)
    .then(results => {
      const start = results[0].results[0]?.formatted_address || startInput;
      const end = results[1].results[0]?.formatted_address || endInput;
      document.getElementById('start').textContent = `Start: ${start}`;
      document.getElementById('end').textContent = `End: ${end}`;

      directionsService.route(
        {
          origin: startInput + ", Wrocław, Poland",
          destination: endInput + ", Wrocław, Poland",
          travelMode: 'TRANSIT'
        },
        (response, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(response);
            map.setCenter(results[0].results[0].geometry.location);
            const duration = response.routes[0].legs[0].duration.text;
            document.getElementById('travel-time').textContent = `${translations[currentLang].travelTimeLabel} ${duration}`;
          } else {
            console.error('Directions request failed:', status);
            alert('Could not calculate route. Please check locations.');
            updateTravelTime();
          }
        }
      );
    })
    .catch(error => {
      console.error('Geocoding error:', error);
      alert('Invalid locations. Falling back to predefined route times.');
      updateTravelTime();
    });
}

document.addEventListener('DOMContentLoaded', () => {
  tram = document.querySelector('.tram');

  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      currentLang = e.target.value;
      updateLanguage(currentLang);
    });
  }

  const toggleMapBtn = document.getElementById('toggle-map-btn');
  if (toggleMapBtn) {
    toggleMapBtn.addEventListener('click', toggleMap);
  }

  const detectLocationBtn = document.getElementById('detect-location-btn');
  if (detectLocationBtn) {
    detectLocationBtn.addEventListener('click', detectLocation);
  }

  const inputBtn = document.getElementById('input-btn');
  if (inputBtn) {
    inputBtn.addEventListener('click', setRoute);
  }

  document.getElementById('start-input').addEventListener('input', updateTravelTime);
  document.getElementById('end-input').addEventListener('input', updateTravelTime);

  updateLanguage(currentLang);
  initMap();
});

window.addEventListener('load', () => {
  setTimeout(() => {
    const helloScreen = document.getElementById('hello-screen');
    if (helloScreen) {
      helloScreen.classList.add('hidden');
    }
  }, 3000);
});
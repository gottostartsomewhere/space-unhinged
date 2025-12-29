// Global state
const state = {
    isPlaying: true,
    selectedPlanet: null,
    showOrbits: true,
    showInfo: true,
    showComets: true,
    cameraMode: 'free',
    chaosMode: null,
    time: 0,
    chaosTime: 0,
    zoom: 1
};

// Scene references
let scene, camera, renderer, sun, sunLight;
let planets = [];
let asteroids = [];
let comets = [];
let orbitLines = [];
let stars;
let mouseX = 0, mouseY = 0;
let animationId;
let targetCameraPosition = new THREE.Vector3(0, 150, 300);
let targetCameraLookAt = new THREE.Vector3(0, 0, 0);

// Planet data
const planetsData = [
    { 
        name: 'Mercury', 
        size: 2.4, 
        distance: 40, 
        color: 0x8C7853, 
        speed: 0.03, 
        orbitSpeed: 0.047,
        info: 'Smallest planet, cratered surface, no atmosphere'
    },
    { 
        name: 'Venus', 
        size: 6, 
        distance: 60, 
        color: 0xFFC649, 
        speed: 0.002, 
        orbitSpeed: 0.035,
        atmosphere: true,
        info: 'Hottest planet, thick toxic atmosphere'
    },
    { 
        name: 'Earth', 
        size: 6.4, 
        distance: 85, 
        color: 0x4A90E2, 
        speed: 0.01, 
        orbitSpeed: 0.03,
        hasMoon: true,
        atmosphere: true,
        info: 'Our home, 71% water, only known planet with life'
    },
    { 
        name: 'Mars', 
        size: 3.4, 
        distance: 115, 
        color: 0xE27B58, 
        speed: 0.009, 
        orbitSpeed: 0.024,
        info: 'Red planet, polar ice caps, largest volcano'
    },
    { 
        name: 'Jupiter', 
        size: 14, 
        distance: 180, 
        color: 0xD4A574, 
        speed: 0.04, 
        orbitSpeed: 0.013,
        info: 'Largest planet, Great Red Spot, 79+ moons'
    },
    { 
        name: 'Saturn', 
        size: 12, 
        distance: 260, 
        color: 0xFAD5A5, 
        speed: 0.038, 
        orbitSpeed: 0.009,
        hasRing: true,
        info: 'Iconic rings made of ice and rock, 82+ moons'
    },
    { 
        name: 'Uranus', 
        size: 8, 
        distance: 350, 
        color: 0x4FD0E7, 
        speed: 0.03, 
        orbitSpeed: 0.006,
        hasRing: true,
        info: 'Rotates on its side, icy atmosphere'
    },
    { 
        name: 'Neptune', 
        size: 7.8, 
        distance: 430, 
        color: 0x4166F5, 
        speed: 0.032, 
        orbitSpeed: 0.005,
        info: 'Windiest planet, deep blue color, 14 moons'
    }
];

// Initialize scene
function init() {
    const container = document.getElementById('canvas-container');
    
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    container.appendChild(renderer.domElement);

    // Create starfield
    createStarfield();
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
    scene.add(ambientLight);

    // Create sun
    createSun();
    
    // Create planets
    createPlanets();
    
    // Create asteroid belt
    createAsteroidBelt();
    
    // Create comets
    createComets();
    
    // Camera position
    camera.position.set(0, 150, 300);
    camera.lookAt(0, 0, 0);
    
    // Event listeners
    setupEventListeners();
    
    // Start animation
    animate();
}

function createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    
    for (let i = 0; i < 15000; i++) {
        const radius = 1000 + Math.random() * 3000;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        vertices.push(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        
        const temp = Math.random();
        if (temp > 0.95) {
            colors.push(0.6, 0.8, 1);
        } else if (temp > 0.7) {
            colors.push(1, 0.9, 0.7);
        } else {
            colors.push(1, 1, 1);
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
    });
    
    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(20, 64, 64);
    const sunMaterial = new THREE.MeshStandardMaterial({
  color: 0xfdb813,
  emissive: 0xffaa00,
  emissiveIntensity: 1,
  roughness: 0.4,
  metalness: 0
});
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Sun corona layers
    for (let i = 1; i <= 4; i++) {
        const coronaGeometry = new THREE.SphereGeometry(20 + i * 2, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.15 / i,
            side: THREE.BackSide
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        scene.add(corona);
    }

    sunLight = new THREE.PointLight(0xffffff, 3, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
}

function createPlanets() {
    planetsData.forEach((data) => {
        const planetGroup = new THREE.Group();
        
        // Orbit line
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        for (let i = 0; i <= 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            orbitPoints.push(
                Math.cos(angle) * data.distance,
                0,
                Math.sin(angle) * data.distance
            );
        }
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: 0x555555,
            transparent: true,
            opacity: 0.25
        });
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbit);
        orbitLines.push(orbit);

        // Planet
        const planetGeometry = new THREE.SphereGeometry(data.size, 64, 64);
        const planetMaterial = new THREE.MeshStandardMaterial({ 
            color: data.color,
            roughness: 0.8,
            metalness: 0.2,
            emissive: data.color,
            emissiveIntensity: 0.05
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.x = data.distance;
        planetGroup.add(planet);

        // Atmosphere
        if (data.atmosphere) {
            const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.05, 32, 32);
            const atmosphereMaterial = new THREE.MeshBasicMaterial({
                color: data.name === 'Earth' ? 0x88ccff : 0xffcc88,
                transparent: true,
                opacity: 0.15,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            planet.add(atmosphere);
        }

        // Moon
        if (data.hasMoon) {
            const moonGroup = new THREE.Group();
            const moonGeometry = new THREE.SphereGeometry(1.7, 32, 32);
            const moonMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xC0C0C0,
                roughness: 0.9
            });
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.position.set(12, 0, 0);
            moonGroup.add(moon);
            planet.add(moonGroup);
        }

        // Rings
        if (data.hasRing) {
            const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 2.3, 128);
            const ringMaterial = new THREE.MeshBasicMaterial({ 
                color: data.name === 'Saturn' ? 0xC8B48C : 0x6496C8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: data.name === 'Saturn' ? 0.8 : 0.4
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }

        scene.add(planetGroup);
        planets.push({
            group: planetGroup,
            planet: planet,
            data: data,
            angle: Math.random() * Math.PI * 2,
            mesh: planet
        });
    });
}

function createAsteroidBelt() {
    for (let i = 0; i < 300; i++) {
        const asteroidGeometry = new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.2, 0);
        const asteroidMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 1,
            metalness: 0
        });
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        const angle = Math.random() * Math.PI * 2;
        const distance = 95 + Math.random() * 15;
        asteroid.position.set(
            Math.cos(angle) * distance,
            (Math.random() - 0.5) * 5,
            Math.sin(angle) * distance
        );
        asteroid.userData = {
            angle: angle,
            distance: distance,
            speed: 0.01 + Math.random() * 0.005,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            velocity: new THREE.Vector3()
        };
        scene.add(asteroid);
        asteroids.push(asteroid);
    }
}

function createComets() {
    const cometData = [
        { name: "Halley's Comet", distance: 200, speed: 0.008, inclination: 0.3, color: 0x88ccff },
        { name: "Hale-Bopp", distance: 350, speed: 0.004, inclination: -0.4, color: 0xaaddff },
        { name: "Swift-Tuttle", distance: 280, speed: 0.006, inclination: 0.25, color: 0x99ddff }
    ];

    cometData.forEach((data, index) => {
        const cometGroup = new THREE.Group();
        
        // Comet nucleus
        const nucleusGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const nucleusMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 1,
            emissive: 0x4488ff,
            emissiveIntensity: 0.3
        });
        const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        cometGroup.add(nucleus);
        
        // Coma (glowing aura)
        const comaGeometry = new THREE.SphereGeometry(3, 16, 16);
        const comaMaterial = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const coma = new THREE.Mesh(comaGeometry, comaMaterial);
        cometGroup.add(coma);
        
        // Trail
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = [];
        for (let i = 0; i < 50; i++) {
            trailPositions.push(0, 0, -i * 2);
        }
        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.6,
            linewidth: 2
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        cometGroup.add(trail);
        
        scene.add(cometGroup);
        
        comets.push({
            group: cometGroup,
            nucleus: nucleus,
            coma: coma,
            trail: trail,
            data: data,
            angle: Math.random() * Math.PI * 2,
            verticalAngle: 0
        });
    });
}

function setupEventListeners() {
    // Mouse move
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Mouse click for planet selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(planets.map(p => p.planet));
        
        if (intersects.length > 0) {
            const clickedPlanet = planets.find(p => p.planet === intersects[0].object);
            if (clickedPlanet) {
                state.selectedPlanet = clickedPlanet.data;
                updatePlanetInfo();
            }
        } else {
            state.selectedPlanet = null;
            updatePlanetInfo();
        }
    });

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // UI controls
    document.getElementById('play-pause').addEventListener('click', togglePlayPause);
    document.getElementById('reset').addEventListener('click', reset);
    document.getElementById('toggle-orbits').addEventListener('click', toggleOrbits);
    document.getElementById('toggle-info').addEventListener('click', toggleInfo);
    document.getElementById('toggle-comets').addEventListener('click', toggleComets);

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => zoomCamera(0.8));
    document.getElementById('zoom-out').addEventListener('click', () => zoomCamera(1.2));
    document.getElementById('zoom-reset').addEventListener('click', () => resetZoom());

    // View controls
    document.querySelectorAll('.view-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            setView(view);
        });
    });

    // Event buttons
    document.querySelectorAll('.event-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const event = btn.dataset.event;
            setCosmicEvent(event);
        });
    });
}

function togglePlayPause() {
    state.isPlaying = !state.isPlaying;
    document.getElementById('pause-icon').style.display = state.isPlaying ? 'block' : 'none';
    document.getElementById('play-icon').style.display = state.isPlaying ? 'none' : 'block';
}

function reset() {
    state.selectedPlanet = null;
    state.cameraMode = 'free';
    state.chaosMode = null;
    state.chaosTime = 0;
    
    planets.forEach(p => {
        p.angle = Math.random() * Math.PI * 2;
        p.planet.scale.set(1, 1, 1);
        p.planet.material.emissiveIntensity = 0.05;
        p.group.position.y = 0;
    });
    
    asteroids.forEach(asteroid => {
        asteroid.userData.velocity.set(0, 0, 0);
    });
    
    updatePlanetInfo();
    updateEventButtons();
    updateEventAlert();
    document.getElementById('toggle-cinematic').classList.remove('active');
}

function toggleOrbits() {
    state.showOrbits = !state.showOrbits;
    orbitLines.forEach(orbit => {
        orbit.visible = state.showOrbits;
    });
    document.getElementById('toggle-orbits').classList.toggle('active', state.showOrbits);
}

function toggleInfo() {
    state.showInfo = !state.showInfo;
    updatePlanetInfo();
    document.getElementById('toggle-info').classList.toggle('active', state.showInfo);
}

function toggleComets() {
    state.showComets = !state.showComets;
    comets.forEach(comet => {
        comet.group.visible = state.showComets;
    });
    document.getElementById('toggle-comets').classList.toggle('active', state.showComets);
}

function zoomCamera(factor) {
    state.zoom *= factor;
    state.zoom = Math.max(0.3, Math.min(state.zoom, 3));
}

function resetZoom() {
    state.zoom = 1;
}

function setView(view) {
    state.cameraMode = view;
    
    // Update button states
    document.querySelectorAll('.view-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Set camera target based on view
    switch(view) {
        case 'top':
            targetCameraPosition.set(0, 500, 0);
            targetCameraLookAt.set(0, 0, 0);
            break;
        case 'side':
            targetCameraPosition.set(600, 50, 0);
            targetCameraLookAt.set(0, 0, 0);
            break;
        case 'free':
            targetCameraPosition.set(0, 150, 300);
            targetCameraLookAt.set(0, 0, 0);
            break;
        case 'cinematic':
            // Handled in animation loop
            break;
    }
}

function toggleCinematic() {
    setView(state.cameraMode === 'cinematic' ? 'free' : 'cinematic');
}

function setCosmicEvent(event) {
    if (state.chaosMode === event) {
        state.chaosMode = null;
        state.chaosTime = 0;
    } else {
        state.chaosMode = event;
        state.chaosTime = 0;
    }
    
    // Reset planet scales and effects
    if (state.chaosMode !== 'orbital_resonance') {
        planets.forEach(p => p.planet.scale.set(1, 1, 1));
    }
    
    if (state.chaosMode !== 'asteroid_impact') {
        asteroids.forEach(asteroid => {
            asteroid.userData.velocity.set(0, 0, 0);
        });
    }
    
    updateEventButtons();
    updateEventAlert();
}

function updateEventButtons() {
    document.querySelectorAll('.event-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.event === state.chaosMode);
    });
}

function updateEventAlert() {
    const alert = document.getElementById('event-alert');
    const text = document.getElementById('event-text');
    
    if (state.chaosMode) {
        const messages = {
            'solar_storm': '☀️ SOLAR STORM IN PROGRESS',
            'rogue_planet': '🌑 ROGUE PLANET DETECTED',
            'orbital_resonance': '🔄 ORBITAL RESONANCE ACTIVE',
            'asteroid_impact': '💥 ASTEROID STORM WARNING',
            'gravity_waves': '🌊 GRAVITATIONAL ANOMALY',
            'time_lapse': '⚡ TIME ACCELERATION: 50X'
        };
        text.textContent = messages[state.chaosMode];
        alert.style.display = 'block';
    } else {
        alert.style.display = 'none';
    }
}

function updatePlanetInfo() {
    const infoPanel = document.getElementById('planet-info');
    
    if (state.selectedPlanet && state.showInfo) {
        document.getElementById('planet-name').textContent = state.selectedPlanet.name;
        document.getElementById('planet-description').textContent = state.selectedPlanet.info;
        document.getElementById('planet-diameter').textContent = `Diameter: ${state.selectedPlanet.size * 10}k km`;
        document.getElementById('planet-distance').textContent = `Distance: ${state.selectedPlanet.distance}M km`;
        infoPanel.style.display = 'block';
    } else {
        infoPanel.style.display = 'none';
    }
}

// Animation loop
let lastTime = performance.now();
const clock = new THREE.Clock();

function animate() {
    animationId = requestAnimationFrame(animate);

    if (state.isPlaying) {
        const delta = clock.getDelta();
        state.time += delta;
        state.chaosTime += delta;

        // Rotate sun
        sun.rotation.y += 0.0005;

        // Solar storm effect
        if (state.chaosMode === 'solar_storm') {
            const flareIntensity = 1 + Math.sin(state.chaosTime * 3) * 0.5;
            sunLight.intensity = 3 * flareIntensity;
            sun.material.emissiveIntensity = flareIntensity;
        } else {
            sunLight.intensity = 3;
            sun.material.emissiveIntensity = 1;
        }

        // Star twinkle effect (optimized - less frequent)
        if (Math.random() > 0.98) {
            const colors = stars.geometry.attributes.color.array;
            const idx = Math.floor(Math.random() * (colors.length / 3)) * 3;
            colors[idx + 2] = Math.random() * 0.5 + 0.5;
            stars.geometry.attributes.color.needsUpdate = true;
        }

        // Update planets
        planets.forEach((p, idx) => {
            let orbitMultiplier = 1;
            let wobble = 0;
            
            // Apply chaos effects
            if (state.chaosMode === 'rogue_planet') {
                const rogueDist = Math.sqrt(
                    Math.pow(p.group.position.x + 200, 2) + 
                    Math.pow(p.group.position.z, 2)
                );
                const disruption = Math.max(0, 1 - rogueDist / 300);
                wobble = Math.sin(state.chaosTime * 2 + idx) * disruption * 20;
                orbitMultiplier = 1 + disruption * 0.5;
            } else if (state.chaosMode === 'orbital_resonance') {
                const resonance = Math.sin(state.chaosTime + idx * 0.5);
                orbitMultiplier = 1 + resonance * 0.3;
                p.planet.scale.setScalar(1 + resonance * 0.1);
            } else if (state.chaosMode === 'time_lapse') {
                orbitMultiplier = 50;
            } else if (state.chaosMode === 'solar_storm') {
                wobble = Math.sin(state.chaosTime * 5 + idx) * 3;
                p.planet.material.emissiveIntensity = 0.3 + Math.sin(state.chaosTime * 4) * 0.2;
            } else if (state.chaosMode === 'asteroid_impact') {
                if (Math.random() < 0.002) {
                    const impactForce = (Math.random() - 0.5) * 2;
                    p.planet.rotation.x += impactForce;
                    p.planet.rotation.z += impactForce;
                }
            } else if (state.chaosMode === 'gravity_waves') {
                const wave = Math.sin(state.chaosTime * 2 - p.data.distance * 0.05);
                wobble = wave * 15;
                p.group.position.y = wave * 10;
            }
            
            // Update orbit
            p.angle += p.data.orbitSpeed * 0.01 * orbitMultiplier;
            p.group.position.x = Math.cos(p.angle) * (p.data.distance + wobble);
            p.group.position.z = Math.sin(p.angle) * (p.data.distance + wobble);
            
            // Rotate planet
            p.planet.rotation.y += p.data.speed * 0.01 * (state.chaosMode === 'time_lapse' ? 20 : 1);
            
            // Update moon
            if (p.data.hasMoon) {
                const moonGroup = p.planet.children.find(c => c.type === 'Group');
                if (moonGroup) {
                    moonGroup.rotation.y += 0.02 * (state.chaosMode === 'time_lapse' ? 20 : 1);
                }
            }
        });

        // Update asteroids
        asteroids.forEach(asteroid => {
            if (state.chaosMode === 'asteroid_impact') {
                asteroid.userData.velocity.x += (Math.random() - 0.5) * 0.1;
                asteroid.userData.velocity.y += (Math.random() - 0.5) * 0.1;
                asteroid.userData.velocity.z += (Math.random() - 0.5) * 0.1;
                asteroid.position.x += asteroid.userData.velocity.x;
                asteroid.position.y += asteroid.userData.velocity.y;
                asteroid.position.z += asteroid.userData.velocity.z;
                asteroid.userData.velocity.multiplyScalar(0.98);
            } else if (state.chaosMode === 'time_lapse') {
                asteroid.userData.angle += asteroid.userData.speed * 30;
                asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.distance;
                asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.distance;
            } else {
                asteroid.userData.angle += asteroid.userData.speed;
                asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.distance;
                asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.distance;
            }
            asteroid.rotation.x += asteroid.userData.rotationSpeed;
            asteroid.rotation.y += asteroid.userData.rotationSpeed * 0.7;
        });

        // Update comets
        comets.forEach((comet, idx) => {
            const speedMultiplier = state.chaosMode === 'time_lapse' ? 20 : 1;
            
            // Orbit
            comet.angle += comet.data.speed * speedMultiplier;
            comet.verticalAngle += comet.data.speed * 0.5 * speedMultiplier;
            
            const x = Math.cos(comet.angle) * comet.data.distance;
            const z = Math.sin(comet.angle) * comet.data.distance;
            const y = Math.sin(comet.verticalAngle) * comet.data.distance * comet.data.inclination;
            
            comet.group.position.set(x, y, z);
            
            // Make comet always point away from sun
            const directionToSun = new THREE.Vector3(0, 0, 0).sub(comet.group.position).normalize();
            comet.group.lookAt(0, 0, 0);
            comet.group.rotateY(Math.PI);
            
            // Pulsing coma effect
            const pulse = 1 + Math.sin(state.time * 2 + idx) * 0.2;
            comet.coma.scale.setScalar(pulse);
            
            // Update trail positions to follow comet
            const positions = comet.trail.geometry.attributes.position.array;
            for (let i = positions.length - 3; i >= 3; i -= 3) {
                positions[i] = positions[i - 3];
                positions[i + 1] = positions[i - 2];
                positions[i + 2] = positions[i - 1];
            }
            positions[0] = 0;
            positions[1] = 0;
            positions[2] = 0;
            comet.trail.geometry.attributes.position.needsUpdate = true;
        });

        // Update camera
        if (state.cameraMode === 'free') {
            const targetX = mouseX * 100;
            const targetY = 150 + mouseY * 50;
            targetCameraPosition.set(targetX, targetY, 300);
            camera.position.lerp(targetCameraPosition, 0.02);
            camera.lookAt(0, 0, 0);
        } else if (state.cameraMode === 'cinematic') {
            const radius = 250;
            camera.position.x = Math.cos(state.time * 0.1) * radius;
            camera.position.z = Math.sin(state.time * 0.1) * radius;
            camera.position.y = 120 + Math.sin(state.time * 0.05) * 40;
            camera.lookAt(0, 0, 0);
        } else if (state.cameraMode === 'top' || state.cameraMode === 'side') {
            camera.position.lerp(targetCameraPosition, 0.05);
            camera.lookAt(targetCameraLookAt);
        } else if (state.cameraMode === 'follow' && state.selectedPlanet) {
            const planet = planets.find(p => p.data.name === state.selectedPlanet.name);
            if (planet) {
                const targetPos = planet.group.position.clone();
                targetPos.y += planet.data.size * 3;
                targetPos.z += planet.data.size * 4;
                camera.position.lerp(targetPos, 0.02);
                camera.lookAt(planet.group.position);
            }
        }
        
        // Apply zoom
        const baseDistance = camera.position.length();
        const targetDistance = (300 / state.zoom);
        if (state.cameraMode !== 'cinematic') {
            const direction = camera.position.clone().normalize();
            const currentDist = camera.position.length();
            const newDist = currentDist + (targetDistance - currentDist) * 0.1;
            camera.position.copy(direction.multiplyScalar(newDist));
        }
    }

    renderer.render(scene, camera);
}

// Cleanup function
function cleanup() {
    cancelAnimationFrame(animationId);
    
    // Dispose geometries and materials
    scene.traverse((object) => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    });
    
    renderer.dispose();
}

// Handle page visibility to pause when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        state.isPlaying = false;
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
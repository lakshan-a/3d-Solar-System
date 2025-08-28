// App.jsx
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { format } from 'date-fns';
import gsap from 'gsap';

// Import local textures
import mercuryTexture from '../assets/images/mercury/2k_mercury.jpg';
import venusTexture from '../assets/images/venus/2k_venus.jpg';
import earthTexture from '../assets/images/earth/2k_earth_daymap.jpg';
import marsTexture from '../assets/images/mars/2k_mars.jpg';
import jupiterTexture from '../assets/images/jupiter/2k_jupiter.jpg';
import saturnTexture from '../assets/images/saturn/2k_saturn.jpg';
import uranusTexture from '../assets/images/uranus/2k_uranus.jpg';
import neptuneTexture from '../assets/images/neptune/2k_neptune.jpg';
import saturnRingTexture from '../assets/images/saturn/2k_saturn_ring_alpha.png';
import galaxyTexture from '../assets/images/2k_stars_milky_way.jpg';
import sunTexture from '../assets/images/sun/2k_sun.jpg';

const GalaxyPlanets = () => {
    const canvasRef = useRef(null);
    const [selectedPlanet, setSelectedPlanet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const planetsRef = useRef([]);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const mouse = useMemo(() => new THREE.Vector2(), []);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const originalCameraPosition = useRef(new THREE.Vector3(0, 100, 300));
    const originalControlsTarget = useRef(new THREE.Vector3(0, 0, 0));

    // Planet information - NASA data
    const planetInfo = useMemo(() => ({
        Mercury: {
            description: "The smallest planet in our solar system and closest to the Sun. Mercury is only slightly larger than Earth's Moon.",
            diameter: "4,879 km",
            mass: "3.3 × 10^23 kg",
            distance: "57.9 million km",
            orbit: "88 Earth days",
            day: "59 Earth days",
            moons: 0,
            type: "Terrestrial",
            temp: "430°C (day), -180°C (night)",
            orbitalPeriod: 0.240846, // Earth years
            orbitalRadius: 0.387, // AU
        },
        Venus: {
            description: "The second planet from the Sun. Venus is Earth's closest planetary neighbor and the hottest planet in our solar system.",
            diameter: "12,104 km",
            mass: "4.87 × 10^24 kg",
            distance: "108.2 million km",
            orbit: "225 Earth days",
            day: "243 Earth days",
            moons: 0,
            type: "Terrestrial",
            temp: "471°C",
            orbitalPeriod: 0.615, // Earth years
            orbitalRadius: 0.723, // AU
        },
        Earth: {
            description: "Our home planet is the only place we know of so far that's inhabited by living things. It's also the only planet with liquid water on its surface.",
            diameter: "12,742 km",
            mass: "5.97 × 10^24 kg",
            distance: "149.6 million km",
            orbit: "365.25 days",
            day: "24 hours",
            moons: 1,
            type: "Terrestrial",
            temp: "15°C",
            orbitalPeriod: 1, // Earth years
            orbitalRadius: 1, // AU
        },
        Mars: {
            description: "The fourth planet from the Sun. Mars is a dusty, cold, desert world with a very thin atmosphere.",
            diameter: "6,779 km",
            mass: "6.42 × 10^23 kg",
            distance: "227.9 million km",
            orbit: "687 Earth days",
            day: "24.6 hours",
            moons: 2,
            type: "Terrestrial",
            temp: "-65°C",
            orbitalPeriod: 1.881, // Earth years
            orbitalRadius: 1.523, // AU
        },
        Jupiter: {
            description: "The largest planet in our solar system. Jupiter is a gas giant with a mass more than twice that of all other planets combined.",
            diameter: "139,820 km",
            mass: "1.90 × 10^27 kg",
            distance: "778.5 million km",
            orbit: "12 Earth years",
            day: "9.9 hours",
            moons: 79,
            type: "Gas Giant",
            temp: "-145°C",
            orbitalPeriod: 11.86, // Earth years
            orbitalRadius: 5.203, // AU
        },
        Saturn: {
            description: "The sixth planet from the Sun and the second-largest in our solar system. Adorned with a dazzling system of icy rings.",
            diameter: "116,460 km",
            mass: "5.68 × 10^26 kg",
            distance: "1.4 billion km",
            orbit: "29 Earth years",
            day: "10.7 hours",
            moons: 82,
            type: "Gas Giant",
            temp: "-178°C",
            orbitalPeriod: 29.46, // Earth years
            orbitalRadius: 9.537, // AU
        },
        Uranus: {
            description: "The seventh planet from the Sun. Uranus is an ice giant and rotates on its side, unlike other planets.",
            diameter: "50,724 km",
            mass: "8.68 × 10^25 kg",
            distance: "2.9 billion km",
            orbit: "84 Earth years",
            day: "17.2 hours",
            moons: 27,
            type: "Ice Giant",
            temp: "-224°C",
            orbitalPeriod: 84.01, // Earth years
            orbitalRadius: 19.191, // AU
        },
        Neptune: {
            description: "The eighth and most distant planet from the Sun. Neptune is an ice giant and the first planet located through mathematical calculations.",
            diameter: "49,244 km",
            mass: "1.02 × 10^26 kg",
            distance: "4.5 billion km",
            orbit: "165 Earth years",
            day: "16.1 hours",
            moons: 14,
            type: "Ice Giant",
            temp: "-214°C",
            orbitalPeriod: 164.8, // Earth years
            orbitalRadius: 30.069, // AU
        }
    }), []);

    // Handle planet selection
    const handlePlanetSelect = (planet) => {
        const planetObj = planetsRef.current.find(p => p.userData.name === planet);

        if (planetObj && cameraRef.current && controlsRef.current) {
            setSelectedPlanet(planet);

            // Calculate position behind and above the planet
            const planetPosition = planetObj.position.clone();
            const offset = new THREE.Vector3(0, planetObj.userData.size * 1.5, planetObj.userData.size * 3);
            offset.applyQuaternion(cameraRef.current.quaternion);

            const targetPosition = planetPosition.clone().add(offset);

            // Animate camera to planet
            gsap.to(cameraRef.current.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => {
                    controlsRef.current.target.copy(planetPosition);
                    controlsRef.current.update();
                }
            });
        }
    };

    // Handle going back to overview
    const handleBackToOverview = () => {
        if (cameraRef.current && controlsRef.current) {
            setSelectedPlanet(null);

            gsap.to(cameraRef.current.position, {
                x: originalCameraPosition.current.x,
                y: originalCameraPosition.current.y,
                z: originalCameraPosition.current.z,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => {
                    controlsRef.current.target.copy(originalControlsTarget.current);
                    controlsRef.current.update();
                }
            });
        }
    };

    // Calculate real-time planet position
    const getPlanetPosition = (planetData, date) => {
        // Scale factor for visualization (1 AU = 50 units)
        const AU_SCALE = 50;
        const orbitalRadius = planetData.orbitalRadius * AU_SCALE;

        // Calculate position based on current time
        const now = date || new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now - startOfYear;
        const oneYear = 1000 * 60 * 60 * 24 * 365.25;
        const fractionOfYear = diff / oneYear;

        // Calculate orbital angle based on orbital period
        const angle = (fractionOfYear / planetData.orbitalPeriod) * Math.PI * 2;

        return {
            x: Math.cos(angle) * orbitalRadius,
            z: Math.sin(angle) * orbitalRadius,
            angle
        };
    };

    useEffect(() => {
        // Initialize Three.js
        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;

        const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 2000);
        camera.position.set(0, 100, 300);
        cameraRef.current = camera;
        originalCameraPosition.current.copy(camera.position);

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 50;
        controls.maxDistance = 500;
        controls.autoRotate = false;
        controlsRef.current = controls;
        originalControlsTarget.current.copy(controls.target);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x333333, 1);
        scene.add(ambientLight);

        const sunLight = new THREE.PointLight(0xffffff, 2, 500);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // Create sun with texture
        const sunGeometry = new THREE.SphereGeometry(20, 64, 64);
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(sunTexture),
            emissive: 0xf39c12,
            emissiveIntensity: 2
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Sun glow effect
        const sunGlowGeometry = new THREE.SphereGeometry(25, 32, 32);
        const sunGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xf39c12,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
        scene.add(sunGlow);

        // Create galaxy background
        const galaxyLoader = new THREE.TextureLoader();
        const galaxyMat = new THREE.MeshBasicMaterial({
            map: galaxyLoader.load(galaxyTexture),
            side: THREE.BackSide,
            transparent: true
        });
        const galaxyGeo = new THREE.SphereGeometry(2000, 64, 64);
        const galaxy = new THREE.Mesh(galaxyGeo, galaxyMat);
        scene.add(galaxy);

        // Create planets with local textures
        const textureLoader = new THREE.TextureLoader();
        const textures = {
            mercury: textureLoader.load(mercuryTexture),
            venus: textureLoader.load(venusTexture),
            earth: textureLoader.load(earthTexture),
            mars: textureLoader.load(marsTexture),
            jupiter: textureLoader.load(jupiterTexture),
            saturn: textureLoader.load(saturnTexture),
            uranus: textureLoader.load(uranusTexture),
            neptune: textureLoader.load(neptuneTexture),
            saturnRing: textureLoader.load(saturnRingTexture)
        };

        const createPlanets = () => {
            const planets = [
                { name: 'Mercury', size: 3.2, texture: textures.mercury, tilt: 0.034, ...planetInfo.Mercury },
                { name: 'Venus', size: 5.9, texture: textures.venus, tilt: 177.3, ...planetInfo.Venus },
                { name: 'Earth', size: 6.2, texture: textures.earth, tilt: 23.44, ...planetInfo.Earth },
                { name: 'Mars', size: 4.5, texture: textures.mars, tilt: 25.19, ...planetInfo.Mars },
                { name: 'Jupiter', size: 12, texture: textures.jupiter, tilt: 3.13, ...planetInfo.Jupiter },
                { name: 'Saturn', size: 10, texture: textures.saturn, hasRings: true, tilt: 26.73, ...planetInfo.Saturn },
                { name: 'Uranus', size: 8, texture: textures.uranus, tilt: 97.77, ...planetInfo.Uranus },
                { name: 'Neptune', size: 7.8, texture: textures.neptune, tilt: 28.32, ...planetInfo.Neptune },
            ];

            return planets.map(planet => {
                const geometry = new THREE.SphereGeometry(planet.size, 64, 64);
                const material = new THREE.MeshStandardMaterial({
                    map: planet.texture,
                    roughness: 0.8,
                    metalness: 0.2,
                    bumpScale: 0.05
                });

                const planetMesh = new THREE.Mesh(geometry, material);

                // Set initial position based on current time
                const pos = getPlanetPosition(planet);
                planetMesh.position.set(pos.x, 0, pos.z);
                scene.add(planetMesh);

                // Add orbit path
                const orbitGeometry = new THREE.BufferGeometry();
                const orbitMaterial = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.2,
                    linewidth: 1
                });

                const points = [];
                const orbitalRadius = planet.orbitalRadius * 50; // 1 AU = 50 units
                for (let i = 0; i <= 128; i++) {
                    const theta = (i / 128) * Math.PI * 2;
                    points.push(
                        Math.cos(theta) * orbitalRadius,
                        0,
                        Math.sin(theta) * orbitalRadius
                    );
                }

                orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
                const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
                scene.add(orbit);

                // Add rings to Saturn
                if (planet.hasRings) {
                    const ringGeometry = new THREE.RingGeometry(planet.size + 3, planet.size + 6, 64);
                    const ringMaterial = new THREE.MeshBasicMaterial({
                        map: textures.saturnRing,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8
                    });
                    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                    rings.rotation.x = Math.PI / 3;
                    planetMesh.add(rings);
                }

                // Store planet properties
                planetMesh.userData = {
                    name: planet.name,
                    size: planet.size,
                    distance: orbitalRadius,
                    speed: 0.02 / planet.orbitalPeriod,
                    angle: pos.angle,
                    tilt: planet.tilt
                };

                return planetMesh;
            });
        };

        const planets = createPlanets();
        planetsRef.current = planets;

        // Bloom effect for stars and sun
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
            1.2,
            0.4,
            0.85
        );
        composer.addPass(bloomPass);

        // Handle planet selection via click
        const handleClick = (event) => {
            mouse.x = (event.clientX / canvas.clientWidth) * 2 - 1;
            mouse.y = - (event.clientY / canvas.clientHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(planetsRef.current);

            if (intersects.length > 0) {
                handlePlanetSelect(intersects[0].object.userData.name);
            }
        };

        canvas.addEventListener('click', handleClick);

        // Animation loop
        const clock = new THREE.Clock();
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();

            // Rotate planets
            planets.forEach(planetMesh => {
                const planet = planetMesh.userData;
                planet.angle += planet.speed * delta * 30;
                planetMesh.position.x = Math.cos(planet.angle) * planet.distance;
                planetMesh.position.z = Math.sin(planet.angle) * planet.distance;
                planetMesh.rotation.y += 0.005 * delta * 30;

                // Apply axial tilt
                if (planet.name === 'Uranus') {
                    planetMesh.rotation.x = THREE.MathUtils.degToRad(planet.tilt);
                } else {
                    planetMesh.rotation.z = THREE.MathUtils.degToRad(planet.tilt);
                }

                // Rotate rings for Saturn
                if (planet.name === 'Saturn' && planetMesh.children.length > 0) {
                    planetMesh.children[0].rotation.z += 0.002 * delta * 30;
                }
            });

            // Rotate sun
            sun.rotation.y += 0.001 * delta * 30;
            sunGlow.rotation.y += 0.001 * delta * 30;

            // Rotate galaxy background slowly
            galaxy.rotation.y += 0.0001 * delta * 30;

            controls.update();
            composer.render();
        };

        // Handle window resize
        const handleResize = () => {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            composer.setSize(canvas.clientWidth, canvas.clientHeight);
            bloomPass.setSize(canvas.clientWidth, canvas.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Update time every second
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Start animation when textures are loaded
        const checkTexturesLoaded = () => {
            const allTextures = Object.values(textures);
            const loaded = allTextures.every(texture => texture.image && texture.image.complete);
            if (loaded) {
                animate();
                setIsLoading(false);
            } else {
                setTimeout(checkTexturesLoaded, 100);
            }
        };

        checkTexturesLoaded();

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('click', handleClick);
            clearInterval(timeInterval);
            controls.dispose();
            renderer.dispose();
            composer.dispose();
        };
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />

            {/* Loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-blue-400 text-xl font-medium">Building your galaxy...</p>
                    </div>
                </div>
            )}

            {/* NASA-style header */}
            <div className="absolute top-4 left-4 flex items-center">
                <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-3 flex items-center">
                    <div className="w-10 h-10 mr-3">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">NASA Solar System Explorer</h1>
                        <p className="text-blue-300 text-sm">{format(currentTime, "MMMM dd, yyyy")} | {format(currentTime, "HH:mm:ss")} UTC</p>
                    </div>
                </div>
            </div>

            {/* Planet selector */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="bg-black bg-opacity-60 backdrop-blur-lg rounded-xl p-3 max-w-4xl overflow-x-auto">
                    <div className="flex space-x-4">
                        {['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].map(planet => (
                            <button
                                key={planet}
                                onClick={() => handlePlanetSelect(planet)}
                                className={`flex flex-col items-center p-2 rounded-lg min-w-[80px] transition-all ${
                                    selectedPlanet === planet
                                        ? 'bg-blue-600 transform scale-105 shadow-lg shadow-blue-500/30'
                                        : 'bg-gray-800 hover:bg-gray-700'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1">
                                    <div className="w-6 h-6 rounded-full" style={{
                                        backgroundColor: planet === 'Mercury' ? '#8a7f80' :
                                            planet === 'Venus' ? '#e39e1c' :
                                                planet === 'Earth' ? '#3498db' :
                                                    planet === 'Mars' ? '#e74c3c' :
                                                        planet === 'Jupiter' ? '#f1c40f' :
                                                            planet === 'Saturn' ? '#f39c12' :
                                                                planet === 'Uranus' ? '#1abc9c' : '#2980b9'
                                    }}></div>
                                </div>
                                <span className="text-xs text-white font-medium">{planet}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Planet info panel */}
            {selectedPlanet && (
                <div className="absolute top-20 right-4 w-full max-w-md z-40">
                    <div className="bg-black bg-opacity-80 backdrop-blur-xl rounded-xl p-5 border border-blue-500/30 shadow-2xl shadow-blue-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <div className="w-6 h-6 rounded-full mr-3" style={{
                                    backgroundColor: selectedPlanet === 'Mercury' ? '#8a7f80' :
                                        selectedPlanet === 'Venus' ? '#e39e1c' :
                                            selectedPlanet === 'Earth' ? '#3498db' :
                                                selectedPlanet === 'Mars' ? '#e74c3c' :
                                                    selectedPlanet === 'Jupiter' ? '#f1c40f' :
                                                        selectedPlanet === 'Saturn' ? '#f39c12' :
                                                            selectedPlanet === 'Uranus' ? '#1abc9c' : '#2980b9'
                                }}></div>
                                {selectedPlanet}
                            </h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleBackToOverview}
                                    className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1 rounded-full"
                                    title="Back to overview"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setSelectedPlanet(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <p className="text-blue-200 mb-5">{planetInfo[selectedPlanet].description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Diameter</p>
                                <p className="text-white font-medium">{planetInfo[selectedPlanet].diameter}</p>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Mass</p>
                                <p className="text-white font-medium">{planetInfo[selectedPlanet].mass}</p>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Distance from Sun</p>
                                <p className="text-white font-medium">{planetInfo[selectedPlanet].distance}</p>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Orbital Period</p>
                                <p className="text-white font-medium">{planetInfo[selectedPlanet].orbit}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-blue-300 font-semibold mb-3">Additional Information</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-gray-400 text-sm">Day Length</p>
                                    <p className="text-white">{planetInfo[selectedPlanet].day}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Moons</p>
                                    <p className="text-white">{planetInfo[selectedPlanet].moons}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Planet Type</p>
                                    <p className="text-white">{planetInfo[selectedPlanet].type}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Avg. Temperature</p>
                                    <p className="text-white">{planetInfo[selectedPlanet].temp}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation help */}
            {!selectedPlanet && (
                <div className="absolute bottom-20 left-0 right-0 flex justify-center">
                    <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-xl p-3 max-w-md text-center">
                        <p className="text-blue-200 text-sm">
                            <span className="inline-block bg-blue-900/50 px-2 py-1 rounded mr-2">Click + Drag</span> Rotate view
                            <span className="mx-3">•</span>
                            <span className="inline-block bg-blue-900/50 px-2 py-1 rounded mr-2">Scroll</span> Zoom in/out
                            <span className="mx-3">•</span>
                            <span className="inline-block bg-blue-900/50 px-2 py-1 rounded">Click planets</span> for details
                        </p>
                    </div>
                </div>
            )}

            {/* NASA footer */}
            <div className="absolute bottom-4 right-4 flex items-center bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                <span className="text-green-400 text-xs">LIVE: Real-time simulation</span>
            </div>
        </div>
    );
};

export default GalaxyPlanets;
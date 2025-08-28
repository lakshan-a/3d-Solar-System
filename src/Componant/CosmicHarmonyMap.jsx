import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

const CosmicHarmonyMap = () => {
    const mountRef = useRef(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('Loading current time...');
    const [selectedPlanet, setSelectedPlanet] = useState('earth');
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    const [isLoadingComplete, setIsLoadingComplete] = useState(false);

    // Planet data with more details
    const planets = {
        sun: {
            size: 6,
            color: 0xfdb813,
            position: [0, 0, 0],
            type: "Star",
            diameter: "1,391,400 km",
            mass: "1.989 × 10³⁰ kg",
            gravity: "274 m/s²",
            day: "25.4 days (equator)",
            year: "N/A",
            temp: "5,500°C (surface)",
            moons: "0",
            desc: "The Sun is the star at the center of our solar system, accounting for 99.86% of its total mass. Its gravitational pull governs the orbits of all planets.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/sun-blasts-a-mighty-solar-flare-sdo-1.jpeg"
        },
        mercury: {
            size: 0.8,
            color: 0xb5b5b5,
            position: [15, 0, 0],
            type: "Terrestrial",
            diameter: "4,880 km",
            mass: "3.30 × 10²³ kg",
            gravity: "3.7 m/s²",
            day: "58.6 Earth days",
            year: "88 Earth days",
            temp: "-173°C to 427°C",
            moons: "0",
            desc: "Mercury is the smallest and innermost planet in the Solar System. It has no atmosphere to retain heat, leading to extreme temperature variations between day and night.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/mercury-messenger-globe-1.jpeg"
        },
        venus: {
            size: 0.95,
            color: 0xe6b856,
            position: [20, 0, 0],
            type: "Terrestrial",
            diameter: "12,104 km",
            mass: "4.87 × 10²⁴ kg",
            gravity: "8.87 m/s²",
            day: "243 Earth days",
            year: "225 Earth days",
            temp: "462°C",
            moons: "0",
            desc: "Venus is the second planet from the Sun, similar in size to Earth but with a toxic atmosphere of mostly carbon dioxide. Its surface is hidden beneath thick clouds of sulfuric acid.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/venus-magellan-colorized-1.jpeg"
        },
        earth: {
            size: 1,
            color: 0x6b93d6,
            position: [25, 0, 0],
            type: "Terrestrial",
            diameter: "12,742 km",
            mass: "5.97 × 10²⁴ kg",
            gravity: "9.8 m/s²",
            day: "24 hours",
            year: "365.25 days",
            temp: "-88°C to 58°C",
            moons: "1",
            desc: "Earth is the third planet from the Sun and the only known astronomical object to harbor life. About 71% of its surface is covered with water, giving it a blue appearance from space.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/earth-blue-marble-1.jpeg"
        },
        mars: {
            size: 0.9,
            color: 0xe27b58,
            position: [30, 0, 0],
            type: "Terrestrial",
            diameter: "6,779 km",
            mass: "6.39 × 10²³ kg",
            gravity: "3.7 m/s²",
            day: "24.6 hours",
            year: "687 Earth days",
            temp: "-153°C to 20°C",
            moons: "2",
            desc: "Mars is the fourth planet from the Sun, known as the Red Planet due to iron oxide on its surface. It has the largest volcano and canyon in the solar system.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/mars-globe-valles-marineris-enhanced-1.jpeg"
        },
        jupiter: {
            size: 2.5,
            color: 0xe3b78e,
            position: [40, 0, 0],
            type: "Gas Giant",
            diameter: "139,820 km",
            mass: "1.90 × 10²⁷ kg",
            gravity: "24.8 m/s²",
            day: "9.9 hours",
            year: "11.9 Earth years",
            temp: "-108°C",
            moons: "79",
            desc: "Jupiter is the largest planet in the Solar System, a gas giant with a Great Red Spot storm that has raged for at least 400 years. Its strong magnetic field creates intense radiation belts.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/jupiter-juno-enhanced-color-1.jpeg"
        },
        saturn: {
            size: 2,
            color: 0xf5e3b9,
            position: [50, 0, 0],
            hasRing: true,
            type: "Gas Giant",
            diameter: "116,460 km",
            mass: "5.68 × 10²⁶ kg",
            gravity: "10.4 m/s²",
            day: "10.7 hours",
            year: "29.5 Earth years",
            temp: "-139°C",
            moons: "82",
            desc: "Saturn is the sixth planet from the Sun, famous for its prominent ring system made of ice particles and rocky debris. It's the least dense planet in our solar system.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/saturn-cassini-1.jpeg"
        },
        uranus: {
            size: 1.5,
            color: 0xd1f1f9,
            position: [60, 0, 0],
            type: "Ice Giant",
            diameter: "50,724 km",
            mass: "8.68 × 10²⁵ kg",
            gravity: "8.7 m/s²",
            day: "17.2 hours",
            year: "84 Earth years",
            temp: "-197°C",
            moons: "27",
            desc: "Uranus is the seventh planet from the Sun, an ice giant with a tilted rotation axis that causes extreme seasons. Its atmosphere contains methane, giving it a blue-green color.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/uranus-voyager-1.jpeg"
        },
        neptune: {
            size: 1.5,
            color: 0x5b5ddf,
            position: [70, 0, 0],
            type: "Ice Giant",
            diameter: "49,244 km",
            mass: "1.02 × 10²⁶ kg",
            gravity: "11.2 m/s²",
            day: "16.1 hours",
            year: "164.8 Earth years",
            temp: "-201°C",
            moons: "14",
            desc: "Neptune is the eighth and farthest known planet from the Sun, with the strongest winds in the Solar System reaching speeds of 2,100 km/h. It was the first planet located through mathematical predictions.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/neptune-voyager-1.jpeg"
        },
        pluto: {
            size: 0.5,
            color: 0xffffff,
            position: [80, 0, 0],
            type: "Dwarf Planet",
            diameter: "2,377 km",
            mass: "1.30 × 10²² kg",
            gravity: "0.62 m/s²",
            day: "6.4 Earth days",
            year: "248 Earth years",
            temp: "-233°C",
            moons: "5",
            desc: "Pluto is a dwarf planet in the Kuiper belt, once considered the ninth planet from the Sun. It has a complex terrain with mountains, valleys, plains, and glaciers.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/pluto-new-horizons-1.jpeg"
        }
    };

    // Auspicious times data
    const auspiciousTimes = {
        mercury: { start: 6, end: 8 },    // 6am to 8am
        venus: { start: 9.5, end: 11.5 }, // 9:30am to 11:30am
        mars: { start: 13, end: 15 },     // 1pm to 3pm
        jupiter: { start: 16, end: 18 },  // 4pm to 6pm
        saturn: { start: 19, end: 21 },   // 7pm to 9pm
        sun: { start: 6, end: 7 },        // Sunrise time approximation
        moon: { start: 20, end: 21 }      // Moonrise time approximation
    };

    // Update current time display
    const updateCurrentTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        setCurrentTime(`${hours}:${minutes}:${seconds} | ${dateStr}`);
    };

    useEffect(() => {
        // Simulate loading progress
        const loadingInterval = setInterval(() => {
            setLoadingProgress(prev => {
                const newProgress = prev + Math.random() * 10;
                if (newProgress >= 100) {
                    clearInterval(loadingInterval);
                    setTimeout(() => setIsLoadingComplete(true), 500);
                    return 100;
                }
                return newProgress;
            });
        }, 100);

        // Set up time updates
        updateCurrentTime();
        const timeInterval = setInterval(updateCurrentTime, 1000);

        return () => {
            clearInterval(loadingInterval);
            clearInterval(timeInterval);
        };
    }, []);

    useEffect(() => {
        if (!mountRef.current || !isLoadingComplete) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Enhanced controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 200;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        // Improved lighting
        const ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight1.position.set(5, 3, 5);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-5, -3, -5);
        scene.add(directionalLight2);

        // Point light for sun glow
        const sunLight = new THREE.PointLight(0xfdb813, 1, 100);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // Starfield with more stars
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 15000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 3000;
            positions[i3 + 1] = (Math.random() - 0.5) * 3000;
            positions[i3 + 2] = (Math.random() - 0.5) * 3000;

            // Color variation
            colors[i3] = 0.8 + Math.random() * 0.2;
            colors[i3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i3 + 2] = 0.8 + Math.random() * 0.2;

            // Size variation
            sizes[i] = 0.5 + Math.random() * 2;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starsMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);

        // Create planets
        const planetObjects = {};

        for (const [name, data] of Object.entries(planets)) {
            const geometry = new THREE.SphereGeometry(data.size, 64, 64);
            const material = new THREE.MeshPhongMaterial({
                color: data.color,
                shininess: 50,
                specular: 0x222222,
                emissive: name === 'sun' ? data.color : 0x000000,
                emissiveIntensity: name === 'sun' ? 0.8 : 0
            });
            const planet = new THREE.Mesh(geometry, material);

            // Adjust positions based on auspicious times
            const auspiciousOffset = Math.sin(Date.now() * 0.001) * 3;
            planet.position.set(
                data.position[0] + auspiciousOffset,
                data.position[1] + (Math.random() - 0.5) * 2,
                data.position[2] + (Math.random() - 0.5) * 2
            );

            planet.userData = { name };
            scene.add(planet);
            planetObjects[name] = planet;

            // Add orbit path
            const orbitGeometry = new THREE.BufferGeometry();
            const orbitPoints = [];
            const orbitRadius = Math.sqrt(data.position[0] ** 2 + data.position[1] ** 2 + data.position[2] ** 2);

            for (let i = 0; i <= 128; i++) {
                const theta = (i / 128) * Math.PI * 2;
                orbitPoints.push(new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta)));
            }

            orbitGeometry.setFromPoints(orbitPoints);
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x555577,
                transparent: true,
                opacity: 0.5,
                linewidth: 1
            });
            const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
            scene.add(orbit);

            // Add ring for Saturn
            if (data.hasRing) {
                const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 1.8, 64);
                const ringMaterial = new THREE.MeshPhongMaterial({
                    color: 0xd0d0d0,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8,
                    specular: 0x444444
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                planet.add(ring);
            }
        }

        // Initial camera position
        camera.position.set(0, 40, 60);
        controls.target.set(0, 0, 0);

        // Focus on a planet
        const focusOnPlanet = (planetName) => {
            const planet = planetObjects[planetName];
            if (!planet) return;

            const distance = planetName === 'sun' ? 15 : planets[planetName].size * 5;
            const direction = planet.position.clone().normalize();
            const targetPosition = direction.multiplyScalar(distance);

            // Animate camera position
            gsap.to(camera.position, {
                x: targetPosition.x,
                y: targetPosition.y + (planets[planetName].size * 0.5),
                z: targetPosition.z,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: () => {
                    controls.target.copy(planet.position);
                }
            });
        };

        // Raycaster for planet selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseClick = (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the raycaster
            raycaster.setFromCamera(mouse, camera);

            // Calculate objects intersecting the ray
            const intersects = raycaster.intersectObjects(Object.values(planetObjects));

            if (intersects.length > 0) {
                const planet = intersects[0].object;
                const planetName = planet.userData.name;
                setSelectedPlanet(planetName);
                setIsInfoPanelOpen(true);
                focusOnPlanet(planetName);
            }
        };

        window.addEventListener('click', onMouseClick, false);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate planets at different speeds
            for (const [name, planet] of Object.entries(planetObjects)) {
                const speed = name === 'sun' ? 0.01 : 0.005;
                planet.rotation.y += speed;

                // Add subtle floating motion
                if (name !== 'sun') {
                    const time = Date.now() * 0.001;
                    planet.position.y = planets[name].position[1] + Math.sin(time * 0.5 + name.length) * 0.5;
                }
            }

            // Update controls
            controls.update();

            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('click', onMouseClick);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [isLoadingComplete]);

    // Toggle planet info panel
    const toggleInfoPanel = () => {
        setIsInfoPanelOpen(!isInfoPanelOpen);
    };

    // Reset view
    const resetView = () => {
        setSelectedPlanet('earth');
        // Camera reset is handled in the Three.js animation loop
    };

    // Handle planet selection
    const handlePlanetSelect = (e) => {
        const planetName = e.target.value;
        setSelectedPlanet(planetName);
        setIsInfoPanelOpen(true);
    };

    // Get active auspicious planets
    const getActiveAuspiciousPlanets = () => {
        const now = new Date();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        const activePlanets = [];

        Object.entries(auspiciousTimes).forEach(([planetName, times]) => {
            let isAuspicious = false;

            // Handle overnight times
            if (times.end < times.start) {
                if (currentHour >= times.start || currentHour < times.end) {
                    isAuspicious = true;
                }
            } else {
                if (currentHour >= times.start && currentHour < times.end) {
                    isAuspicious = true;
                }
            }

            if (isAuspicious) {
                activePlanets.push(planetName);
            }
        });

        return activePlanets;
    };

    const activeAuspiciousPlanets = getActiveAuspiciousPlanets();

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950">
            {/* Loading Screen */}
            {!isLoadingComplete && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0f1a2f] to-[#040d21]">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white font-mono tracking-wider text-center">
                        COSMIC HARMONY MAP
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-md text-center mb-10">
                        Visualizing planetary positions based on auspicious times
                    </p>
                    <div className="w-80 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-red-500 transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Canvas for Three.js */}
            <div ref={mountRef} className="absolute inset-0 z-0"></div>

            {/* UI Container */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Current Time Display */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-[rgba(25,45,85,0.3)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 pointer-events-auto font-mono text-red-500 text-lg shadow-xl">
                    {currentTime}
                </div>

                {/* Auspicious Times Panel */}
                <div className="absolute top-8 left-8 w-72 bg-[rgba(25,45,85,0.3)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 pointer-events-auto shadow-xl">
                    <h3 className="text-xl font-bold text-red-500 mb-4 text-center font-mono">AUSPICIOUS TIMES</h3>
                    {Object.entries(auspiciousTimes).map(([planet, time]) => (
                        <div
                            key={planet}
                            className={`flex justify-between p-3 rounded-lg mb-1 transition-all ${
                                activeAuspiciousPlanets.includes(planet)
                                    ? 'bg-[rgba(11,61,145,0.25)] shadow-[0_0_15px_rgba(255,215,0,0.7)] border-l-4 border-red-500'
                                    : 'hover:bg-[rgba(11,61,145,0.15)]'
                            }`}
                        >
                            <span className="font-medium capitalize">{planet}</span>
                            <span>
                {planet === 'sun' || planet === 'moon'
                    ? planet === 'sun' ? 'Sunrise' : 'Moonrise'
                    : `${time.start.toFixed(time.start % 1 ? 1 : 0)}:00 - ${time.end.toFixed(time.end % 1 ? 1 : 0)}:00`}
              </span>
                        </div>
                    ))}
                </div>

                {/* Planet Info Panel */}
                <div
                    className={`absolute top-1/2 left-8 w-80 bg-[rgba(15,30,60,0.85)] rounded-2xl p-6 pointer-events-auto transform transition-transform duration-500 backdrop-blur-sm border border-[rgba(255,255,255,0.1)] shadow-xl ${
                        isInfoPanelOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <button
                        className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                        onClick={() => setIsInfoPanelOpen(false)}
                    >
                        ×
                    </button>
                    <h2 className="text-2xl font-bold text-red-500 mb-4 text-center font-mono capitalize">
                        {selectedPlanet}
                    </h2>
                    <div className="flex items-start mb-5">
                        <div
                            className="w-24 h-24 bg-cover bg-center rounded-full shadow-lg border-2 border-[#0b3d91]"
                            style={{ backgroundImage: `url(${planets[selectedPlanet]?.image})` }}
                        ></div>
                        <div className="ml-4">
                            <div className="flex mb-2">
                                <div className="font-bold text-red-400 w-24">Type:</div>
                                <div>{planets[selectedPlanet]?.type}</div>
                            </div>
                            <div className="flex mb-2">
                                <div className="font-bold text-red-400 w-24">Diameter:</div>
                                <div>{planets[selectedPlanet]?.diameter}</div>
                            </div>
                            <div className="flex mb-2">
                                <div className="font-bold text-red-400 w-24">Mass:</div>
                                <div>{planets[selectedPlanet]?.mass}</div>
                            </div>
                            <div className="flex">
                                <div className="font-bold text-red-400 w-24">Gravity:</div>
                                <div>{planets[selectedPlanet]?.gravity}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-xl border-l-4 border-[#0b3d91] mb-3">
                        <div className="font-bold text-red-400">Day Length:</div>
                        <div>{planets[selectedPlanet]?.day}</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-xl border-l-4 border-[#0b3d91] mb-3">
                        <div className="font-bold text-red-400">Year Length:</div>
                        <div>{planets[selectedPlanet]?.year}</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-xl border-l-4 border-[#0b3d91] mb-3">
                        <div className="font-bold text-red-400">Temperature:</div>
                        <div>{planets[selectedPlanet]?.temp}</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-xl border-l-4 border-[#0b3d91] mb-3">
                        <div className="font-bold text-red-400">Moons:</div>
                        <div>{planets[selectedPlanet]?.moons}</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-xl border-l-4 border-[#0b3d91]">
                        <div className="font-bold text-red-400">Description:</div>
                        <div>{planets[selectedPlanet]?.desc}</div>
                    </div>
                </div>

                {/* Planet Selector */}
                <div className="absolute top-8 right-8 w-64 bg-[rgba(25,45,85,0.3)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 pointer-events-auto shadow-xl">
                    <h3 className="text-xl font-bold mb-4 text-center font-mono">PLANET SELECTOR</h3>
                    <select
                        className="w-full bg-[rgba(20,35,60,0.7)] text-white border border-[#0b3d91] p-3 rounded-xl text-lg cursor-pointer transition-all hover:border-[#fc3d21]"
                        value={selectedPlanet}
                        onChange={handlePlanetSelect}
                    >
                        <option value="sun">Sun</option>
                        <option value="mercury">Mercury</option>
                        <option value="venus">Venus</option>
                        <option value="earth">Earth</option>
                        <option value="mars">Mars</option>
                        <option value="jupiter">Jupiter</option>
                        <option value="saturn">Saturn</option>
                        <option value="uranus">Uranus</option>
                        <option value="neptune">Neptune</option>
                        <option value="pluto">Pluto</option>
                    </select>
                </div>

                {/* Main Controls */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-[rgba(25,45,85,0.3)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-3 flex gap-4 pointer-events-auto shadow-xl">
                    <button
                        className="bg-[rgba(30,45,70,0.7)] text-white border border-[#0b3d91] rounded-xl p-3 cursor-pointer transition-all hover:bg-[rgba(11,61,145,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(11,61,145,0.5)] backdrop-blur flex items-center gap-2 font-medium"
                    >
                        <i className="fas fa-search-plus"></i>
                        <span>Zoom In</span>
                    </button>
                    <button
                        className="bg-[rgba(30,45,70,0.7)] text-white border border-[#0b3d91] rounded-xl p-3 cursor-pointer transition-all hover:bg-[rgba(11,61,145,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(11,61,145,0.5)] backdrop-blur flex items-center gap-2 font-medium"
                    >
                        <i className="fas fa-search-minus"></i>
                        <span>Zoom Out</span>
                    </button>
                    <button
                        className="bg-[rgba(30,45,70,0.7)] text-white border border-[#0b3d91] rounded-xl p-3 cursor-pointer transition-all hover:bg-[rgba(11,61,145,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(11,61,145,0.5)] backdrop-blur flex items-center gap-2 font-medium"
                        onClick={resetView}
                    >
                        <i className="fas fa-globe-americas"></i>
                        <span>Reset View</span>
                    </button>
                    <button
                        className="bg-[rgba(30,45,70,0.7)] text-white border border-[#0b3d91] rounded-xl p-3 cursor-pointer transition-all hover:bg-[rgba(11,61,145,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(11,61,145,0.5)] backdrop-blur flex items-center gap-2 font-medium"
                        onClick={toggleInfoPanel}
                    >
                        <i className="fas fa-info-circle"></i>
                        <span>Planet Info</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="absolute bottom-4 left-0 w-full text-center text-gray-400 text-sm">
                    Planetary positions calculated based on current auspicious times
                </div>
            </div>
        </div>
    );
};

export default CosmicHarmonyMap;
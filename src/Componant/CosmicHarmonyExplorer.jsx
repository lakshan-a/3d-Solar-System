import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import gsap from 'gsap';

const CosmicHarmonyExplorer = () => {
    const mountRef = useRef(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('Loading current time...');
    const [selectedPlanet, setSelectedPlanet] = useState('earth');
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    const [isLoadingComplete, setIsLoadingComplete] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(60);
    const [autoRotate, setAutoRotate] = useState(true);
    const [brightness, setBrightness] = useState(1.0);
    const [exposure, setExposure] = useState(1.2);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [rotationSpeed, setRotationSpeed] = useState(0.5);

    // Planet data
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
            desc: "The Sun is the star at the center of our solar system.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/sun-blasts-a-mighty-solar-flare-sdo-1.jpeg",
            orbitSpeed: 0.0001,
            rotationSpeed: 0.01
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
            desc: "Mercury is the smallest and innermost planet.",
            image: "https://science.nasa.gov/wp-content/uploads/2023/09/mercury-messenger-globe-1.jpeg",
            orbitSpeed: 0.04,
            rotationSpeed: 0.006
        },
        // ... other planets with similar structure
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
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Post-processing
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            brightness * 2.5,
            0.8,
            0.6
        );
        composer.addPass(bloomPass);

        const outputPass = new OutputPass();
        composer.addPass(outputPass);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 200;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.5;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        // Sun lens flare
        const textureFlare0 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare0.png");
        const textureFlare3 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare3.png");

        const lensflare = new Lensflare();
        lensflare.addElement(new LensflareElement(textureFlare0, 700, 0));
        lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
        directionalLight.add(lensflare);

        // Starfield
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 15000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 2000;
            positions[i3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i3 + 2] = (Math.random() - 0.5) * 2000;

            colors[i3] = 0.8 + Math.random() * 0.2;
            colors[i3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i3 + 2] = 0.8 + Math.random() * 0.2;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
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
            planet.position.set(...data.position);
            planet.userData = { name, ...data };
            scene.add(planet);
            planetObjects[name] = planet;

            // Orbit paths
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
                opacity: 0.3,
                linewidth: 1
            });
            const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
            scene.add(orbit);
        }

        // Initial camera position
        camera.position.set(0, 40, zoomLevel);
        controls.target.set(0, 0, 0);

        // Focus on planet with NASA-like animation
        const focusOnPlanet = (planetName) => {
            const planet = planetObjects[planetName];
            if (!planet) return;

            const distance = planetName === 'sun' ? 15 : planets[planetName].size * 4.5;
            const direction = new THREE.Vector3().subVectors(camera.position, planet.position).normalize();
            const targetPosition = new THREE.Vector3().addVectors(
                planet.position,
                direction.multiplyScalar(-distance)
            );

            // Smooth transition
            gsap.to(camera.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration: 2.5,
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
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
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

            if (isAnimating) {
                // Rotate planets
                for (const [name, planet] of Object.entries(planetObjects)) {
                    const data = planets[name];
                    planet.rotation.y += data.rotationSpeed * rotationSpeed;

                    // Orbit movement
                    if (name !== 'sun') {
                        const time = Date.now() * 0.0001 * data.orbitSpeed;
                        planet.position.x = data.position[0] * Math.cos(time);
                        planet.position.z = data.position[0] * Math.sin(time);
                    }
                }
            }

            controls.autoRotate = autoRotate;
            controls.update();
            composer.render();
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
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
    }, [isLoadingComplete, isAnimating, autoRotate, zoomLevel, rotationSpeed]);

    // ... UI components from the first project (time display, info panel, controls, etc.)
    // Make sure to include the planet selector, zoom controls, and info panel

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Loading Screen */}
            {!isLoadingComplete && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
                    <div className="w-80 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-red-500"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div ref={mountRef} className="absolute inset-0"></div>

            {/* UI Elements */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-70 text-white p-3 rounded-xl">
                {currentTime}
            </div>

            {/* Controls Panel */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button onClick={() => setZoomLevel(z => Math.max(20, z * 0.8))}>Zoom Out</button>
                <button onClick={() => setZoomLevel(z => Math.min(100, z * 1.2))}>Zoom In</button>
                <button onClick={() => setAutoRotate(!autoRotate)}>
                    {autoRotate ? 'Pause Rotation' : 'Resume Rotation'}
                </button>
            </div>

            {/* Planet Info Panel */}
            {isInfoPanelOpen && (
                <div className="absolute top-8 right-8 w-80 bg-gray-900 bg-opacity-80 text-white p-6 rounded-xl">
                    <h2 className="text-2xl mb-4">{selectedPlanet.toUpperCase()}</h2>
                    <p>{planets[selectedPlanet]?.desc}</p>
                    {/* Add more planet details here */}
                </div>
            )}
        </div>
    );
};

export default CosmicHarmonyExplorer;
import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const PlanetViewer = () => {
    const [currentPlanet, setCurrentPlanet] = useState('earth');
    const [isLoading, setIsLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(true);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Navigation */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
                <button
                    onClick={() => setCurrentPlanet('earth')}
                    className={`px-6 py-2 rounded-full transition-all ${
                        currentPlanet === 'earth'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                            : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                >
                    Earth
                </button>
                <button
                    onClick={() => setCurrentPlanet('jupiter')}
                    className={`px-6 py-2 rounded-full transition-all ${
                        currentPlanet === 'jupiter'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30'
                            : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                >
                    Jupiter
                </button>
            </div>

            {/* Info toggle */}
            <button
                onClick={() => setShowInfo(!showInfo)}
                className="absolute top-4 right-4 z-20 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full text-sm transition backdrop-blur-sm"
            >
                {showInfo ? 'Hide Info' : 'Show Info'}
            </button>

            {currentPlanet === 'earth' ? (
                <EarthVisualization isLoading={isLoading} setIsLoading={setIsLoading} showInfo={showInfo} />
            ) : (
                <JupiterVisualization isLoading={isLoading} setIsLoading={setIsLoading} showInfo={showInfo} />
            )}

            {/* Loading screen */}
            {isLoading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h2 className="text-2xl font-semibold text-blue-400">Loading Planet...</h2>
                </div>
            )}
        </div>
    );
};

const JupiterVisualization = ({ isLoading, setIsLoading, showInfo }) => {
    const [rotation, setRotation] = useState(0);
    const [autoRotate, setAutoRotate] = useState(true);
    const globeRef = useRef(null);
    const rotationSpeed = 0.2;
    let animationFrameId;

    useEffect(() => {
        if (autoRotate) {
            const animate = () => {
                setRotation(prev => (prev + rotationSpeed) % 360);
                animationFrameId = requestAnimationFrame(animate);
            };
            animate();
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [autoRotate]);

    const handleMouseMove = (e) => {
        if (!autoRotate && globeRef.current) {
            const rect = globeRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
            setRotation(angle + 180);
        }
    };

    useEffect(() => {
        // Simulate loading completion
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [setIsLoading]);

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-black opacity-90"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
                <h1 className="text-4xl font-bold mb-2 text-yellow-400">JUPITER GLOBE</h1>
                <p className="text-gray-400 mb-8">Explore the gas giant in 3D</p>

                {/* Globe Container */}
                <div
                    className="relative w-full max-w-2xl aspect-square mb-8 cursor-grab active:cursor-grabbing"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => autoRotate && setAutoRotate(true)}
                    onMouseDown={() => setAutoRotate(false)}
                    onMouseUp={() => setAutoRotate(true)}
                    ref={globeRef}
                >
                    {/* Jupiter Globe */}
                    <div className="absolute inset-0 rounded-full overflow-hidden shadow-2xl shadow-yellow-900/50">
                        <img
                            src="https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg"
                            alt="Jupiter"
                            className="w-full h-full object-cover"
                            style={{ transform: `rotateY(${rotation}deg)` }}
                        />
                    </div>

                    {/* Atmosphere Glow */}
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-700/30 pointer-events-none"></div>
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_10px_rgba(202,138,4,0.3)] pointer-events-none"></div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <button
                            onClick={() => setAutoRotate(!autoRotate)}
                            className="px-4 py-2 bg-yellow-900/70 hover:bg-yellow-800/80 rounded-full text-sm transition backdrop-blur-sm"
                        >
                            {autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
                        </button>
                    </div>
                </div>

                {/* Information Panel */}
                {showInfo && (
                    <div className="w-full max-w-2xl bg-black/50 backdrop-blur-sm border border-yellow-900/50 rounded-lg p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-yellow-400 font-semibold mb-2">Physical Characteristics</h3>
                                <ul className="space-y-1 text-sm text-gray-300">
                                    <li>Diameter: 142,984 km</li>
                                    <li>Mass: 1.898 × 10²⁷ kg</li>
                                    <li>Rotation: 9.93 hours</li>
                                    <li>Orbit: 11.86 Earth years</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-yellow-400 font-semibold mb-2">Atmosphere</h3>
                                <ul className="space-y-1 text-sm text-gray-300">
                                    <li>Composition: 90% H₂, 10% He</li>
                                    <li>Great Red Spot: 400-year storm</li>
                                    <li>Cloud Layers: Ammonia crystals</li>
                                    <li>Wind speeds: Up to 600 km/h</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-yellow-400 font-semibold mb-2">Moons</h3>
                                <ul className="space-y-1 text-sm text-gray-300">
                                    <li>Total: 95 confirmed</li>
                                    <li>Galilean: Io, Europa, Ganymede, Callisto</li>
                                    <li>Largest: Ganymede (larger than Mercury)</li>
                                    <li>Volcanic: Io (most active body in solar system)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-center text-gray-400 text-sm">
                    <p>Drag the globe to rotate manually • Click buttons to control interaction</p>
                    <p className="mt-1">Texture resolution: 2K • Source: Solar System Scope</p>
                </div>
            </div>
        </div>
    );
};

const EarthVisualization = ({ isLoading, setIsLoading, showInfo }) => {
    const canvasRef = useRef(null);
    const [rotationSpeed, setRotationSpeed] = useState(1);
    const [cloudOpacity, setCloudOpacity] = useState(0.6);
    const [viewMode, setViewMode] = useState('earth');
    const [lightIntensity, setLightIntensity] = useState(1.5);
    const [stats] = useState({
        diameter: '12,742 km',
        gravity: '9.8 m/s²',
        temperature: '15°C avg',
        dayLength: '24 hours'
    });

    // Three.js variables
    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const earth = useRef(new THREE.Group());
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const earthRotationSpeed = useRef(0.001);
    const cloudsRotationSpeed = useRef(0.0008);
    const directionalLight = useRef(null);

    // Textures
    const textureLoader = useRef(new THREE.TextureLoader());

    useEffect(() => {
        // Load textures
        const loadTextures = async () => {
            try {
                const earthTexture = await textureLoader.current.loadAsync('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg');
                const earthBumpMap = await textureLoader.current.loadAsync('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg');
                const earthSpecularMap = await textureLoader.current.loadAsync('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg');
                const cloudsTexture = await textureLoader.current.loadAsync('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png');
                const nightTexture = await textureLoader.current.loadAsync('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png');

                // Initialize after textures are loaded
                init(earthTexture, earthBumpMap, earthSpecularMap, cloudsTexture, nightTexture);
            } catch (error) {
                console.error("Error loading textures:", error);
                // Fallback to simpler earth if textures fail to load
                init();
            }
        };

        // Initialize Three.js
        const init = (earthTexture, earthBumpMap, earthSpecularMap, cloudsTexture, nightTexture) => {
            // Scene setup
            scene.current.background = new THREE.Color(0x000000);
            scene.current.fog = new THREE.FogExp2(0x000000, 0.0005);

            // Create camera
            camera.current = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.current.position.set(0, 0, 3);

            // Create renderer with better settings
            renderer.current = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
            });
            renderer.current.setSize(window.innerWidth, window.innerHeight);
            renderer.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.current.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.current.toneMappingExposure = 0.8;
            renderer.current.shadowMap.enabled = true;
            renderer.current.shadowMap.type = THREE.PCFSoftShadowMap;

            // Add controls
            controls.current = new OrbitControls(camera.current, renderer.current.domElement);
            controls.current.enableDamping = true;
            controls.current.dampingFactor = 0.05;
            controls.current.minDistance = 1.5;
            controls.current.maxDistance = 10;
            controls.current.autoRotate = false;
            controls.current.autoRotateSpeed = 0.5;

            // Post-processing setup
            composer.current = new EffectComposer(renderer.current);
            composer.current.addPass(new RenderPass(scene.current, camera.current));

            bloomPass.current = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.2,  // Lower bloom intensity
                0.4,
                0.85
            );
            bloomPass.current.threshold = 0.1;  // Higher threshold to only bloom bright areas
            bloomPass.current.strength = 1.0;    // Reduced strength
            bloomPass.current.radius = 0.5;
            composer.current.addPass(bloomPass.current);

            // Lighting setup - more realistic
            const ambientLight = new THREE.AmbientLight(0x111111); // Darker ambient
            scene.current.add(ambientLight);

            // Main directional light (sun)
            directionalLight.current = new THREE.DirectionalLight(0xffeecc, lightIntensity);
            directionalLight.current.position.set(5, 3, 5);
            directionalLight.current.castShadow = true;
            directionalLight.current.shadow.mapSize.width = 2048;
            directionalLight.current.shadow.mapSize.height = 2048;
            directionalLight.current.shadow.camera.near = 0.5;
            directionalLight.current.shadow.camera.far = 500;
            directionalLight.current.shadow.bias = -0.0001;
            scene.current.add(directionalLight.current);

            // Add subtle hemisphere light for more natural illumination
            const hemisphereLight = new THREE.HemisphereLight(0x4477aa, 0x112233, 0.1);
            scene.current.add(hemisphereLight);

            // Create earth
            createEarth(earthTexture, earthBumpMap, earthSpecularMap, cloudsTexture, nightTexture);

            // Add stars in the background
            createStarfield();

            // Handle window resize
            window.addEventListener('resize', onWindowResize);

            // Start animation
            animate();

            // Hide loading screen after a delay
            setTimeout(() => {
                setIsLoading(false);
            }, 1500);
        };

        // Create earth with more realistic materials
        const createEarth = (earthTexture, earthBumpMap, earthSpecularMap, cloudsTexture, nightTexture) => {
            scene.current.add(earth.current);

            // Earth geometry
            const earthGeometry = new THREE.SphereGeometry(1, 128, 128); // Higher resolution

            // Earth material - more realistic settings
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: earthTexture || new THREE.Color(0x3366ff), // Fallback color
                bumpMap: earthBumpMap,
                bumpScale: 0.1, // More pronounced bumps
                specularMap: earthSpecularMap,
                specular: new THREE.Color(0x111111), // Darker specular
                shininess: 10,
                emissiveMap: nightTexture,
                emissive: new THREE.Color(0x000022),
                emissiveIntensity: 1.2, // Brighter night lights
                reflectivity: 0.2
            });

            // Earth mesh
            const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
            earthMesh.receiveShadow = true;
            earth.current.add(earthMesh);

            // Atmosphere effect - more realistic
            const atmosphereGeometry = new THREE.SphereGeometry(1.03, 64, 64);
            const atmosphereMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x5599ff,
                transparent: true,
                opacity: 0.2,
                side: THREE.BackSide,
                roughness: 0.9,
                metalness: 0,
                ior: 1.1,
                thickness: 0.5
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            earth.current.add(atmosphere);

            // Clouds - improved material
            if (cloudsTexture) {
                const cloudsGeometry = new THREE.SphereGeometry(1.01, 128, 128);
                const cloudsMaterial = new THREE.MeshPhongMaterial({
                    map: cloudsTexture,
                    transparent: true,
                    opacity: cloudOpacity,
                    depthWrite: false,
                    specular: new THREE.Color(0x111111),
                    shininess: 50,
                    emissive: 0x000000
                });
                const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
                clouds.rotation.y = Math.PI;
                earth.current.add(clouds);
            }
        };

        // Create more realistic starfield
        const createStarfield = () => {
            const starCount = 5000; // More stars
            const positions = new Float32Array(starCount * 3);
            const colors = new Float32Array(starCount * 3);
            const sizes = new Float32Array(starCount);

            for (let i = 0; i < starCount; i++) {
                const radius = 1000;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);

                // More varied star colors
                const colorTemp = Math.random();
                if (colorTemp < 0.7) {
                    colors[i * 3] = 1; // White/yellow
                    colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
                    colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
                } else if (colorTemp < 0.9) {
                    colors[i * 3] = 0.8 + Math.random() * 0.2; // Orange
                    colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
                    colors[i * 3 + 2] = 0.3 + Math.random() * 0.2;
                } else {
                    colors[i * 3] = 0.6 + Math.random() * 0.2; // Blue
                    colors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
                    colors[i * 3 + 2] = 1;
                }

                sizes[i] = Math.random() * 2 + 0.5;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const material = new THREE.PointsMaterial({
                size: 1.5,
                vertexColors: true,
                transparent: true,
                opacity: 1,
                sizeAttenuation: true, // Stars get smaller with distance
                fog: false
            });

            const stars = new THREE.Points(geometry, material);
            scene.current.add(stars);
        };

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate the earth and clouds
            earth.current.rotation.y += earthRotationSpeed.current;
            if (earth.current.children[2]) { // clouds
                earth.current.children[2].rotation.y += cloudsRotationSpeed.current;
            }

            // Update controls
            controls.current.update();

            // Render with post-processing
            composer.current.render();
        };

        // Handle window resize
        const onWindowResize = () => {
            camera.current.aspect = window.innerWidth / window.innerHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(window.innerWidth, window.innerHeight);
            composer.current.setSize(window.innerWidth, window.innerHeight);
        };

        // Start loading textures
        loadTextures();

        // Cleanup
        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (renderer.current) {
                renderer.current.dispose();
            }
            if (controls.current) {
                controls.current.dispose();
            }
            if (composer.current) {
                composer.current.dispose();
            }
        };
    }, []);

    // Update rotation speed when slider changes
    useEffect(() => {
        earthRotationSpeed.current = rotationSpeed * 0.001;
        cloudsRotationSpeed.current = rotationSpeed * 0.0008;
    }, [rotationSpeed]);

    // Update cloud opacity
    useEffect(() => {
        if (earth.current && earth.current.children[2]) {
            earth.current.children[2].material.opacity = cloudOpacity;
        }
    }, [cloudOpacity]);

    // Update light intensity
    useEffect(() => {
        if (directionalLight.current) {
            directionalLight.current.intensity = lightIntensity;
        }
    }, [lightIntensity]);

    // Change view mode
    useEffect(() => {
        if (!camera.current || !controls.current) return;

        switch (viewMode) {
            case 'earth':
                camera.current.position.set(0, 0, 3);
                controls.current.reset();
                break;
            case 'northPole':
                camera.current.position.set(0, 3, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'southPole':
                camera.current.position.set(0, -3, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'equator':
                camera.current.position.set(3, 0, 0);
                camera.current.lookAt(0, 0, 0);
                break;
            default:
                break;
        }
    }, [viewMode]);

    return (
        <>
            {/* Canvas container */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Info panel */}
            {showInfo && (
                <div className="absolute top-6 left-6 z-10 bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl max-w-md border border-blue-500/30 shadow-2xl shadow-blue-500/10">
                    <h1 className="text-3xl font-bold mb-4 text-blue-400 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                        Earth Explorer
                    </h1>

                    <p className="text-blue-100 mb-4">
                        Interactive 3D model of planet Earth with realistic textures and atmospheric effects.
                    </p>

                    <ul className="list-disc pl-5 mb-6 text-blue-100 space-y-2">
                        <li><span className="font-semibold">Left click + drag:</span> Rotate view</li>
                        <li><span className="font-semibold">Right click + drag:</span> Pan view</li>
                        <li><span className="font-semibold">Scroll:</span> Zoom in/out</li>
                    </ul>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                            <div className="text-blue-300 text-sm font-medium">Diameter</div>
                            <div className="text-white text-xl font-bold">{stats.diameter}</div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                            <div className="text-blue-300 text-sm font-medium">Gravity</div>
                            <div className="text-white text-xl font-bold">{stats.gravity}</div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                            <div className="text-blue-300 text-sm font-medium">Temperature</div>
                            <div className="text-white text-xl font-bold">{stats.temperature}</div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                            <div className="text-blue-300 text-sm font-medium">Day Length</div>
                            <div className="text-white text-xl font-bold">{stats.dayLength}</div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="rotation-speed" className="block text-blue-300 mb-2">
                                Rotation Speed
                            </label>
                            <input
                                type="range"
                                id="rotation-speed"
                                min="0"
                                max="3"
                                step="0.1"
                                value={rotationSpeed}
                                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="cloud-opacity" className="block text-blue-300 mb-2">
                                Cloud Opacity
                            </label>
                            <input
                                type="range"
                                id="cloud-opacity"
                                min="0"
                                max="1"
                                step="0.1"
                                value={cloudOpacity}
                                onChange={(e) => setCloudOpacity(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="light-intensity" className="block text-blue-300 mb-2">
                                Sun Intensity
                            </label>
                            <input
                                type="range"
                                id="light-intensity"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={lightIntensity}
                                onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={() => setViewMode('earth')}
                                className={`px-4 py-2 rounded-xl transition-all ${
                                    viewMode === 'earth'
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                                        : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                                }`}
                            >
                                Global
                            </button>

                            <button
                                onClick={() => setViewMode('northPole')}
                                className={`px-4 py-2 rounded-xl transition-all ${
                                    viewMode === 'northPole'
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                                        : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                                }`}
                            >
                                North Pole
                            </button>

                            <button
                                onClick={() => setViewMode('southPole')}
                                className={`px-4 py-2 rounded-xl transition-all ${
                                    viewMode === 'southPole'
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                                        : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                                }`}
                            >
                                South Pole
                            </button>

                            <button
                                onClick={() => setViewMode('equator')}
                                className={`px-4 py-2 rounded-xl transition-all ${
                                    viewMode === 'equator'
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                                        : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                                }`}
                            >
                                Equator
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setViewMode('earth');
                                controls.current.reset();
                            }}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
                        >
                            Reset View
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PlanetViewer;
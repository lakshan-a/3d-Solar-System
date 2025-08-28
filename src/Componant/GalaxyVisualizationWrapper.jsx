import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import mercuryTexture from '../assets/images/mercury/2k_mercury.jpg';
import venusTexture from '../assets/images/venus/2k_venus.jpg';
import earthTexture from '../assets/images/earth/2k_earth_daymap.jpg';
import marsTexture from '../assets/images/mars/2k_mars.jpg';
import jupiterTexture from '../assets/images/jupiter/2k_jupiter.jpg';
import saturnTexture from '../assets/images/saturn/2k_saturn.jpg';
import uranusTexture from '../assets/images/uranus/2k_uranus.jpg';
import neptuneTexture from '../assets/images/neptune/2k_neptune.jpg';
import saturnRingTexture from '../assets/images/saturn/2k_saturn_ring_alpha.png';
import uranusRingTexture from '../assets/images/uranus/uranus_ring.png';
import galaxyTexture from '../assets/images/8k_stars_milky_way.jpg';
import sunTexture from '../assets/images/sun/2k_sun.jpg';

const PLANET_DATA = [
    {
        name: 'mercury',
        distance: 5.8,
        size: 0.4,
        color: 0xaaaaaa,
        orbitSpeed: 4.1,
        rotationSpeed: 0.5,
        texture: mercuryTexture,
        hasRings: false,
        stats: {
            diameter: '4,880 km',
            gravity: '3.7 m/s²',
            temperature: '167°C (day), -173°C (night)',
            composition: '70% metallic, 30% silicate',
            orbitPeriod: '88 Earth days',
            rotationPeriod: '59 Earth days'
        }
    },
    {
        name: 'venus',
        distance: 10.8,
        size: 0.6,
        color: 0xe6e6e6,
        orbitSpeed: 1.6,
        rotationSpeed: 0.4,
        texture: venusTexture,
        hasRings: false,
        stats: {
            diameter: '12,104 km',
            gravity: '8.87 m/s²',
            temperature: '462°C (average)',
            composition: '96.5% CO₂, 3.5% N₂',
            orbitPeriod: '225 Earth days',
            rotationPeriod: '243 Earth days (retrograde)'
        }
    },
    {
        name: 'earth',
        distance: 15,
        size: 0.6,
        color: 0x1a66ff,
        orbitSpeed: 1,
        rotationSpeed: 1,
        texture: earthTexture,
        hasRings: false,
        stats: {
            diameter: '12,742 km',
            gravity: '9.81 m/s²',
            temperature: '15°C (average)',
            composition: '78% N₂, 21% O₂',
            orbitPeriod: '365.25 days',
            rotationPeriod: '24 hours',
            moons: '1 (The Moon)'
        }
    },
    {
        name: 'mars',
        distance: 22.8,
        size: 0.5,
        color: 0xc1440e,
        orbitSpeed: 0.5,
        rotationSpeed: 0.9,
        texture: marsTexture,
        hasRings: false,
        stats: {
            diameter: '6,779 km',
            gravity: '3.71 m/s²',
            temperature: '-63°C (average)',
            composition: '95% CO₂, 2.7% N₂',
            orbitPeriod: '687 Earth days',
            rotationPeriod: '24.6 hours',
            moons: '2 (Phobos & Deimos)'
        }
    },
    {
        name: 'jupiter',
        distance: 40,
        size: 1.4,
        color: 0xe3dccb,
        orbitSpeed: 0.4,
        rotationSpeed: 2.4,
        texture: jupiterTexture,
        hasRings: false,
        stats: {
            diameter: '139,820 km',
            gravity: '24.79 m/s²',
            temperature: '-145°C (average)',
            composition: '90% H₂, 10% He',
            orbitPeriod: '4,333 Earth days',
            rotationPeriod: '9.9 hours',
            moons: '79 known'
        }
    },
    {
        name: 'saturn',
        distance: 60,
        size: 1.2,
        color: 0xf0e6c2,
        orbitSpeed: 0.3,
        rotationSpeed: 2.3,
        texture: saturnTexture,
        ringTexture: saturnRingTexture,
        hasRings: true,
        stats: {
            diameter: '116,460 km',
            gravity: '10.44 m/s²',
            temperature: '-178°C (average)',
            composition: '96% H₂, 3% He',
            orbitPeriod: '10,759 Earth days',
            rotationPeriod: '10.7 hours',
            moons: '82 known'
        }
    },
    {
        name: 'uranus',
        distance: 80,
        size: 0.9,
        color: 0xd1e7e7,
        orbitSpeed: 0.2,
        rotationSpeed: 1.4,
        texture: uranusTexture,
        ringTexture: uranusRingTexture,
        hasRings: true,
        stats: {
            diameter: '50,724 km',
            gravity: '8.69 m/s²',
            temperature: '-216°C (average)',
            composition: '83% H₂, 15% He, 2% CH₄',
            orbitPeriod: '30,687 Earth days',
            rotationPeriod: '17.2 hours (retrograde)',
            moons: '27 known'
        }
    },
    {
        name: 'neptune',
        distance: 100,
        size: 0.9,
        color: 0x5b5ddf,
        orbitSpeed: 0.1,
        rotationSpeed: 1.5,
        texture: neptuneTexture,
        hasRings: false,
        stats: {
            diameter: '49,244 km',
            gravity: '11.15 m/s²',
            temperature: '-214°C (average)',
            composition: '80% H₂, 19% He, 1% CH₄',
            orbitPeriod: '60,190 Earth days',
            rotationPeriod: '16.1 hours',
            moons: '14 known'
        }
    }
];

const SUN_STATS = {
    name: 'Sun',
    diameter: '1,392,700 km',
    gravity: '274 m/s²',
    temperature: '5,500°C (surface), 15M°C (core)',
    composition: '73% Hydrogen, 25% Helium',
    age: '4.6 billion years',
    mass: '330,000 Earth masses',
    luminosity: '3.8×10²⁶ Watts',
    rotation: '25-35 days (varies by latitude)',
    distance: '149.6 million km from Earth',
    classification: 'G-type main-sequence star',
    solarWind: '400 km/s (average speed)',
    solarFlares: 'Common during solar maximum'
};

const PlanetDetailView = ({ planetData, onBack }) => {
    const canvasRef = useRef(null);
    const [rotationSpeed, setRotationSpeed] = useState(1.5);
    const [viewMode, setViewMode] = useState('global');
    const [lightIntensity, setLightIntensity] = useState(1.0);
    const [exposure, setExposure] = useState(1.0);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [showFeatures, setShowFeatures] = useState(true);

    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const planet = useRef(new THREE.Group());
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const outputPass = useRef(null);
    const planetRotationSpeed = useRef(0.001);
    const directionalLight = useRef(null);
    const pointLight = useRef(null);
    const hemiLight = useRef(null);
    const animationFrameId = useRef(null);
    const textureLoader = useRef(new THREE.TextureLoader());

    const generateStarfield = useMemo(() => {
        const geometry = new THREE.SphereGeometry(5000, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            map: textureLoader.current.load(galaxyTexture),
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.8
        });
        const sphere = new THREE.Mesh(geometry, material);
        return sphere;
    }, []);

    useEffect(() => {
        const init = () => {
            if (!canvasRef.current) return;

            scene.current.background = new THREE.Color(0x000008);
            scene.current.fog = new THREE.FogExp2(0x00000a, 0.00008);

            camera.current = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.1,
                10000
            );
            camera.current.position.set(0, 0, planetData.size * 5);

            renderer.current = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                antialias: true,
                powerPreference: "high-performance",
                logarithmicDepthBuffer: true
            });
            renderer.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.current.setSize(window.innerWidth, window.innerHeight);
            renderer.current.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.current.toneMappingExposure = exposure;
            renderer.current.shadowMap.enabled = true;
            renderer.current.shadowMap.type = THREE.PCFSoftShadowMap;

            controls.current = new OrbitControls(camera.current, renderer.current.domElement);
            controls.current.enableDamping = true;
            controls.current.dampingFactor = 0.08;
            controls.current.minDistance = planetData.size * 1.5;
            controls.current.maxDistance = planetData.size * 15;
            controls.current.maxPolarAngle = Math.PI;
            controls.current.minPolarAngle = 0;
            controls.current.autoRotate = autoRotate;
            controls.current.autoRotateSpeed = 0.5;
            controls.current.enablePan = true;
            controls.current.screenSpacePanning = false;

            composer.current = new EffectComposer(renderer.current);
            composer.current.addPass(new RenderPass(scene.current, camera.current));

            bloomPass.current = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
                1.5,
                0.8,
                0.9
            );
            bloomPass.current.enabled = bloomEnabled;
            composer.current.addPass(bloomPass.current);

            outputPass.current = new OutputPass();
            composer.current.addPass(outputPass.current);

            directionalLight.current = new THREE.DirectionalLight(0xffffff, lightIntensity);
            directionalLight.current.position.set(10, 5, 10);
            directionalLight.current.castShadow = true;
            directionalLight.current.shadow.mapSize.width = 2048;
            directionalLight.current.shadow.mapSize.height = 2048;
            directionalLight.current.shadow.camera.near = 0.5;
            directionalLight.current.shadow.camera.far = 500;
            directionalLight.current.shadow.bias = -0.0001;
            scene.current.add(directionalLight.current);

            hemiLight.current = new THREE.HemisphereLight(0xffffff, 0x000044, 0.2);
            scene.current.add(hemiLight.current);

            const galaxy = generateStarfield;
            scene.current.add(galaxy);

            createPlanet();

            window.addEventListener('resize', onWindowResize);
            animate();
        };

        const createPlanet = () => {
            scene.current.add(planet.current);

            const planetGeometry = new THREE.SphereGeometry(planetData.size, 256, 256);
            const planetMaterial = new THREE.MeshPhysicalMaterial({
                roughness: 0.9,
                metalness: 0.3,
                clearcoat: 0.1,
                clearcoatRoughness: 0.5,
                color: planetData.color,
                specularColor: new THREE.Color(0x999999),
                specularIntensity: 0.2,
                sheen: 0.05,
                sheenColor: new THREE.Color(0x999999),
                emissive: 0x333333,
                emissiveIntensity: 0.05,
                ior: 1.5,
                flatShading: false
            });

            textureLoader.current.load(planetData.texture, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                texture.encoding = THREE.sRGBEncoding;
                planetMaterial.map = texture;
                planetMaterial.needsUpdate = true;
            });

            const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
            planetMesh.receiveShadow = true;
            planetMesh.castShadow = true;
            planetMesh.name = planetData.name;
            planetMesh.rotation.z = THREE.MathUtils.degToRad(0.034);
            planet.current.add(planetMesh);

            if (planetData.hasRings) {
                const ringTexture = planetData.ringTexture ?
                    textureLoader.current.load(planetData.ringTexture) : null;
                const ringGeometry = new THREE.RingGeometry(
                    planetData.size * 1.5,
                    planetData.size * 2.5,
                    64
                );
                const ringMaterial = new THREE.MeshStandardMaterial({
                    map: ringTexture,
                    side: THREE.DoubleSide,
                    roughness: 1.0,
                    metalness: 0.0,
                    transparent: true,
                    opacity: 0.5
                });
                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                ringMesh.rotation.x = Math.PI / 2;
                planet.current.add(ringMesh);
            }
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            planet.current.rotation.y += planetRotationSpeed.current;
            controls.current.update();
            bloomPass.current.enabled = bloomEnabled;
            if (bloomEnabled) {
                bloomPass.current.strength = 0.5 + Math.sin(Date.now() * 0.001) * 0.1;
            }
            renderer.current.toneMappingExposure = exposure;
            controls.current.autoRotate = autoRotate;

            if (directionalLight.current) {
                directionalLight.current.intensity = lightIntensity;
            }

            composer.current.render();
        };

        const onWindowResize = () => {
            camera.current.aspect = window.innerWidth / window.innerHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(window.innerWidth, window.innerHeight);
            composer.current.setSize(window.innerWidth, window.innerHeight);
            bloomPass.current.setSize(window.innerWidth, window.innerHeight);
        };

        init();

        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (renderer.current) {
                renderer.current.dispose();
            }
            if (controls.current) {
                controls.current.dispose();
            }
            if (composer.current) {
                composer.current.dispose();
            }
            if (bloomPass.current) {
                bloomPass.current.dispose();
            }
        };
    }, [planetData, generateStarfield, autoRotate, bloomEnabled, showFeatures]);

    useEffect(() => {
        planetRotationSpeed.current = rotationSpeed * 0.001;
    }, [rotationSpeed]);

    useEffect(() => {
        if (renderer.current) {
            renderer.current.toneMappingExposure = exposure;
        }
    }, [exposure]);

    useEffect(() => {
        if (!camera.current || !controls.current) return;

        switch (viewMode) {
            case 'global':
                camera.current.position.set(0, 0, planetData.size * 5);
                controls.current.reset();
                break;
            case 'northPole':
                camera.current.position.set(0, planetData.size * 5, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'southPole':
                camera.current.position.set(0, -planetData.size * 5, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'equator':
                camera.current.position.set(planetData.size * 5, 0, 0);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'closeup':
                camera.current.position.set(0, 0, planetData.size * 2.5);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'darkSide':
                camera.current.position.set(-planetData.size * 5, 0, 0);
                camera.current.lookAt(0, 0, 0);
                setLightIntensity(0.4);
                break;
            default:
                break;
        }
    }, [viewMode, planetData.size]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(200, 200, 200, 0.4);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(200, 200, 200, 0.6);
                }
                .stats-grid {
                    max-height: 200px;
                    overflow-y: auto;
                }
                .glass-panel {
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .planet-button {
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .planet-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                }
                .planet-button.active {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
                }
                @media (min-width: 768px) {
                    .info-panel {
                        width: 24rem;
                        max-height: calc(100vh - 3rem);
                    }
                }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="absolute top-4 right-4 z-20 glass-panel p-3 rounded-full shadow-xl transition-all"
                aria-label="Toggle info panel"
            >
                {showInfoPanel ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>

            {showInfoPanel && (
                <div className="absolute top-4 left-4 right-4 bottom-4 md:top-6 md:left-6 md:right-auto md:bottom-auto info-panel z-10 glass-panel rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-slate-700">
                        <h1 className="text-xl md:text-2xl font-bold text-indigo-100">
                            {planetData.name.charAt(0).toUpperCase() + planetData.name.slice(1)} Explorer
                        </h1>
                        <button
                            onClick={() => setShowInfoPanel(false)}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                            aria-label="Close panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 stats-grid">
                            {Object.entries(planetData.stats).map(([key, value]) => (
                                <div key={key} className="glass-panel p-3 rounded-lg border-l-2 border-indigo-500/50 hover:border-indigo-400 transition-colors">
                                    <div className="text-indigo-300 text-xs font-medium uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</div>
                                    <div className="text-indigo-100 text-sm font-bold">{value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 pb-4">
                            {[
                                { label: 'Rotation Speed', value: rotationSpeed, min: 0, max: 3, step: 0.1, onChange: setRotationSpeed, color: 'indigo' },
                                { label: 'Light Intensity', value: lightIntensity, min: 0.1, max: 3, step: 0.1, onChange: setLightIntensity, color: 'indigo' },
                                { label: 'Exposure', value: exposure, min: 0.1, max: 1.5, step: 0.1, onChange: setExposure, color: 'indigo' },
                            ].map((slider) => (
                                <div key={slider.label}>
                                    <div className="flex justify-between text-indigo-400 text-xs mb-1">
                                        <span>{slider.label}</span>
                                        <span>{slider.value.toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={slider.min}
                                        max={slider.max}
                                        step={slider.step}
                                        value={slider.value}
                                        onChange={(e) => slider.onChange(parseFloat(e.target.value))}
                                        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-${slider.color}-500`}
                                    />
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setBloomEnabled(!bloomEnabled)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center planet-button ${
                                        bloomEnabled
                                            ? 'bg-indigo-700/90 text-white'
                                            : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {bloomEnabled ? 'Bloom ON' : 'Bloom OFF'}
                                </button>

                                <button
                                    onClick={() => setShowFeatures(!showFeatures)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center planet-button ${
                                        showFeatures
                                            ? 'bg-indigo-700/90 text-white'
                                            : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {showFeatures ? 'Features ON' : 'Features OFF'}
                                </button>

                                <button
                                    onClick={() => setAutoRotate(!autoRotate)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center planet-button ${
                                        autoRotate
                                            ? 'bg-emerald-700/90 text-white'
                                            : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {autoRotate ? 'Auto ON' : 'Auto OFF'}
                                </button>

                                <button
                                    onClick={() => {
                                        setViewMode('global');
                                        setLightIntensity(1.0);
                                        controls.current?.reset();
                                    }}
                                    className="py-2 px-1 rounded-lg text-sm bg-slate-800 text-indigo-300 hover:bg-slate-700 transition-all flex items-center justify-center planet-button"
                                >
                                    Reset View
                                </button>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {[
                                    { mode: 'global', label: 'Global', icon: '🌐' },
                                    { mode: 'closeup', label: 'Close-up', icon: '🔍' },
                                    { mode: 'northPole', label: 'North', icon: '⬆️' },
                                    { mode: 'southPole', label: 'South', icon: '⬇️' },
                                    { mode: 'darkSide', label: 'Dark Side', icon: '🌑' },
                                    { mode: 'equator', label: 'Equator', icon: '⏺️' },
                                ].map(({ mode, label, icon }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`py-2 rounded-lg text-xs transition-all planet-button ${
                                            viewMode === mode
                                                ? 'bg-indigo-700/90 text-white'
                                                : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        {icon} {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-20">
                <button
                    onClick={onBack}
                    className="glass-panel p-3 rounded-lg shadow-lg transition-all text-indigo-300 flex items-center planet-button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Solar System
                </button>
            </div>

            <div className="md:hidden fixed bottom-4 right-4 z-20 flex flex-col space-y-2">
                <button
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    className="glass-panel p-3 rounded-full shadow-lg transition-all"
                    aria-label="Toggle info panel"
                >
                    {showInfoPanel ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={() => {
                        setViewMode('global');
                        setLightIntensity(1.0);
                        controls.current?.reset();
                    }}
                    className="glass-panel p-3 rounded-full shadow-lg transition-all"
                    aria-label="Reset view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const GalaxyVisualization = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [exposure, setExposure] = useState(0.8);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [activePlanet, setActivePlanet] = useState('none');
    const [timeScale, setTimeScale] = useState(1.0);
    const [isFollowingPlanet, setIsFollowingPlanet] = useState(false);
    const [zoomState, setZoomState] = useState('out');
    const [hoveredPlanet, setHoveredPlanet] = useState(null);

    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const sun = useRef(new THREE.Group());
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const outputPass = useRef(null);
    const sunRotationSpeed = useRef(0.0002);
    const directionalLight = useRef(null);
    const pointLight = useRef(null);
    const hemiLight = useRef(null);
    const animationFrameId = useRef(null);
    const textureLoader = useRef(new THREE.TextureLoader());
    const corona = useRef(null);
    const planetMeshes = useRef([]);
    const ringMeshes = useRef([]);
    const orbitPaths = useRef([]);
    const currentStats = useRef(SUN_STATS);
    const followTarget = useRef(null);
    const followDistance = useRef(0);
    const asteroidBeltRef = useRef(null);

    useEffect(() => {
        const path = location.pathname.split('/').pop();
        const planetName = path || 'none';
        setActivePlanet(planetName);

        if (planetName && planetName !== 'none') {
            const planet = PLANET_DATA.find(p => p.name === planetName);
            currentStats.current = planet ? planet.stats : SUN_STATS;
        } else {
            currentStats.current = SUN_STATS;
        }
    }, [location]);

    const generateStarfield = useMemo(() => {
        const geometry = new THREE.SphereGeometry(5000, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            map: textureLoader.current.load(galaxyTexture),
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.8
        });
        const sphere = new THREE.Mesh(geometry, material);
        return sphere;
    }, []);

    const createOrbitPaths = () => {
        orbitPaths.current.forEach(path => {
            scene.current.remove(path);
            if (path.geometry) path.geometry.dispose();
            if (path.material) path.material.dispose();
        });
        orbitPaths.current = [];

        PLANET_DATA.forEach(planet => {
            const orbitGeometry = new THREE.BufferGeometry();
            const points = [];
            const segments = 128;

            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    planet.distance * Math.cos(theta),
                    0,
                    planet.distance * Math.sin(theta)
                ));  // Added the missing parenthesis here
            }

            orbitGeometry.setFromPoints(points);

            const orbitMaterial = new THREE.LineDashedMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.5,
                linewidth: 1,
                dashSize: 0.5,
                gapSize: 0.2
            });

            const orbitPath = new THREE.Line(orbitGeometry, orbitMaterial);
            orbitPath.computeLineDistances();
            orbitPath.rotation.x = Math.PI / 180;
            scene.current.add(orbitPath);
            orbitPaths.current.push(orbitPath);
        });
    };

    const createAsteroidBelt = () => {
        const count = 5000;
        const innerRadius = 25;
        const outerRadius = 35;
        const thickness = 2;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const asteroidTexture = new THREE.CanvasTexture(
            createAsteroidTexture()
        );

        for (let i = 0; i < count * 3; i += 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            const y = (Math.random() - 0.5) * thickness;

            positions[i] = radius * Math.cos(angle);
            positions[i + 1] = y;
            positions[i + 2] = radius * Math.sin(angle);

            const r = 0.5 + Math.random() * 0.3;
            const g = 0.4 + Math.random() * 0.2;
            const b = 0.3 + Math.random() * 0.2;
            colors[i] = r;
            colors[i + 1] = g;
            colors[i + 2] = b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            map: asteroidTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        const asteroidBelt = new THREE.Points(geometry, material);
        asteroidBelt.rotation.x = Math.PI / 180;
        return asteroidBelt;
    };

    function createAsteroidTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, 64, 64);

        ctx.fillStyle = '#555555';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 3 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#777777';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 2 + 0.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    const createPlanets = () => {
        planetMeshes.current.forEach(planet => scene.current.remove(planet.mesh));
        ringMeshes.current.forEach(ring => scene.current.remove(ring));
        planetMeshes.current = [];
        ringMeshes.current = [];

        PLANET_DATA.forEach(planet => {
            const planetGeometry = new THREE.SphereGeometry(planet.size, 64, 64);
            const texture = textureLoader.current.load(planet.texture);

            const planetMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                specular: new THREE.Color(0x030303),
                shininess: 3,
                bumpScale: 0.05,
                emissive: 0x000000,
                emissiveIntensity: 0
            });

            const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
            planetMesh.position.set(planet.distance, 0, 0);
            planetMesh.name = planet.name;
            planetMesh.userData = {
                clickable: true,
                name: planet.name,
                originalSize: planet.size
            };

            scene.current.add(planetMesh);
            planetMeshes.current.push({
                mesh: planetMesh,
                data: planet
            });

            if (planet.hasRings) {
                const ringTexture = planet.ringTexture ?
                    textureLoader.current.load(planet.ringTexture) : null;
                const ringGeometry = new THREE.RingGeometry(
                    planet.size * 1.5,
                    planet.size * 2.5,
                    64
                );
                const ringMaterial = new THREE.MeshStandardMaterial({
                    map: ringTexture,
                    side: THREE.DoubleSide,
                    roughness: 1.0,
                    metalness: 0.0,
                    transparent: true,
                    opacity: 0.5
                });
                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                ringMesh.rotation.x = Math.PI / 2;
                ringMesh.position.copy(planetMesh.position);
                ringMesh.userData = { parentPlanet: planet.name };
                scene.current.add(ringMesh);
                ringMeshes.current.push(ringMesh);
            }
        });
    };

    const createSun = () => {
        scene.current.add(sun.current);

        const sunGeometry = new THREE.SphereGeometry(3, 128, 128);
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.current.load(sunTexture),
            emissive: 0xffaa44,
            emissiveIntensity: 1.5 * 1.5,
            transparent: false,
            opacity: 1.0,
        });

        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        sunMesh.name = "Sun";
        sun.current.add(sunMesh);

        const coronaGeometry = new THREE.SphereGeometry(3.2, 64, 64);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        corona.current = new THREE.Mesh(coronaGeometry, coronaMaterial);
        sun.current.add(corona.current);
    };

    const startFollowingPlanet = (planetMesh) => {
        if (zoomState === 'in' && followTarget.current === planetMesh) {
            stopFollowingPlanet();
            setZoomState('out');
            return;
        }

        followTarget.current = planetMesh;
        followDistance.current = planetMesh.data.size * 5;
        setIsFollowingPlanet(true);
        controls.current.enabled = false;
        setZoomState('in');
    };

    const stopFollowingPlanet = () => {
        followTarget.current = null;
        setIsFollowingPlanet(false);
        controls.current.enabled = true;
        setZoomState('out');
        setActivePlanet('none');
        camera.current.position.set(0, 150, 150);
        camera.current.lookAt(0, 0, 0);
        controls.current.target.set(0, 0, 0);
        controls.current.update();
    };

    useEffect(() => {
        const init = () => {
            if (!canvasRef.current) return;

            scene.current.background = new THREE.Color(0x000000);
            scene.current.fog = new THREE.FogExp2(0x000000, 0.00003);

            camera.current = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                20000
            );
            camera.current.position.set(0, 150, 150);
            camera.current.lookAt(0, 0, 0);

            renderer.current = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                antialias: true,
                powerPreference: "high-performance",
                logarithmicDepthBuffer: true
            });
            renderer.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.current.setSize(window.innerWidth, window.innerHeight);
            renderer.current.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.current.toneMappingExposure = exposure;
            renderer.current.shadowMap.enabled = false;

            controls.current = new OrbitControls(camera.current, renderer.current.domElement);
            controls.current.enableDamping = true;
            controls.current.dampingFactor = 0.08;
            controls.current.minDistance = 5;
            controls.current.maxDistance = 300;
            controls.current.autoRotate = autoRotate;
            controls.current.autoRotateSpeed = 0.05;

            composer.current = new EffectComposer(renderer.current);
            composer.current.addPass(new RenderPass(scene.current, camera.current));

            bloomPass.current = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1,
                0.6,
                0.4
            );
            bloomPass.current.enabled = bloomEnabled;
            composer.current.addPass(bloomPass.current);

            outputPass.current = new OutputPass();
            composer.current.addPass(outputPass.current);

            directionalLight.current = new THREE.DirectionalLight(0xffddbb, 1.0);
            directionalLight.current.position.set(10, 5, 10);
            scene.current.add(directionalLight.current);

            hemiLight.current = new THREE.HemisphereLight(0x443388, 0x000011, 0.05);
            scene.current.add(hemiLight.current);

            pointLight.current = new THREE.PointLight(0xffdd99, 2.0, 100);
            pointLight.current.position.set(0, 0, 0);
            scene.current.add(pointLight.current);

            const galaxy = generateStarfield;
            scene.current.add(galaxy);

            createSun();
            createPlanets();
            createOrbitPaths();

            asteroidBeltRef.current = createAsteroidBelt();
            scene.current.add(asteroidBeltRef.current);

            canvasRef.current.addEventListener('click', onCanvasClick, false);
            canvasRef.current.addEventListener('mousemove', onMouseMove, false);
            window.addEventListener('resize', onWindowResize);

            animate();
        };

        const onCanvasClick = (event) => {
            if (!camera.current || !renderer.current) return;

            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera.current);

            const intersects = raycaster.intersectObjects(
                planetMeshes.current.map(p => p.mesh)
            );

            if (intersects.length > 0) {
                const planet = intersects[0].object;
                if (planet.userData.clickable) {
                    const planetData = planetMeshes.current.find(p => p.mesh.name === planet.name);
                    if (planetData) {
                        startFollowingPlanet(planetData);
                        setActivePlanet(planet.name);
                    }
                }
            }
        };

        const onMouseMove = (event) => {
            if (!camera.current || !renderer.current) return;

            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera.current);

            const intersects = raycaster.intersectObjects(
                planetMeshes.current.map(p => p.mesh)
            );

            if (intersects.length > 0) {
                setHoveredPlanet(intersects[0].object.name);
            } else {
                setHoveredPlanet(null);
            }
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);

            sun.current.rotation.y += sunRotationSpeed.current * timeScale;

            planetMeshes.current.forEach(planetObj => {
                const { mesh, data } = planetObj;

                mesh.position.x = data.distance * Math.cos(Date.now() * 0.0001 * data.orbitSpeed * timeScale);
                mesh.position.z = data.distance * Math.sin(Date.now() * 0.0001 * data.orbitSpeed * timeScale);
                mesh.rotation.y += 0.01 * data.rotationSpeed * timeScale;

                if (data.hasRings) {
                    const ring = ringMeshes.current.find(r => r.userData.parentPlanet === data.name);
                    if (ring) {
                        ring.position.copy(mesh.position);
                    }
                }
            });

            if (asteroidBeltRef.current) {
                asteroidBeltRef.current.rotation.y += 0.0001 * timeScale;
            }

            if (isFollowingPlanet && followTarget.current) {
                const planet = followTarget.current.mesh;
                const distance = followDistance.current;

                const angle = Date.now() * 0.0005;
                const offsetX = Math.sin(angle) * distance;
                const offsetZ = Math.cos(angle) * distance;

                camera.current.position.x = planet.position.x + offsetX;
                camera.current.position.z = planet.position.z + offsetZ;
                camera.current.position.y = planet.position.y + distance * 0.3;

                camera.current.lookAt(planet.position);
                controls.current.target.copy(planet.position);
            }

            controls.current.update();
            renderer.current.toneMappingExposure = exposure;
            controls.current.autoRotate = autoRotate;

            if (pointLight.current) {
                pointLight.current.intensity = 2.0;
                pointLight.current.color.setHSL(0.1, 0.9, 0.8);
            }
            if (directionalLight.current) {
                directionalLight.current.intensity = 1.0;
                directionalLight.current.color.setHSL(0.1, 0.8, 0.85);
            }

            if (corona.current) {
                corona.current.material.opacity = 0.2;
            }

            bloomPass.current.enabled = bloomEnabled;
            if (bloomEnabled) {
                bloomPass.current.strength = 1 + Math.sin(Date.now() * 0.001) * 0.2;
            }

            const pulseFactor = 1 + Math.sin(Date.now() * 0.002) * 0.02;
            sun.current.scale.set(pulseFactor, pulseFactor, pulseFactor);

            planetMeshes.current.forEach(planetObj => {
                const isActive = planetObj.mesh.name === activePlanet;
                planetObj.mesh.scale.setScalar(isActive ? 1.1 : 1);
            });

            composer.current.render();
        };

        const onWindowResize = () => {
            camera.current.aspect = window.innerWidth / window.innerHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(window.innerWidth, window.innerHeight);
            composer.current.setSize(window.innerWidth, window.innerHeight);
            bloomPass.current.setSize(window.innerWidth, window.innerHeight);
        };

        init();

        return () => {
            window.removeEventListener('resize', onWindowResize);
            canvasRef.current?.removeEventListener('click', onCanvasClick);
            canvasRef.current?.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId.current);
            if (renderer.current) renderer.current.dispose();
            if (controls.current) controls.current.dispose();
            if (composer.current) composer.current.dispose();
            if (bloomPass.current) bloomPass.current.dispose();

            if (asteroidBeltRef.current) {
                scene.current.remove(asteroidBeltRef.current);
                asteroidBeltRef.current.geometry.dispose();
                asteroidBeltRef.current.material.dispose();
                asteroidBeltRef.current = null;
            }
        };
    }, [generateStarfield, autoRotate, bloomEnabled, activePlanet, isFollowingPlanet]);

    useEffect(() => {
        if (renderer.current) {
            renderer.current.toneMappingExposure = exposure;
        }
    }, [exposure]);

    useEffect(() => {
        if (!camera.current || !controls.current) return;

        if (activePlanet === 'none') {
            stopFollowingPlanet();
        } else {
            const planet = planetMeshes.current.find(p => p.mesh.name === activePlanet);
            if (planet) {
                startFollowingPlanet(planet);
            }
        }
    }, [activePlanet]);

    const handleSeeMore = (planetName) => {
        navigate(`/${planetName}`);
    };

    const handleBackToSolarSystem = () => {
        stopFollowingPlanet();
        navigate('/');
    };

    const toggleInfoPanel = () => {
        setShowInfoPanel(!showInfoPanel);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 196, 0, 0.4);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 196, 0, 0.6);
                }
                .stats-grid {
                    max-height: 200px;
                    overflow-y: auto;
                }
                .glass-panel {
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .planet-button {
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .planet-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                }
                .planet-button.active {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
                }
                .zoom-indicator {
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(15, 23, 42, 0.85);
                    padding: 6px 12px;
                    border-radius: 20px;
                    color: #93c5fd;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                @media (min-width: 768px) {
                    .info-panel {
                        width: 24rem;
                        max-height: calc(100vh - 3rem);
                    }
                }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {zoomState === 'in' && (
                <div className="zoom-indicator glass-panel">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Viewing {activePlanet}
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-20 glass-panel p-4 rounded-xl shadow-xl">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-indigo-300 font-medium">Controls</h3>
                        <button
                            onClick={toggleInfoPanel}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            {showInfoPanel ? 'Hide Info' : 'Show Info'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setAutoRotate(!autoRotate)}
                            className={`px-3 py-2 rounded-lg planet-button ${
                                autoRotate ? 'bg-emerald-700/90 text-white' : 'bg-slate-800 text-indigo-300'
                            }`}
                        >
                            {autoRotate ? 'Auto Rotate ON' : 'Auto Rotate OFF'}
                        </button>
                        <button
                            onClick={() => setBloomEnabled(!bloomEnabled)}
                            className={`px-3 py-2 rounded-lg planet-button ${
                                bloomEnabled ? 'bg-indigo-700/90 text-white' : 'bg-slate-800 text-indigo-300'
                            }`}
                        >
                            {bloomEnabled ? 'Bloom ON' : 'Bloom OFF'}
                        </button>
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between text-indigo-400 text-xs mb-1">
                            <span>Time Scale</span>
                            <span>{timeScale.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={timeScale}
                            onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between text-indigo-400 text-xs mb-1">
                            <span>Exposure</span>
                            <span>{exposure.toFixed(1)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={exposure}
                            onChange={(e) => setExposure(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {hoveredPlanet && (
                <div className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg text-indigo-200 z-20">
                    {hoveredPlanet.charAt(0).toUpperCase() + hoveredPlanet.slice(1)}
                </div>
            )}

            {showInfoPanel && (
                <div className="absolute top-4 right-4 glass-panel p-4 rounded-xl max-w-md z-20 overflow-y-auto max-h-[80vh] custom-scrollbar">
                    <h2 className="text-xl font-bold text-indigo-100 mb-2">
                        {activePlanet === 'none' ? 'Solar System' : currentStats.current.name}
                    </h2>
                    <div className="stats-grid grid grid-cols-2 gap-2">
                        {Object.entries(currentStats.current).map(([key, value]) => (
                            <div key={key} className="glass-panel p-2 rounded">
                                <span className="text-xs font-semibold text-indigo-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <div className="text-sm text-indigo-100">{value}</div>
                            </div>
                        ))}
                    </div>

                    {activePlanet === 'none' && (
                        <div className="mt-4">
                            <h3 className="font-bold text-indigo-200">Asteroid Belt</h3>
                            <p className="text-sm mt-2 text-indigo-100">
                                Located between Mars and Jupiter, this belt contains millions of rocky remnants
                                from the early solar system that never formed into a planet.
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="text-sm text-indigo-100">
                                    <span className="font-semibold">Width:</span>
                                    <span className="ml-1">140 million miles</span>
                                </div>
                                <div className="text-sm text-indigo-100">
                                    <span className="font-semibold">Largest Asteroid:</span>
                                    <span className="ml-1">Ceres (940 km)</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activePlanet !== 'none' && (
                        <button
                            onClick={() => handleSeeMore(activePlanet)}
                            className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium planet-button hover:from-indigo-700 hover:to-purple-700 transition-all"
                        >
                            Explore {activePlanet.charAt(0).toUpperCase() + activePlanet.slice(1)}
                        </button>
                    )}
                </div>
            )}

            {activePlanet !== 'none' && (
                <div className="absolute bottom-20 left-4 glass-panel p-4 rounded-xl z-20">
                    <button
                        onClick={handleBackToSolarSystem}
                        className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg text-indigo-200 font-medium planet-button hover:from-slate-800 hover:to-slate-900 transition-all flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Solar System
                    </button>
                </div>
            )}

            <div className="absolute bottom-24 right-4 flex flex-wrap gap-2 justify-end max-w-[50%]">
                {PLANET_DATA.map(planet => (
                    <button
                        key={planet.name}
                        onClick={() => {
                            const planetObj = planetMeshes.current.find(p => p.data.name === planet.name);
                            if (planetObj) {
                                startFollowingPlanet(planetObj);
                                setActivePlanet(planet.name);
                            }
                        }}
                        className={`glass-panel px-3 py-2 rounded-lg text-sm planet-button ${
                            activePlanet === planet.name
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : 'text-indigo-300'
                        }`}
                    >
                        {planet.name.charAt(0).toUpperCase() + planet.name.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
};

const GalaxyVisualizationWrapper = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const planetName = location.pathname.split('/').pop();
    const planetData = PLANET_DATA.find(p => p.name === planetName);

    return (
        <Routes>
            <Route path="/" element={<GalaxyVisualization />} />
            {planetData ? (
                <Route
                    path={`/${planetName}`}
                    element={
                        <PlanetDetailView
                            planetData={planetData}
                            onBack={() => navigate('/')}
                        />
                    }
                />
            ) : (
                <Route path="*" element={<GalaxyVisualization />} />
            )}
        </Routes>
    );
};

export default GalaxyVisualizationWrapper;
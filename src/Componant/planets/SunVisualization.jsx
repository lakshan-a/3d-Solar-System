import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import sunTexture from '../../assets/images/sun/2k_sun.jpg';

const SunVisualization = () => {
    const canvasRef = useRef(null);
    const [brightness, setBrightness] = useState(1.0); // Unified brightness control (0.1 to 3.0)
    const [exposure, setExposure] = useState(1.2);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [viewMode, setViewMode] = useState('sun');
    const [rotationSpeed, setRotationSpeed] = useState(0.5);

    // Calculate derived brightness values
    const surfaceIntensity = useMemo(() => brightness * 2.5, [brightness]);
    const bloomStrength = useMemo(() => brightness * 2.5, [brightness]);
    const coronaIntensity = useMemo(() => brightness * 0.5, [brightness]);

    const [stats] = useState({
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
    });

    // Three.js references
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
    const lensflare = useRef(null);
    const corona = useRef(null);

    // Texture paths for Sun
    const texturePaths = useMemo(() => ({
        colorMap: sunTexture,
    }), []);

    // Starfield generation
    const generateStarfield = useMemo(() => {
        const starCount = 10000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const radius = 5000 * (0.5 + Math.random() * 0.5);
            const theta = Math.random() * Math.PI * 2;
            let phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Darker star colors
            const starType = Math.random();
            let r, g, b;

            if (starType < 0.6) {
                r = 0.6 + Math.random() * 0.2;
                g = 0.5 + Math.random() * 0.2;
                b = 0.4 + Math.random() * 0.2;
            } else if (starType < 0.85) {
                r = 0.3 + Math.random() * 0.2;
                g = 0.4 + Math.random() * 0.2;
                b = 0.6 + Math.random() * 0.2;
            } else {
                r = 0.6 + Math.random() * 0.2;
                g = 0.3 + Math.random() * 0.2;
                b = 0.3 + Math.random() * 0.2;
            }

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;

            sizes[i] = (0.1 + Math.random() * 0.5) * (Math.random() > 0.98 ? 2 : 1);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geometry;
    }, []);

    useEffect(() => {
        // Initialize Three.js
        const init = () => {
            if (!canvasRef.current) return;

            // Scene setup - darker background
            scene.current.background = new THREE.Color(0x000000);
            scene.current.fog = new THREE.FogExp2(0x000000, 0.00005);

            // Camera
            camera.current = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.1,
                10000
            );
            camera.current.position.set(0, 0, 10);

            // Renderer
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

            // OrbitControls
            controls.current = new OrbitControls(camera.current, renderer.current.domElement);
            controls.current.enableDamping = true;
            controls.current.dampingFactor = 0.08;
            controls.current.minDistance = 5;
            controls.current.maxDistance = 50;
            controls.current.autoRotate = autoRotate;
            controls.current.autoRotateSpeed = 0.1;

            // Post-processing
            composer.current = new EffectComposer(renderer.current);
            composer.current.addPass(new RenderPass(scene.current, camera.current));

            bloomPass.current = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                bloomStrength, // Use computed bloom strength
                0.8,
                0.6
            );
            bloomPass.current.enabled = bloomEnabled;
            composer.current.addPass(bloomPass.current);

            outputPass.current = new OutputPass();
            composer.current.addPass(outputPass.current);

            // Lighting - Sun is the light source
            directionalLight.current = new THREE.DirectionalLight(0xffddbb, surfaceIntensity * 1.2);
            directionalLight.current.position.set(10, 5, 10);
            scene.current.add(directionalLight.current);

            // Enhanced Lens flare
            const textureFlare0 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare0.png");
            const textureFlare3 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare3.png");

            lensflare.current = new Lensflare();
            lensflare.current.addElement(new LensflareElement(textureFlare0, 1200 * brightness, 0, new THREE.Color(0xffdd99)));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 150 * brightness, 0.6));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 200 * brightness, 0.7));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 250 * brightness, 0.9));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 150 * brightness, 1));
            directionalLight.current.add(lensflare.current);

            // Ambient light
            hemiLight.current = new THREE.HemisphereLight(0x443388, 0x000011, 0.1);
            scene.current.add(hemiLight.current);

            // Stronger point light at sun's position
            pointLight.current = new THREE.PointLight(0xffdd99, surfaceIntensity * 3.0, 100);
            pointLight.current.position.set(0, 0, 0);
            scene.current.add(pointLight.current);

            // Create Sun
            createSun();

            // Add starfield
            const starMaterial = new THREE.PointsMaterial({
                size: 0.8,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: true,
                fog: false
            });

            const stars = new THREE.Points(generateStarfield, starMaterial);
            scene.current.add(stars);

            // Handle window resize
            window.addEventListener('resize', onWindowResize);

            // Start animation
            animate();
        };

        const createSun = () => {
            scene.current.add(sun.current);

            // Sun geometry
            const sunGeometry = new THREE.SphereGeometry(3, 128, 128);

            // Enhanced Sun material - brighter and more intense
            const sunMaterial = new THREE.MeshBasicMaterial({
                color: 0xffdd99,
                emissive: 0xffaa44,
                emissiveIntensity: surfaceIntensity * 2.0,
                transparent: false,
                opacity: 1.0,
            });

            // Load texture
            textureLoader.current.load(texturePaths.colorMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                sunMaterial.map = texture;
                sunMaterial.needsUpdate = true;
            });

            // Sun mesh
            const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
            sunMesh.name = "Sun";
            sun.current.add(sunMesh);

            // Add corona effect
            const coronaGeometry = new THREE.SphereGeometry(3.2, 64, 64);
            const coronaMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: coronaIntensity,
                side: THREE.BackSide
            });
            corona.current = new THREE.Mesh(coronaGeometry, coronaMaterial);
            sun.current.add(corona.current);
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);

            // Rotate Sun
            sun.current.rotation.y += sunRotationSpeed.current;

            // Update controls
            controls.current.update();

            // Update exposure
            renderer.current.toneMappingExposure = exposure;

            // Update auto-rotation
            controls.current.autoRotate = autoRotate;

            // Update light intensity based on brightness
            if (pointLight.current) {
                pointLight.current.intensity = surfaceIntensity * 3.0;
                pointLight.current.color.setHSL(0.1, 0.9, 0.9);
            }
            if (directionalLight.current) {
                directionalLight.current.intensity = surfaceIntensity * 1.2;
                directionalLight.current.color.setHSL(0.1, 0.8, 0.95);
            }

            // Update corona opacity based on brightness
            if (corona.current) {
                corona.current.material.opacity = coronaIntensity;
            }

            // Update bloom strength based on brightness
            bloomPass.current.enabled = bloomEnabled;
            if (bloomEnabled) {
                bloomPass.current.strength = bloomStrength + Math.sin(Date.now() * 0.001) * 0.3;
            }

            // Subtle pulsing animation
            const pulseFactor = 1 + Math.sin(Date.now() * 0.002) * 0.02;
            sun.current.scale.set(pulseFactor, pulseFactor, pulseFactor);

            // Render with post-processing
            composer.current.render();
        };

        const onWindowResize = () => {
            camera.current.aspect = window.innerWidth / window.innerHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(window.innerWidth, window.height);
            composer.current.setSize(window.innerWidth, window.height);
            bloomPass.current.setSize(window.innerWidth, window.height);
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
    }, [texturePaths, generateStarfield, autoRotate, bloomEnabled, brightness, bloomStrength, surfaceIntensity, coronaIntensity]);

    useEffect(() => {
        sunRotationSpeed.current = rotationSpeed * 0.0002;
    }, [rotationSpeed]);

    useEffect(() => {
        if (renderer.current) {
            renderer.current.toneMappingExposure = exposure;
        }
    }, [exposure]);

    useEffect(() => {
        if (!camera.current || !controls.current) return;

        switch (viewMode) {
            case 'sun':
                camera.current.position.set(0, 0, 10);
                controls.current.reset();
                break;
            case 'closeup':
                camera.current.position.set(0, 0, 5);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'poleView':
                camera.current.position.set(0, 7, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'equator':
                camera.current.position.set(10, 0, 0);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'wideView':
                camera.current.position.set(0, 0, 20);
                camera.current.lookAt(0, 0, 0);
                break;
            default:
                break;
        }
    }, [viewMode]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Custom scrollbar styles */}
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
                @media (min-width: 768px) {
                    .info-panel {
                        width: 24rem;
                        max-height: calc(100vh - 3rem);
                    }
                }
            `}</style>

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Toggle button for info panel */}
            <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="absolute top-4 right-4 z-20 bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                aria-label="Toggle info panel"
            >
                {showInfoPanel ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>

            {/* Enhanced info panel with scrollable content */}
            {showInfoPanel && (
                <div className="absolute top-4 left-4 right-4 bottom-4 md:top-6 md:left-6 md:right-auto md:bottom-auto info-panel z-10 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                    {/* Panel header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-800">
                        <h1 className="text-xl md:text-2xl font-bold text-amber-400">
                            Solar Explorer
                        </h1>
                        <button
                            onClick={() => setShowInfoPanel(false)}
                            className="text-gray-400 hover:text-amber-400 transition-colors"
                            aria-label="Close panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <p className="text-gray-400 mb-4 text-sm italic">
                            "The star at the center of our solar system, a nearly perfect sphere of hot plasma that provides energy for life on Earth."
                        </p>

                        {/* Stats grid - responsive columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 stats-grid">
                            {Object.entries(stats).map(([key, value]) => (
                                <div key={key} className="bg-gray-800/90 p-3 rounded-lg border-l-2 border-amber-500/50 hover:border-amber-400 transition-colors">
                                    <div className="text-amber-400 text-xs font-medium uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</div>
                                    <div className="text-gray-200 text-sm font-bold">{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Controls section */}
                        <div className="space-y-4 pb-4">
                            {/* Sliders */}
                            {[
                                { label: 'Rotation Speed', value: rotationSpeed, min: 0, max: 2, step: 0.1, onChange: setRotationSpeed, color: 'amber' },
                                { label: 'Brightness', value: brightness, min: 0.1, max: 3, step: 0.1, onChange: setBrightness, color: 'amber' },
                                { label: 'Exposure', value: exposure, min: 0.1, max: 2, step: 0.1, onChange: setExposure, color: 'blue' },
                            ].map((slider) => (
                                <div key={slider.label}>
                                    <div className="flex justify-between text-gray-400 text-xs mb-1">
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
                                        className={`w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${slider.color}-500`}
                                    />
                                </div>
                            ))}

                            {/* Toggle buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setBloomEnabled(!bloomEnabled)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                        bloomEnabled
                                            ? 'bg-amber-700/90 text-white shadow-md shadow-amber-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {bloomEnabled ? 'Bloom ON' : 'Bloom OFF'}
                                </button>

                                <button
                                    onClick={() => setAutoRotate(!autoRotate)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                        autoRotate
                                            ? 'bg-green-700/90 text-white shadow-md shadow-green-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {autoRotate ? 'Auto ON' : 'Auto OFF'}
                                </button>
                            </div>

                            {/* Reset button */}
                            <button
                                onClick={() => {
                                    setViewMode('sun');
                                    setBrightness(1.0);
                                    setExposure(1.2);
                                    controls.current?.reset();
                                }}
                                className="w-full py-2 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center"
                            >
                                Reset View
                            </button>

                            {/* View mode buttons - responsive grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                    { mode: 'sun', label: 'Standard' },
                                    { mode: 'closeup', label: 'Close-up' },
                                    { mode: 'poleView', label: 'Polar' },
                                    { mode: 'equator', label: 'Equatorial' },
                                    { mode: 'wideView', label: 'Wide' },
                                ].map(({ mode, label }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`py-2 rounded-lg text-xs transition-all ${
                                            viewMode === mode
                                                ? 'bg-amber-700/90 text-white shadow-md shadow-amber-500/20'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating controls for mobile */}
            <div className="md:hidden fixed bottom-4 right-4 z-20 flex flex-col space-y-2">
                <button
                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                    className="bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                    aria-label="Toggle info panel"
                >
                    {showInfoPanel ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={() => {
                        setViewMode('sun');
                        setBrightness(1.0);
                        setExposure(1.2);
                        controls.current?.reset();
                    }}
                    className="bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                    aria-label="Reset view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SunVisualization;
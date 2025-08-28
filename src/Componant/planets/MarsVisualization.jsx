import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import marsTexture from '../../assets/images/mars/2k_mars.jpg';
import marsBumpMap from '../../assets/images/mars/2k_mars_bump.jpg';
// import marsSpecularMap from '../assets/images/mars/2k_mars_specular.jpg';

const MarsVisualization = () => {
    const canvasRef = useRef(null);
    const [rotationSpeed, setRotationSpeed] = useState(0.5);
    const [viewMode, setViewMode] = useState('mars');
    const [lightIntensity, setLightIntensity] = useState(1.0);
    const [exposure, setExposure] = useState(1.0);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [showAtmosphere, setShowAtmosphere] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [showDustStorm, setShowDustStorm] = useState(false);
    const [stats] = useState({
        diameter: '6,779 km',
        gravity: '3.71 m/s²',
        temperature: '-63°C (avg)',
        dayLength: '24.6 hours',
        orbitalPeriod: '687 Earth days',
        moons: '2 (Phobos & Deimos)',
        atmosphere: '95% CO₂, 3% N₂, 1.6% Ar',
        pressure: '0.6% of Earth',
        discovery: 'Known since antiquity',
        mass: '0.107 Earth masses',
        magneticField: 'Very weak',
        axialTilt: '25.19°',
        composition: 'Iron-rich silicate rocks',
        highestPoint: 'Olympus Mons (21.9 km)',
        uniqueFeature: 'Valles Marineris canyon system',
        water: 'Polar ice caps, subsurface water',
        dustStorms: 'Can cover entire planet'
    });

    // Three.js references
    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const mars = useRef(new THREE.Group());
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const outputPass = useRef(null);
    const marsRotationSpeed = useRef(0.0005);
    const directionalLight = useRef(null);
    const pointLight = useRef(null);
    const hemiLight = useRef(null);
    const animationFrameId = useRef(null);
    const textureLoader = useRef(new THREE.TextureLoader());
    const atmosphereMesh = useRef(null);
    const dustParticles = useRef(null);

    // Texture paths for Mars
    const texturePaths = useMemo(() => ({
        colorMap: marsTexture,
        bumpMap: marsBumpMap,
        // specularMap: marsSpecularMap
    }), []);

    // Starfield generation
    const generateStarfield = useMemo(() => {
        const starCount = 30000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const radius = 5000 * (0.5 + Math.random() * 0.5);
            const theta = Math.random() * Math.PI * 2;
            let phi = Math.acos(2 * Math.random() - 1);

            if (Math.random() > 0.3) {
                phi = Math.PI/2 + (Math.random() - 0.5) * Math.PI/4;
            }

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const starType = Math.random();
            let r, g, b;

            if (starType < 0.6) {
                r = 0.8 + Math.random() * 0.2;
                g = 0.7 + Math.random() * 0.3;
                b = 0.6 + Math.random() * 0.4;
            } else if (starType < 0.85) {
                r = 0.4 + Math.random() * 0.2;
                g = 0.6 + Math.random() * 0.3;
                b = 0.8 + Math.random() * 0.2;
            } else if (starType < 0.95) {
                r = 0.8 + Math.random() * 0.2;
                g = 0.4 + Math.random() * 0.2;
                b = 0.4 + Math.random() * 0.2;
            } else {
                r = 0.7 + Math.random() * 0.2;
                g = 0.4 + Math.random() * 0.2;
                b = 0.8 + Math.random() * 0.2;
            }

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;

            sizes[i] = (0.1 + Math.random() * 0.7) * (Math.random() > 0.98 ? 3 : 1);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geometry;
    }, []);

    // Create dust storm particles
    const createDustStorm = useMemo(() => {
        const particleCount = 5000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const radius = 2.1 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            colors[i * 3] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 1] = 0.4 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.2 + Math.random() * 0.2;

            sizes[i] = 0.05 + Math.random() * 0.1;
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

            // Scene setup
            scene.current.background = new THREE.Color(0x000008);
            scene.current.fog = new THREE.FogExp2(0x00000a, 0.00008);

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
            renderer.current.shadowMap.enabled = true;
            renderer.current.shadowMap.type = THREE.PCFSoftShadowMap;

            // OrbitControls
            controls.current = new OrbitControls(camera.current, renderer.current.domElement);
            controls.current.enableDamping = true;
            controls.current.dampingFactor = 0.08;
            controls.current.minDistance = 4;
            controls.current.maxDistance = 30;
            controls.current.maxPolarAngle = Math.PI;
            controls.current.minPolarAngle = 0;
            controls.current.autoRotate = autoRotate;
            controls.current.autoRotateSpeed = 0.2;
            controls.current.enablePan = true;
            controls.current.screenSpacePanning = false;

            // Post-processing
            composer.current = new EffectComposer(renderer.current);
            composer.current.addPass(new RenderPass(scene.current, camera.current));

            bloomPass.current = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.5,
                0.8,
                0.9
            );
            bloomPass.current.enabled = bloomEnabled;
            composer.current.addPass(bloomPass.current);

            outputPass.current = new OutputPass();
            composer.current.addPass(outputPass.current);

            // Lighting - warmer light for Mars
            directionalLight.current = new THREE.DirectionalLight(0xffcc99, lightIntensity);
            directionalLight.current.position.set(10, 5, 10);
            directionalLight.current.castShadow = true;
            directionalLight.current.shadow.mapSize.width = 2048;
            directionalLight.current.shadow.mapSize.height = 2048;
            directionalLight.current.shadow.camera.near = 0.5;
            directionalLight.current.shadow.camera.far = 500;
            directionalLight.current.shadow.bias = -0.0001;
            scene.current.add(directionalLight.current);

            // Lens flare with warmer colors
            const textureFlare0 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare0.png");
            const textureFlare3 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare3.png");

            const lensflare = new Lensflare();
            lensflare.addElement(new LensflareElement(textureFlare0, 800, 0, directionalLight.current.color));
            lensflare.addElement(new LensflareElement(textureFlare3, 80, 0.6));
            lensflare.addElement(new LensflareElement(textureFlare3, 90, 0.7));
            lensflare.addElement(new LensflareElement(textureFlare3, 150, 0.9));
            lensflare.addElement(new LensflareElement(textureFlare3, 80, 1));
            directionalLight.current.add(lensflare);

            // Ambient light with warmer color
            hemiLight.current = new THREE.HemisphereLight(0x774422, 0x110000, 0.3);
            scene.current.add(hemiLight.current);

            // Create Mars
            createMars();

            // Add starfield
            const starMaterial = new THREE.PointsMaterial({
                size: 1.0,
                vertexColors: true,
                transparent: true,
                opacity: 0.95,
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

        const createMars = () => {
            scene.current.add(mars.current);

            // Mars geometry
            const marsGeometry = new THREE.SphereGeometry(2, 256, 256);

            // Lighter Mars material with adjusted properties
            const marsMaterial = new THREE.MeshPhysicalMaterial({
                roughness: 0.8, // Slightly less rough for more reflectivity
                metalness: 0.15, // Slightly more metallic for brighter highlights
                clearcoat: 0.1, // Increased clearcoat for more shine
                clearcoatRoughness: 0.3,
                color: 0xb46d3a, // Lighter reddish base color (original was 0x8c4d1a)
                specularColor: new THREE.Color(0xdd7744),
                specularIntensity: 0.4, // Increased specular
                sheen: 0.15, // Increased sheen
                sheenColor: new THREE.Color(0xdd7744),
                emissive: 0x8c4d1a, // Add emissive color
                emissiveIntensity: 0.15, // Make it slightly glow
                ior: 1.3 // Slightly higher index of refraction
            });

            // Load textures with color adjustment
            textureLoader.current.load(texturePaths.colorMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                texture.encoding = THREE.sRGBEncoding;

                // Create a lighter version of the texture
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = texture.image.width;
                canvas.height = texture.image.height;
                context.drawImage(texture.image, 0, 0);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Lighten the texture (adjust these factors to control lightness)
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.15);     // R (increase more)
                    data[i + 1] = Math.min(255, data[i + 1] * 1.1); // G
                    data[i + 2] = Math.min(255, data[i + 2] * 1.05); // B
                }

                context.putImageData(imageData, 0, 0);

                const lighterTexture = new THREE.CanvasTexture(canvas);
                lighterTexture.anisotropy = texture.anisotropy;
                lighterTexture.encoding = texture.encoding;

                marsMaterial.map = lighterTexture;
                marsMaterial.needsUpdate = true;
            });

            // Load bump map
            textureLoader.current.load(texturePaths.bumpMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                marsMaterial.bumpMap = texture;
                marsMaterial.bumpScale = 0.05;
                marsMaterial.needsUpdate = true;
            });

            // Load specular map
            textureLoader.current.load(texturePaths.specularMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                marsMaterial.specularMap = texture;
                marsMaterial.needsUpdate = true;
            });

            // Mars mesh
            const marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
            marsMesh.receiveShadow = true;
            marsMesh.castShadow = true;
            marsMesh.name = "Mars";

            // Apply Mars's axial tilt (25.19°)
            marsMesh.rotation.z = THREE.MathUtils.degToRad(25.19);

            mars.current.add(marsMesh);

            // Create atmosphere with reddish color
            const atmosphereGeometry = new THREE.SphereGeometry(2.1, 128, 128);
            const atmosphereMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x9c5d2a, // Reddish atmosphere color
                transparent: true,
                opacity: 0.15,
                roughness: 0.8,
                metalness: 0,
                ior: 1.01,
                thickness: 0.8,
                transmission: 0.6,
                side: THREE.DoubleSide,
                specularColor: new THREE.Color(0xdd7744),
                specularIntensity: 0.3,
                clearcoat: 0.05,
                emissive: 0x7c3d1a,
                emissiveIntensity: 0.05,
                sheen: 0.2,
                sheenColor: new THREE.Color(0xcc6633)
            });

            atmosphereMesh.current = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphereMesh.current.visible = showAtmosphere;
            atmosphereMesh.current.name = "Atmosphere";
            atmosphereMesh.current.rotation.z = THREE.MathUtils.degToRad(25.19);
            mars.current.add(atmosphereMesh.current);

            // Create dust storm particles
            const particleMaterial = new THREE.PointsMaterial({
                size: 0.1,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: true,
                blending: THREE.AdditiveBlending
            });

            dustParticles.current = new THREE.Points(createDustStorm, particleMaterial);
            dustParticles.current.visible = showDustStorm;
            dustParticles.current.name = "DustStorm";
            mars.current.add(dustParticles.current);
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);

            // Rotate Mars
            mars.current.rotation.y += marsRotationSpeed.current;

            // Update controls
            controls.current.update();

            // Update atmosphere
            if (atmosphereMesh.current) {
                atmosphereMesh.current.visible = showAtmosphere;
                atmosphereMesh.current.material.opacity = showAtmosphere ? 0.15 : 0;

                if (showAtmosphere) {
                    const pulse = Math.sin(Date.now() * 0.001) * 0.02;
                    atmosphereMesh.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
                }
            }

            // Update dust storm
            if (dustParticles.current) {
                dustParticles.current.visible = showDustStorm;

                if (showDustStorm) {
                    // Animate dust particles
                    const positions = dustParticles.current.geometry.attributes.position.array;
                    const time = Date.now() * 0.0005;

                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i] += Math.sin(time + positions[i] * 0.5) * 0.001;
                        positions[i + 1] += Math.cos(time + positions[i + 1] * 0.5) * 0.001;
                        positions[i + 2] += Math.sin(time + positions[i + 2] * 0.5) * 0.001;
                    }

                    dustParticles.current.geometry.attributes.position.needsUpdate = true;
                    dustParticles.current.rotation.y += 0.0005;
                }
            }

            // Update bloom
            bloomPass.current.enabled = bloomEnabled;
            if (bloomEnabled) {
                bloomPass.current.strength = 0.5 + Math.sin(Date.now() * 0.001) * 0.1;
            }

            // Update exposure
            renderer.current.toneMappingExposure = exposure;

            // Update auto-rotation
            controls.current.autoRotate = autoRotate;

            // Update light intensity
            if (directionalLight.current) {
                directionalLight.current.intensity = lightIntensity;
            }

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
    }, [texturePaths, generateStarfield, createDustStorm, autoRotate, bloomEnabled, showAtmosphere, showDustStorm]);

    useEffect(() => {
        marsRotationSpeed.current = rotationSpeed * 0.001;
    }, [rotationSpeed]);

    useEffect(() => {
        if (renderer.current) {
            renderer.current.toneMappingExposure = exposure;
        }
    }, [exposure]);

    useEffect(() => {
        if (!camera.current || !controls.current) return;

        switch (viewMode) {
            case 'mars':
                camera.current.position.set(0, 0, 10);
                controls.current.reset();
                break;
            case 'northPole':
                camera.current.position.set(0, 7, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'southPole':
                camera.current.position.set(0, -7, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'equator':
                camera.current.position.set(10, 0, 0);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'closeup':
                camera.current.position.set(0, 0, 5);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'darkSide':
                camera.current.position.set(-10, 0, 0);
                camera.current.lookAt(0, 0, 0);
                setLightIntensity(0.4);
                break;
            case 'olympusMons':
                camera.current.position.set(0, 0.5, 6);
                camera.current.lookAt(0, 0.5, 0);
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
                    background: rgba(255, 150, 100, 0.4);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 150, 100, 0.6);
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>

            {/* Enhanced info panel with scrollable content */}
            {showInfoPanel && (
                <div className="absolute top-4 left-4 right-4 bottom-4 md:top-6 md:left-6 md:right-auto md:bottom-auto info-panel z-10 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                    {/* Panel header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-800">
                        <h1 className="text-xl md:text-2xl font-bold text-red-400">
                            Mars Explorer
                        </h1>
                        <button
                            onClick={() => setShowInfoPanel(false)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
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
                            "The Red Planet, with the largest volcano and canyon system in the solar system, and potential for past or present life."
                        </p>

                        {/* Stats grid - responsive columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 stats-grid">
                            {Object.entries(stats).map(([key, value]) => (
                                <div key={key} className="bg-gray-800/90 p-3 rounded-lg border-l-2 border-red-500/50 hover:border-red-400 transition-colors">
                                    <div className="text-red-400 text-xs font-medium uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</div>
                                    <div className="text-gray-200 text-sm font-bold">{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Controls section */}
                        <div className="space-y-4 pb-4">
                            {/* Sliders */}
                            {[
                                { label: 'Rotation Speed', value: rotationSpeed, min: 0, max: 2, step: 0.1, onChange: setRotationSpeed, color: 'red' },
                                { label: 'Sun Intensity', value: lightIntensity, min: 0.1, max: 3, step: 0.1, onChange: setLightIntensity, color: 'red' },
                                { label: 'Exposure', value: exposure, min: 0.1, max: 1.5, step: 0.1, onChange: setExposure, color: 'red' },
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
                                            ? 'bg-red-700/90 text-white shadow-md shadow-red-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {bloomEnabled ? 'Bloom ON' : 'Bloom OFF'}
                                </button>

                                <button
                                    onClick={() => setShowAtmosphere(!showAtmosphere)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                        showAtmosphere
                                            ? 'bg-orange-700/90 text-white shadow-md shadow-orange-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {showAtmosphere ? 'Atmo ON' : 'Atmo OFF'}
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

                                <button
                                    onClick={() => setShowDustStorm(!showDustStorm)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                        showDustStorm
                                            ? 'bg-yellow-700/90 text-white shadow-md shadow-yellow-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {showDustStorm ? 'Dust ON' : 'Dust OFF'}
                                </button>
                            </div>

                            {/* Reset button */}
                            <button
                                onClick={() => {
                                    setViewMode('mars');
                                    setLightIntensity(1.0);
                                    controls.current?.reset();
                                }}
                                className="w-full py-2 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center"
                            >
                                Reset View
                            </button>

                            {/* View mode buttons - responsive grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {[
                                    { mode: 'mars', label: 'Global' },
                                    { mode: 'closeup', label: 'Close-up' },
                                    { mode: 'northPole', label: 'North' },
                                    { mode: 'southPole', label: 'South' },
                                    { mode: 'darkSide', label: 'Dark Side' },
                                    { mode: 'olympusMons', label: 'Olympus Mons' },
                                ].map(({ mode, label }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`py-2 rounded-lg text-xs transition-all ${
                                            viewMode === mode
                                                ? 'bg-red-700/90 text-white shadow-md shadow-red-500/20'
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={() => {
                        setViewMode('mars');
                        setLightIntensity(1.0);
                        controls.current?.reset();
                    }}
                    className="bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                    aria-label="Reset view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MarsVisualization;
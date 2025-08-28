import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import jupiterTexture from '../../assets/images/jupiter/2k_jupiter.jpg';

const JupiterVisualization = () => {
    const canvasRef = useRef(null);
    const [rotationSpeed, setRotationSpeed] = useState(0.5);
    const [viewMode, setViewMode] = useState('jupiter');
    const [lightIntensity, setLightIntensity] = useState(1.2);
    const [exposure, setExposure] = useState(1.0);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [showAtmosphere, setShowAtmosphere] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showGreatRedSpot, setShowGreatRedSpot] = useState(true);
    const [cloudOpacity, setCloudOpacity] = useState(0.9);
    const [stormIntensity, setStormIntensity] = useState(0.8);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [stats] = useState({
        diameter: '139,820 km',
        gravity: '24.79 m/s²',
        temperature: '-145°C (avg)',
        dayLength: '9.9 hours',
        orbitalPeriod: '4,333 Earth days',
        moons: '95 known',
        atmosphere: '90% H₂, 10% He',
        pressure: 'Unknown (gas giant)',
        greatRedSpot: '400-year-old storm',
        discovery: 'Known since ancient times',
        mass: '317.8 Earth masses',
        magneticField: '14x stronger than Earth'
    });

    // Three.js references
    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const jupiter = useRef(new THREE.Group());
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const outputPass = useRef(null);
    const jupiterRotationSpeed = useRef(0.0005);
    const directionalLight = useRef(null);
    const pointLight = useRef(null);
    const hemiLight = useRef(null);
    const animationFrameId = useRef(null);
    const textureLoader = useRef(new THREE.TextureLoader());
    const atmosphereMesh = useRef(null);
    const cloudLayer = useRef(null);
    const greatRedSpot = useRef(null);
    const lensflare = useRef(null);
    const rings = useRef(null);
    const moon = useRef(null);

    // Texture paths for Jupiter and its moon
    const texturePaths = useMemo(() => ({
        colorMap: jupiterTexture,
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
            camera.current.position.set(0, 0, 7);

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
            controls.current.minDistance = 3;
            controls.current.maxDistance = 25;
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

            // Lighting
            directionalLight.current = new THREE.DirectionalLight(0xffeedd, lightIntensity);
            directionalLight.current.position.set(10, 5, 10);
            directionalLight.current.castShadow = true;
            directionalLight.current.shadow.mapSize.width = 2048;
            directionalLight.current.shadow.mapSize.height = 2048;
            directionalLight.current.shadow.camera.near = 0.5;
            directionalLight.current.shadow.camera.far = 500;
            directionalLight.current.shadow.bias = -0.0001;
            scene.current.add(directionalLight.current);

            // Lens flare
            const textureFlare0 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare0.png");
            const textureFlare3 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare3.png");

            lensflare.current = new Lensflare();
            lensflare.current.addElement(new LensflareElement(textureFlare0, 800, 0, directionalLight.current.color));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 80, 0.6));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 90, 0.7));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 150, 0.9));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 80, 1));
            directionalLight.current.add(lensflare.current);

            // Ambient light
            hemiLight.current = new THREE.HemisphereLight(0x443388, 0x000011, 0.2);
            scene.current.add(hemiLight.current);

            // Create Jupiter with moon
            createJupiter();

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

        const createJupiter = () => {
            scene.current.add(jupiter.current);

            // Jupiter geometry
            const jupiterGeometry = new THREE.SphereGeometry(2, 256, 256);

            // Jupiter material
            const jupiterMaterial = new THREE.MeshPhysicalMaterial({
                roughness: 0.8,
                metalness: 0.2,
                clearcoat: 0.1,
                clearcoatRoughness: 0.2,
                color: 0xccaa88
            });

            // Load textures
            textureLoader.current.load(texturePaths.colorMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                jupiterMaterial.map = texture;
                jupiterMaterial.needsUpdate = true;
            });

            textureLoader.current.load(texturePaths.normalMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                jupiterMaterial.normalMap = texture;
                jupiterMaterial.normalScale = new THREE.Vector2(1.8, 1.8);
                jupiterMaterial.needsUpdate = true;
            });

            textureLoader.current.load(texturePaths.roughnessMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                jupiterMaterial.roughnessMap = texture;
                jupiterMaterial.needsUpdate = true;
            });

            textureLoader.current.load(texturePaths.specularMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                jupiterMaterial.specularMap = texture;
                jupiterMaterial.specular = new THREE.Color(0x333333);
                jupiterMaterial.needsUpdate = true;
            });

            // Jupiter mesh
            const jupiterMesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
            jupiterMesh.receiveShadow = true;
            jupiterMesh.castShadow = true;
            jupiterMesh.name = "Jupiter";
            jupiter.current.add(jupiterMesh);

            // Create cloud layer
            textureLoader.current.load(texturePaths.cloudMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                const cloudGeometry = new THREE.SphereGeometry(2.02, 256, 256);
                const cloudMaterial = new THREE.MeshPhysicalMaterial({
                    map: texture,
                    transparent: true,
                    opacity: cloudOpacity,
                    alphaTest: 0.01,
                    side: THREE.DoubleSide,
                    roughness: 0.9,
                    metalness: 0,
                    clearcoat: 0.05,
                    transmission: 0.01
                });

                cloudLayer.current = new THREE.Mesh(cloudGeometry, cloudMaterial);
                cloudLayer.current.rotation.y = Math.PI / 2;
                cloudLayer.current.name = "CloudLayer";
                jupiter.current.add(cloudLayer.current);
            });

            // Create Great Red Spot
            textureLoader.current.load(texturePaths.greatRedSpotMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                const spotGeometry = new THREE.SphereGeometry(2.01, 256, 256);
                const spotMaterial = new THREE.MeshPhysicalMaterial({
                    map: texture,
                    transparent: true,
                    opacity: stormIntensity,
                    alphaTest: 0.01,
                    side: THREE.DoubleSide,
                    roughness: 0.7,
                    metalness: 0,
                    emissive: 0xaa4444,
                    emissiveIntensity: 0.3,
                    clearcoat: 0.1
                });

                greatRedSpot.current = new THREE.Mesh(spotGeometry, spotMaterial);
                greatRedSpot.current.visible = showGreatRedSpot;
                greatRedSpot.current.name = "GreatRedSpot";
                jupiter.current.add(greatRedSpot.current);
            });

            // Create atmosphere
            const atmosphereGeometry = new THREE.SphereGeometry(2.1, 128, 128);
            const atmosphereMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xaa8866,
                transparent: true,
                opacity: 0.25,
                roughness: 0.7,
                metalness: 0,
                ior: 1.03,
                thickness: 1.0,
                transmission: 0.8,
                side: THREE.DoubleSide,
                specularColor: new THREE.Color(0xffbb88),
                specularIntensity: 0.4,
                clearcoat: 0.2
            });

            atmosphereMesh.current = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphereMesh.current.visible = showAtmosphere;
            atmosphereMesh.current.name = "Atmosphere";
            jupiter.current.add(atmosphereMesh.current);

            // Create rings
            textureLoader.current.load(texturePaths.ringTexture, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                const ringGeometry = new THREE.RingGeometry(2.5, 4, 64);
                const ringMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide,
                    alphaTest: 0.01,
                    metalness: 0.1,
                    roughness: 0.8
                });

                rings.current = new THREE.Mesh(ringGeometry, ringMaterial);
                rings.current.rotation.x = Math.PI / 2.5;
                rings.current.name = "Rings";
                jupiter.current.add(rings.current);
            });

            // Create Ganymede (Jupiter's largest moon)
            const moonGeometry = new THREE.SphereGeometry(0.3, 64, 64);
            textureLoader.current.load(texturePaths.moonTexture, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                const moonMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.8,
                    metalness: 0.1
                });

                moon.current = new THREE.Mesh(moonGeometry, moonMaterial);
                moon.current.position.set(5, 0, 0);
                moon.current.castShadow = true;
                moon.current.receiveShadow = true;
                moon.current.name = "Ganymede";
                scene.current.add(moon.current);
            });
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);

            // Rotate Jupiter
            jupiter.current.rotation.y += jupiterRotationSpeed.current;

            // Rotate cloud layer
            if (cloudLayer.current) {
                cloudLayer.current.rotation.y += jupiterRotationSpeed.current * 1.15;
            }

            // Rotate rings
            if (rings.current) {
                rings.current.rotation.y += jupiterRotationSpeed.current * 0.5;
            }

            // Orbit moon around Jupiter
            if (moon.current) {
                moon.current.position.x = 5 * Math.cos(Date.now() * 0.0003);
                moon.current.position.z = 5 * Math.sin(Date.now() * 0.0003);
                moon.current.rotation.y += 0.005;
            }

            // Update controls
            controls.current.update();

            // Update atmosphere
            if (atmosphereMesh.current) {
                atmosphereMesh.current.visible = showAtmosphere;
                atmosphereMesh.current.material.opacity = showAtmosphere ? 0.25 : 0;

                if (showAtmosphere) {
                    const pulse = Math.sin(Date.now() * 0.001) * 0.02;
                    atmosphereMesh.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
                }
            }

            // Update cloud layer
            if (cloudLayer.current) {
                cloudLayer.current.material.opacity = cloudOpacity;
            }

            // Update Great Red Spot
            if (greatRedSpot.current) {
                greatRedSpot.current.visible = showGreatRedSpot;
                greatRedSpot.current.material.opacity = stormIntensity;
                greatRedSpot.current.material.emissiveIntensity = stormIntensity * 0.4;
                greatRedSpot.current.rotation.y += jupiterRotationSpeed.current * 0.85;

                if (showGreatRedSpot) {
                    const pulse = Math.sin(Date.now() * 0.002) * 0.01;
                    greatRedSpot.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
                }
            }

            // Update bloom
            bloomPass.current.enabled = bloomEnabled;
            if (bloomEnabled) {
                bloomPass.current.strength = 1.2 + Math.sin(Date.now() * 0.001) * 0.1;
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
    }, [texturePaths, generateStarfield, autoRotate, bloomEnabled]);

    useEffect(() => {
        jupiterRotationSpeed.current = rotationSpeed * 0.001;
    }, [rotationSpeed]);

    useEffect(() => {
        if (renderer.current) {
            renderer.current.toneMappingExposure = exposure;
        }
    }, [exposure]);

    useEffect(() => {
        if (!camera.current || !controls.current) return;

        switch (viewMode) {
            case 'jupiter':
                camera.current.position.set(0, 0, 7);
                controls.current.reset();
                break;
            case 'northPole':
                camera.current.position.set(0, 5, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'southPole':
                camera.current.position.set(0, -5, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'equator':
                camera.current.position.set(7, 0, 0);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'closeup':
                camera.current.position.set(0, 0, 3.5);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'greatRedSpot':
                camera.current.position.set(3.5, 0.7, 3.5);
                camera.current.lookAt(0.7, 0, 0.7);
                setShowGreatRedSpot(true);
                break;
            case 'darkSide':
                camera.current.position.set(-7, 0, 0);
                camera.current.lookAt(0, 0, 0);
                setLightIntensity(0.4);
                break;
            case 'ringsView':
                camera.current.position.set(0, 4, 5);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'moonView':
                camera.current.position.set(5, 1, 5);
                camera.current.lookAt(5, 0, 0);
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
                            Jupiter Explorer
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
                            "The largest planet in our solar system, a gas giant with a Great Red Spot that has raged for centuries."
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
                                { label: 'Sun Intensity', value: lightIntensity, min: 0.1, max: 3, step: 0.1, onChange: setLightIntensity, color: 'amber' },
                                { label: 'Exposure', value: exposure, min: 0.1, max: 1.5, step: 0.1, onChange: setExposure, color: 'blue' },
                                { label: 'Cloud Opacity', value: cloudOpacity, min: 0, max: 1, step: 0.1, onChange: setCloudOpacity, color: 'yellow' },
                                { label: 'Storm Intensity', value: stormIntensity, min: 0, max: 1, step: 0.1, onChange: setStormIntensity, color: 'red' },
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
                                    onClick={() => setShowAtmosphere(!showAtmosphere)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                        showAtmosphere
                                            ? 'bg-yellow-700/90 text-white shadow-md shadow-yellow-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {showAtmosphere ? 'Atmo ON' : 'Atmo OFF'}
                                </button>

                                <button
                                    onClick={() => setShowGreatRedSpot(!showGreatRedSpot)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                        showGreatRedSpot
                                            ? 'bg-red-700/90 text-white shadow-md shadow-red-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {showGreatRedSpot ? 'Red Spot ON' : 'Red Spot OFF'}
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
                                    setViewMode('jupiter');
                                    setLightIntensity(1.2);
                                    controls.current?.reset();
                                }}
                                className="w-full py-2 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center"
                            >
                                Reset View
                            </button>

                            {/* View mode buttons - responsive grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {[
                                    { mode: 'jupiter', label: 'Global' },
                                    { mode: 'closeup', label: 'Close-up' },
                                    { mode: 'greatRedSpot', label: 'Red Spot' },
                                    { mode: 'northPole', label: 'North' },
                                    { mode: 'southPole', label: 'South' },
                                    { mode: 'ringsView', label: 'Rings' },
                                    { mode: 'moonView', label: 'Moon' },
                                    { mode: 'darkSide', label: 'Dark Side' },
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
                        setViewMode('jupiter');
                        setLightIntensity(1.2);
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

export default JupiterVisualization;
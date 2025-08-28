import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

// Updated textures with reliable sources
const earthColorMap = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const earthNormalMap = 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg';
const earthSpecularMap = 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg';
const earthCloudMap = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png';
const moonTexture = 'https://threejs.org/examples/textures/planets/moon_1024.jpg';
const cityLightsTexture = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png';

const EarthVisualization = () => {
    // Refs
    const canvasRef = useRef(null);
    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const animationFrameId = useRef(null);

    // Earth objects
    const earthGroup = useRef(new THREE.Group());
    const earthMesh = useRef(null);
    const atmosphereMesh = useRef(null);
    const cloudLayer = useRef(null);
    const cityLights = useRef(null);
    const moon = useRef(null);

    // State
    const [settings, setSettings] = useState({
        rotationSpeed: 0.5,
        viewMode: 'earth',
        lightIntensity: 1.2,
        exposure: 1.0,
        bloomEnabled: true,
        showAtmosphere: true,
        autoRotate: true,
        showClouds: true,
        cloudOpacity: 0.8,
        showCities: true,
        showInfoPanel: true,
        stats: {
            diameter: '12,742 km',
            gravity: '9.807 m/s²',
            temperature: '15°C (avg)',
            dayLength: '24 hours',
            orbitalPeriod: '365.25 days',
            moon: '1 (Luna)',
            atmosphere: '78% N₂, 21% O₂',
            pressure: '101.325 kPa (sea level)',
            highestPoint: 'Mount Everest (8,848 m)',
            deepestPoint: 'Mariana Trench (-10,984 m)',
            mass: '5.97 × 10²⁴ kg',
            magneticField: 'Protects from solar wind'
        }
    });

    // Texture loader
    const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

    // Starfield generation
    const generateStarfield = useMemo(() => {
        const starCount = 20000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const radius = 5000 * (0.5 + Math.random() * 0.5);
            const theta = Math.random() * Math.PI * 2;
            let phi = Math.acos(2 * Math.random() - 1);

            // Cluster more stars near the galactic plane
            if (Math.random() > 0.3) {
                phi = Math.PI/2 + (Math.random() - 0.5) * Math.PI/4;
            }

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Color stars based on temperature
            const starType = Math.random();
            let r, g, b;

            if (starType < 0.6) { // Yellow-white (like our Sun)
                r = 0.8 + Math.random() * 0.2;
                g = 0.7 + Math.random() * 0.3;
                b = 0.6 + Math.random() * 0.4;
            } else if (starType < 0.85) { // Blue-white
                r = 0.4 + Math.random() * 0.2;
                g = 0.6 + Math.random() * 0.3;
                b = 0.8 + Math.random() * 0.2;
            } else if (starType < 0.95) { // Red
                r = 0.8 + Math.random() * 0.2;
                g = 0.4 + Math.random() * 0.2;
                b = 0.4 + Math.random() * 0.2;
            } else { // Blue
                r = 0.7 + Math.random() * 0.2;
                g = 0.4 + Math.random() * 0.2;
                b = 0.8 + Math.random() * 0.2;
            }

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;

            // Random sizes with occasional brighter stars
            sizes[i] = (0.1 + Math.random() * 0.7) * (Math.random() > 0.98 ? 3 : 1);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geometry;
    }, []);

    // Create Earth and Moon
    const createEarth = useCallback(() => {
        // Load textures using Promise.all
        const loadTexture = (url) => {
            return new Promise((resolve, reject) => {
                textureLoader.load(
                    url,
                    resolve,
                    undefined,
                    (error) => {
                        console.error(`Failed to load texture: ${url}`, error);
                        reject(error);
                    }
                );
            });
        };

        Promise.all([
            loadTexture(earthColorMap),
            loadTexture(earthNormalMap),
            loadTexture(earthSpecularMap),
            loadTexture(earthCloudMap),
            loadTexture(cityLightsTexture),
            loadTexture(moonTexture)
        ]).then(([colorMap, normalMap, specularMap, cloudMap, nightMap, moonMap]) => {
            // Configure texture settings
            [colorMap, normalMap, specularMap, cloudMap, nightMap, moonMap].forEach(texture => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
            });

            // Earth geometry
            const earthGeometry = new THREE.SphereGeometry(1.5, 128, 128);

            // Earth material
            const earthMaterial = new THREE.MeshPhongMaterial({
                specular: 0x333333,
                shininess: 10,
                map: colorMap,
                normalMap: normalMap,
                normalScale: new THREE.Vector2(0.85, 0.85),
                specularMap: specularMap
            });

            // Create Earth mesh
            earthMesh.current = new THREE.Mesh(earthGeometry, earthMaterial);
            earthMesh.current.receiveShadow = true;
            earthMesh.current.castShadow = true;
            earthMesh.current.name = "Earth";
            earthGroup.current.add(earthMesh.current);

            // City lights (night side) - Fixed with proper material settings
            const cityMaterial = new THREE.MeshBasicMaterial({
                map: nightMap,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.9,
                side: THREE.FrontSide
            });

            cityLights.current = new THREE.Mesh(earthGeometry.clone(), cityMaterial);
            cityLights.current.scale.set(1.01, 1.01, 1.01);
            cityLights.current.visible = settings.showCities;
            cityLights.current.name = "CityLights";
            earthGroup.current.add(cityLights.current);

            // Cloud layer
            const cloudGeometry = new THREE.SphereGeometry(1.52, 128, 128);
            const cloudMaterial = new THREE.MeshPhongMaterial({
                map: cloudMap,
                transparent: true,
                opacity: settings.cloudOpacity,
                alphaTest: 0.01,
                side: THREE.DoubleSide,
                specular: new THREE.Color(0x111111),
                shininess: 2
            });

            cloudLayer.current = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudLayer.current.rotation.y = Math.PI / 2;
            cloudLayer.current.name = "CloudLayer";
            cloudLayer.current.visible = settings.showClouds;
            earthGroup.current.add(cloudLayer.current);

            // Atmosphere
            const atmosphereGeometry = new THREE.SphereGeometry(1.6, 128, 128);
            const atmosphereMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x5599ff,
                transparent: true,
                opacity: 0.2,
                roughness: 0.8,
                metalness: 0,
                ior: 1.02,
                thickness: 0.5,
                transmission: 0.8,
                side: THREE.DoubleSide,
                specularColor: new THREE.Color(0x5599ff),
                specularIntensity: 0.4,
                clearcoat: 0.2
            });

            atmosphereMesh.current = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            atmosphereMesh.current.visible = settings.showAtmosphere;
            atmosphereMesh.current.name = "Atmosphere";
            earthGroup.current.add(atmosphereMesh.current);

            // Create Moon (only once)
            if (!moon.current) {
                const moonGeometry = new THREE.SphereGeometry(0.4, 128, 128);
                const moonMaterial = new THREE.MeshStandardMaterial({
                    roughness: 0.8,
                    metalness: 0.02,
                    map: moonMap
                });

                moon.current = new THREE.Mesh(moonGeometry, moonMaterial);
                moon.current.position.set(4, 0, 0);
                moon.current.castShadow = true;
                moon.current.receiveShadow = true;
                moon.current.name = "Moon";
                scene.current.add(moon.current);
            }

            // Add Earth to scene
            scene.current.add(earthGroup.current);
        }).catch(error => {
            console.error("Error loading textures:", error);
            // Fallback in case city lights texture fails
            const earthGeometry = new THREE.SphereGeometry(1.5, 128, 128);
            const cityMaterial = new THREE.MeshBasicMaterial({
                color: 0xaaaaaa,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.5,
                side: THREE.FrontSide
            });
            cityLights.current = new THREE.Mesh(earthGeometry.clone(), cityMaterial);
            cityLights.current.scale.set(1.01, 1.01, 1.01);
            cityLights.current.visible = settings.showCities;
            earthGroup.current.add(cityLights.current);
        });
    }, [textureLoader, settings]);

    // Initialize Three.js scene
    const initScene = useCallback(() => {
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
        camera.current.position.set(0, 0, 5);

        // Renderer with better defaults
        renderer.current = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true
        });
        renderer.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.current.setSize(window.innerWidth, window.innerHeight);
        renderer.current.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.current.toneMappingExposure = settings.exposure;
        renderer.current.shadowMap.enabled = true;
        renderer.current.shadowMap.type = THREE.PCFSoftShadowMap;

        // OrbitControls with better defaults
        controls.current = new OrbitControls(camera.current, renderer.current.domElement);
        controls.current.enableDamping = true;
        controls.current.dampingFactor = 0.08;
        controls.current.minDistance = 2;
        controls.current.maxDistance = 15;
        controls.current.maxPolarAngle = Math.PI;
        controls.current.minPolarAngle = 0;
        controls.current.autoRotate = settings.autoRotate;
        controls.current.autoRotateSpeed = 0.2;
        controls.current.enablePan = true;
        controls.current.screenSpacePanning = false;

        // Post-processing setup
        composer.current = new EffectComposer(renderer.current);
        composer.current.addPass(new RenderPass(scene.current, camera.current));

        bloomPass.current = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,
            0.8,
            0.9
        );
        bloomPass.current.enabled = settings.bloomEnabled;
        composer.current.addPass(bloomPass.current);

        composer.current.addPass(new OutputPass());

        // Lighting
        const directionalLight = new THREE.DirectionalLight(0xffeedd, settings.lightIntensity);
        directionalLight.position.set(10, 5, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.bias = -0.0001;
        scene.current.add(directionalLight);

        // Ambient light
        const hemiLight = new THREE.HemisphereLight(0x443388, 0x000011, 0.2);
        scene.current.add(hemiLight);

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

        // Create Earth and Moon
        createEarth();
    }, [generateStarfield, createEarth, settings]);

    // Animation loop
    const animate = useCallback(() => {
        animationFrameId.current = requestAnimationFrame(animate);

        // Rotate Earth
        if (earthGroup.current) {
            earthGroup.current.rotation.y += settings.rotationSpeed * 0.001;
        }

        // Rotate cloud layer
        if (cloudLayer.current) {
            cloudLayer.current.rotation.y += settings.rotationSpeed * 0.001 * 1.2;
        }

        // Orbit Moon around Earth
        if (moon.current) {
            moon.current.position.x = 4 * Math.cos(Date.now() * 0.0002);
            moon.current.position.z = 4 * Math.sin(Date.now() * 0.0002);
            moon.current.rotation.y += 0.002;
        }

        // Update controls
        if (controls.current) {
            controls.current.update();
        }

        // Update atmosphere effect
        if (atmosphereMesh.current && settings.showAtmosphere) {
            const pulse = Math.sin(Date.now() * 0.001) * 0.01;
            atmosphereMesh.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
        }

        // Update bloom effect
        if (bloomPass.current && settings.bloomEnabled) {
            bloomPass.current.strength = 1.0 + Math.sin(Date.now() * 0.001) * 0.1;
        }

        // Render with post-processing
        if (composer.current) {
            composer.current.render();
        } else if (renderer.current) {
            renderer.current.render(scene.current, camera.current);
        }
    }, [settings]);

    // Handle window resize
    const handleResize = useCallback(() => {
        if (!camera.current || !renderer.current || !composer.current) return;

        camera.current.aspect = window.innerWidth / window.innerHeight;
        camera.current.updateProjectionMatrix();
        renderer.current.setSize(window.innerWidth, window.innerHeight);
        composer.current.setSize(window.innerWidth, window.innerHeight);

        if (bloomPass.current) {
            bloomPass.current.setSize(window.innerWidth, window.innerHeight);
        }
    }, []);

    // Set view mode
    const setViewMode = useCallback((mode) => {
        if (!camera.current || !controls.current) return;

        const newSettings = { ...settings, viewMode: mode };

        switch (mode) {
            case 'earth':
                camera.current.position.set(0, 0, 5);
                controls.current.reset();
                break;
            case 'northPole':
                camera.current.position.set(0, 4, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'southPole':
                camera.current.position.set(0, -4, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'equator':
                camera.current.position.set(5, 0, 0);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'closeup':
                camera.current.position.set(0, 0, 2.5);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'nightSide':
                camera.current.position.set(-5, 0, 0);
                camera.current.lookAt(0, 0, 0);
                newSettings.lightIntensity = 0.4;
                break;
            case 'moonView':
                camera.current.position.set(4, 0.5, 4);
                camera.current.lookAt(4, 0, 0);
                break;
            case 'fromMoon':
                camera.current.position.set(4, 0, 4);
                camera.current.lookAt(0, 0, 0);
                break;
            default:
                break;
        }

        setSettings(newSettings);
    }, [settings]);

    // Reset view
    const resetView = useCallback(() => {
        setViewMode('earth');
        setSettings(prev => ({
            ...prev,
            lightIntensity: 1.2
        }));
        if (controls.current) {
            controls.current.reset();
        }
    }, [setViewMode]);

    // Update settings
    const updateSetting = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        // Immediate effects that don't wait for render loop
        if (key === 'exposure' && renderer.current) {
            renderer.current.toneMappingExposure = value;
        }
        if (key === 'autoRotate' && controls.current) {
            controls.current.autoRotate = value;
        }
        if (key === 'bloomEnabled' && bloomPass.current) {
            bloomPass.current.enabled = value;
        }
        if (key === 'showAtmosphere' && atmosphereMesh.current) {
            atmosphereMesh.current.visible = value;
        }
        if (key === 'showClouds' && cloudLayer.current) {
            cloudLayer.current.visible = value;
        }
        if (key === 'showCities' && cityLights.current) {
            cityLights.current.visible = value;
        }
        if (key === 'cloudOpacity' && cloudLayer.current?.material) {
            cloudLayer.current.material.opacity = value;
        }
    }, []);

    // Initialize and cleanup
    useEffect(() => {
        initScene();
        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }

            // Cleanup Three.js objects
            if (scene.current) {
                scene.current.traverse(object => {
                    if (object.isMesh) {
                        object.geometry?.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(m => {
                                    m.map?.dispose();
                                    m.normalMap?.dispose();
                                    m.specularMap?.dispose();
                                    m.dispose();
                                });
                            } else {
                                object.material.map?.dispose();
                                object.material.normalMap?.dispose();
                                object.material.specularMap?.dispose();
                                object.material.dispose();
                            }
                        }
                    }
                });
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
    }, [initScene, handleResize, animate]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Custom styles */}
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
                    background: rgba(0, 150, 255, 0.4);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 150, 255, 0.6);
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

            {/* Info Panel Toggle */}
            <button
                onClick={() => updateSetting('showInfoPanel', !settings.showInfoPanel)}
                className="absolute top-4 right-4 z-20 bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                aria-label="Toggle info panel"
            >
                {settings.showInfoPanel ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>

            {/* Enhanced Info Panel */}
            {settings.showInfoPanel && (
                <div className="absolute top-4 left-4 right-4 bottom-4 md:top-6 md:left-6 md:right-auto md:bottom-auto info-panel z-10 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-gray-800">
                        <h1 className="text-xl md:text-2xl font-bold text-blue-400">
                            Earth Explorer
                        </h1>
                        <button
                            onClick={() => updateSetting('showInfoPanel', false)}
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                            aria-label="Close panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <p className="text-gray-400 mb-4 text-sm italic">
                            "The pale blue dot, our home planet and the only known place in the universe confirmed to host life."
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 stats-grid">
                            {Object.entries(settings.stats).map(([key, value]) => (
                                <div key={key} className="bg-gray-800/90 p-3 rounded-lg border-l-2 border-blue-500/50 hover:border-blue-400 transition-colors">
                                    <div className="text-blue-400 text-xs font-medium uppercase tracking-wider">
                                        {key.replace(/([A-Z])/g, ' $1')}
                                    </div>
                                    <div className="text-gray-200 text-sm font-bold">{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Controls Section */}
                        <div className="space-y-4 pb-4">
                            {/* Sliders */}
                            {[
                                { label: 'Rotation Speed', value: settings.rotationSpeed, min: 0, max: 2, step: 0.1, onChange: (v) => updateSetting('rotationSpeed', v) },
                                { label: 'Sun Intensity', value: settings.lightIntensity, min: 0.1, max: 3, step: 0.1, onChange: (v) => updateSetting('lightIntensity', v) },
                                { label: 'Exposure', value: settings.exposure, min: 0.1, max: 1.5, step: 0.1, onChange: (v) => updateSetting('exposure', v) },
                                { label: 'Cloud Opacity', value: settings.cloudOpacity, min: 0, max: 1, step: 0.1, onChange: (v) => updateSetting('cloudOpacity', v) },
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
                                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            ))}

                            {/* Toggle Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'bloomEnabled', label: 'Bloom', onLabel: 'ON', offLabel: 'OFF' },
                                    { key: 'showAtmosphere', label: 'Atmosphere', onLabel: 'ON', offLabel: 'OFF' },
                                    { key: 'showClouds', label: 'Clouds', onLabel: 'ON', offLabel: 'OFF' },
                                    { key: 'autoRotate', label: 'Auto-Rotate', onLabel: 'ON', offLabel: 'OFF' },
                                ].map(({ key, label, onLabel, offLabel }) => {
                                    const isActive = settings[key];
                                    const colorClass = isActive ?
                                        (key === 'autoRotate' ? 'bg-green-700/90 shadow-green-500/20' : 'bg-blue-700/90 shadow-blue-500/20') :
                                        'bg-gray-800 hover:bg-gray-700';

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => updateSetting(key, !settings[key])}
                                            className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${colorClass} ${
                                                isActive ? 'text-white shadow-md' : 'text-gray-300'
                                            }`}
                                        >
                                            {settings[key] ? `${label} ${onLabel}` : `${label} ${offLabel}`}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={resetView}
                                className="w-full py-2 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center"
                            >
                                Reset View
                            </button>

                            {/* View Mode Buttons */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {[
                                    { mode: 'earth', label: 'Global' },
                                    { mode: 'closeup', label: 'Close-up' },
                                    { mode: 'northPole', label: 'North' },
                                    { mode: 'southPole', label: 'South' },
                                    { mode: 'nightSide', label: 'Night' },
                                    { mode: 'moonView', label: 'Moon' },
                                    { mode: 'fromMoon', label: 'Earth View' },
                                ].map(({ mode, label }) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`py-2 rounded-lg text-xs transition-all ${
                                            settings.viewMode === mode
                                                ? 'bg-blue-700/90 text-white shadow-md shadow-blue-500/20'
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

            {/* Mobile Controls */}
            <div className="md:hidden fixed bottom-4 right-4 z-20 flex flex-col space-y-2">
                <button
                    onClick={() => updateSetting('showInfoPanel', !settings.showInfoPanel)}
                    className="bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                    aria-label="Toggle info panel"
                >
                    {settings.showInfoPanel ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={resetView}
                    className="bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                    aria-label="Reset view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default EarthVisualization;
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import sunTexture from '../assets/images/sun/2k_sun.jpg';
import mercuryTexture from '../assets/images/mercury/2k_mercury.jpg';

const Galaxy = () => {
    // State management
    const [currentBody, setCurrentBody] = useState('sun');
    const [brightness, setBrightness] = useState(1.0);
    const [exposure, setExposure] = useState(1.2);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [viewMode, setViewMode] = useState('default');
    const [rotationSpeed, setRotationSpeed] = useState(0.5);
    const [lightIntensity, setLightIntensity] = useState(1.0);
    const [showCraters, setShowCraters] = useState(true);

    // Celestial body statistics
    const bodyStats = {
        sun: {
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
        },
        mercury: {
            diameter: '4,880 km',
            gravity: '3.7 m/s²',
            temperature: '−173°C to 427°C',
            dayLength: '59 Earth days',
            orbitalPeriod: '88 Earth days',
            moons: '0',
            atmosphere: 'Exosphere (very thin)',
            pressure: 'Near vacuum',
            discovery: 'Known since antiquity',
            mass: '0.055 Earth masses',
            magneticField: 'Weak',
            axialTilt: '0.034°',
            composition: '70% metallic, 30% silicate',
            highestPoint: '4.48 km (Caloris Montes)',
            uniqueFeature: 'Largest iron core relative to size',
            craters: 'Heavily cratered surface',
            geologicalActivity: 'Shrinking planet',
            surfaceAge: '4-4.5 billion years',
            rotation: '3:2 spin-orbit resonance',
            visibility: 'Visible to naked eye',
            orbit: 'Most eccentric of all planets',
            surfaceFeatures: 'Smooth plains, scarps, craters'
        }
    };

    // Three.js references
    const canvasRef = useRef(null);
    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const celestialBody = useRef(new THREE.Group());
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const outputPass = useRef(null);
    const bodyRotationSpeed = useRef(0.0002);
    const directionalLight = useRef(null);
    const pointLight = useRef(null);
    const hemiLight = useRef(null);
    const animationFrameId = useRef(null);
    const textureLoader = useRef(new THREE.TextureLoader());
    const lensflare = useRef(null);
    const corona = useRef(null);
    const stars = useRef(null);

    // Calculate derived brightness values
    const surfaceIntensity = useMemo(() => brightness * 2.5, [brightness]);
    const bloomStrength = useMemo(() => brightness * 2.5, [brightness]);
    const coronaIntensity = useMemo(() => brightness * 0.5, [brightness]);

    // Texture paths
    const texturePaths = useMemo(() => ({
        sun: { colorMap: sunTexture },
        mercury: { colorMap: mercuryTexture }
    }), []);

    // Starfield generation
    const generateStarfield = useMemo(() => {
        const starCount = currentBody === 'sun' ? 10000 : 30000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const radius = 5000 * (0.5 + Math.random() * 0.5);
            const theta = Math.random() * Math.PI * 2;
            let phi = Math.acos(2 * Math.random() - 1);

            if (currentBody === 'mercury' && Math.random() > 0.3) {
                phi = Math.PI/2 + (Math.random() - 0.5) * Math.PI/4;
            }

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const starType = Math.random();
            let r, g, b;

            if (currentBody === 'sun') {
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
            } else { // mercury
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
            }

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;

            sizes[i] = (0.1 + Math.random() * (currentBody === 'sun' ? 0.5 : 0.7)) * (Math.random() > 0.98 ? (currentBody === 'sun' ? 2 : 3) : 1);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        return geometry;
    }, [currentBody]);

    // Initialize Three.js scene
    const initScene = () => {
        if (!canvasRef.current) return;

        // Scene setup
        scene.current.background = new THREE.Color(currentBody === 'sun' ? 0x000000 : 0x000008);
        scene.current.fog = new THREE.FogExp2(currentBody === 'sun' ? 0x000000 : 0x00000a, currentBody === 'sun' ? 0.00005 : 0.00008);

        // Camera
        camera.current = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        camera.current.position.set(0, 0, currentBody === 'sun' ? 10 : 8);

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
        renderer.current.shadowMap.enabled = currentBody === 'mercury';
        if (currentBody === 'mercury') {
            renderer.current.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // OrbitControls
        controls.current = new OrbitControls(camera.current, renderer.current.domElement);
        controls.current.enableDamping = true;
        controls.current.dampingFactor = 0.08;
        controls.current.minDistance = currentBody === 'sun' ? 5 : 3;
        controls.current.maxDistance = currentBody === 'sun' ? 50 : 20;
        controls.current.maxPolarAngle = Math.PI;
        controls.current.minPolarAngle = 0;
        controls.current.autoRotate = autoRotate;
        controls.current.autoRotateSpeed = currentBody === 'sun' ? 0.1 : 0.5;
        controls.current.enablePan = true;
        controls.current.screenSpacePanning = false;

        // Post-processing
        composer.current = new EffectComposer(renderer.current);
        composer.current.addPass(new RenderPass(scene.current, camera.current));

        bloomPass.current = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            currentBody === 'sun' ? bloomStrength : 1.5,
            0.8,
            currentBody === 'sun' ? 0.6 : 0.9
        );
        bloomPass.current.enabled = bloomEnabled;
        composer.current.addPass(bloomPass.current);

        outputPass.current = new OutputPass();
        composer.current.addPass(outputPass.current);

        // Lighting
        if (currentBody === 'sun') {
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
        } else {
            directionalLight.current = new THREE.DirectionalLight(0xffffff, lightIntensity);
            directionalLight.current.position.set(10, 5, 10);
            directionalLight.current.castShadow = true;
            directionalLight.current.shadow.mapSize.width = 2048;
            directionalLight.current.shadow.mapSize.height = 2048;
            directionalLight.current.shadow.camera.near = 0.5;
            directionalLight.current.shadow.camera.far = 500;
            directionalLight.current.shadow.bias = -0.0001;
            scene.current.add(directionalLight.current);

            const textureFlare0 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare0.png");
            const textureFlare3 = new THREE.TextureLoader().load("https://assets.codepen.io/127738/lensflare3.png");

            lensflare.current = new Lensflare();
            lensflare.current.addElement(new LensflareElement(textureFlare0, 800, 0, directionalLight.current.color));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 80, 0.6));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 90, 0.7));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 150, 0.9));
            lensflare.current.addElement(new LensflareElement(textureFlare3, 80, 1));
            directionalLight.current.add(lensflare.current);

            hemiLight.current = new THREE.HemisphereLight(0xffffff, 0x000044, 0.2);
            scene.current.add(hemiLight.current);
        }

        // Create celestial body
        createCelestialBody();

        // Add starfield
        const starMaterial = new THREE.PointsMaterial({
            size: currentBody === 'sun' ? 0.8 : 1.0,
            vertexColors: true,
            transparent: true,
            opacity: currentBody === 'sun' ? 0.8 : 0.95,
            sizeAttenuation: true,
            fog: false
        });

        stars.current = new THREE.Points(generateStarfield, starMaterial);
        scene.current.add(stars.current);

        // Handle window resize
        window.addEventListener('resize', onWindowResize);

        // Start animation
        animate();
    };

    const createCelestialBody = () => {
        scene.current.add(celestialBody.current);

        if (currentBody === 'sun') {
            // Sun geometry
            const sunGeometry = new THREE.SphereGeometry(3, 128, 128);

            // Sun material
            const sunMaterial = new THREE.MeshBasicMaterial({
                color: 0xffdd99,
                emissive: 0xffaa44,
                emissiveIntensity: surfaceIntensity * 2.0,
                transparent: false,
                opacity: 1.0,
            });

            // Load texture
            textureLoader.current.load(texturePaths.sun.colorMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                sunMaterial.map = texture;
                sunMaterial.needsUpdate = true;
            });

            // Sun mesh
            const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
            sunMesh.name = "Sun";
            celestialBody.current.add(sunMesh);

            // Add corona effect
            const coronaGeometry = new THREE.SphereGeometry(3.2, 64, 64);
            const coronaMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: coronaIntensity,
                side: THREE.BackSide
            });
            corona.current = new THREE.Mesh(coronaGeometry, coronaMaterial);
            celestialBody.current.add(corona.current);
        } else {
            // Mercury geometry
            const mercuryGeometry = new THREE.SphereGeometry(1.5, 256, 256);
            const mercuryMaterial = new THREE.MeshPhysicalMaterial({
                roughness: 0.9,
                metalness: 0.3,
                clearcoat: 0.1,
                clearcoatRoughness: 0.5,
                color: 0xaaaaaa,
                specularColor: new THREE.Color(0x999999),
                specularIntensity: 0.2,
                sheen: 0.05,
                sheenColor: new THREE.Color(0x999999),
                emissive: 0x333333,
                emissiveIntensity: 0.05,
                ior: 1.5,
                flatShading: false
            });

            textureLoader.current.load(texturePaths.mercury.colorMap, (texture) => {
                texture.anisotropy = renderer.current.capabilities.getMaxAnisotropy();
                texture.encoding = THREE.sRGBEncoding;
                mercuryMaterial.map = texture;
                mercuryMaterial.needsUpdate = true;
            });

            const mercuryMesh = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
            mercuryMesh.receiveShadow = true;
            mercuryMesh.castShadow = true;
            mercuryMesh.name = "Mercury";
            mercuryMesh.rotation.z = THREE.MathUtils.degToRad(0.034);
            celestialBody.current.add(mercuryMesh);
        }
    };

    const animate = () => {
        animationFrameId.current = requestAnimationFrame(animate);

        // Rotate celestial body
        celestialBody.current.rotation.y += bodyRotationSpeed.current;

        // Update controls
        controls.current.update();

        // Update exposure
        renderer.current.toneMappingExposure = exposure;

        // Update auto-rotation
        controls.current.autoRotate = autoRotate;

        if (currentBody === 'sun') {
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
            celestialBody.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
        } else {
            bloomPass.current.enabled = bloomEnabled;
            if (bloomEnabled) {
                bloomPass.current.strength = 0.5 + Math.sin(Date.now() * 0.001) * 0.1;
            }

            if (directionalLight.current) {
                directionalLight.current.intensity = lightIntensity;
            }
        }

        // Render with post-processing
        composer.current.render();
    };

    const onWindowResize = () => {
        camera.current.aspect = window.innerWidth / window.innerHeight;
        camera.current.updateProjectionMatrix();
        renderer.current.setSize(window.innerWidth, window.innerHeight);
        composer.current.setSize(window.innerWidth, window.innerHeight);
        bloomPass.current.setSize(window.innerWidth, window.innerHeight);
    };

    const resetView = () => {
        setViewMode('default');
        if (currentBody === 'sun') {
            setBrightness(1.0);
            setExposure(1.2);
        } else {
            setLightIntensity(1.0);
        }
        controls.current?.reset();
    };

    const handleBodyChange = (body) => {
        setCurrentBody(body);
        setViewMode('default');
        if (body === 'sun') {
            setBrightness(1.0);
            setExposure(1.2);
        } else {
            setLightIntensity(1.0);
        }
    };

    const updateViewMode = () => {
        if (!camera.current || !controls.current) return;

        if (viewMode === 'default') {
            camera.current.position.set(0, 0, currentBody === 'sun' ? 10 : 8);
            controls.current.reset();
            return;
        }

        if (currentBody === 'sun') {
            switch (viewMode) {
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
        } else {
            switch (viewMode) {
                case 'northPole':
                    camera.current.position.set(0, 5, 0.1);
                    camera.current.lookAt(0, 0, 0);
                    break;
                case 'southPole':
                    camera.current.position.set(0, -5, 0.1);
                    camera.current.lookAt(0, 0, 0);
                    break;
                case 'equator':
                    camera.current.position.set(8, 0, 0);
                    camera.current.lookAt(0, 0, 0);
                    break;
                case 'closeup':
                    camera.current.position.set(0, 0, 4);
                    camera.current.lookAt(0, 0, 0);
                    break;
                case 'darkSide':
                    camera.current.position.set(-8, 0, 0);
                    camera.current.lookAt(0, 0, 0);
                    setLightIntensity(0.4);
                    break;
                case 'calorisMontes':
                    camera.current.position.set(0, 0.3, 4.5);
                    camera.current.lookAt(0, 0.3, 0);
                    break;
                default:
                    break;
            }
        }
    };

    // Initialize and clean up
    useEffect(() => {
        initScene();

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
    }, [currentBody]);

    useEffect(() => {
        bodyRotationSpeed.current = rotationSpeed * (currentBody === 'sun' ? 0.0002 : 0.001);
    }, [rotationSpeed, currentBody]);

    useEffect(() => {
        if (renderer.current) {
            renderer.current.toneMappingExposure = exposure;
        }
    }, [exposure]);

    useEffect(() => {
        updateViewMode();
    }, [viewMode, currentBody]);

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
                    background: ${currentBody === 'sun' ? 'rgba(255, 196, 0, 0.4)' : 'rgba(200, 200, 200, 0.4)'};
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${currentBody === 'sun' ? 'rgba(255, 196, 0, 0.6)' : 'rgba(200, 200, 200, 0.6)'};
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

            {/* Navigation buttons */}
            <div className="absolute top-4 left-4 z-20 flex space-x-2">
                <button
                    onClick={() => handleBodyChange('sun')}
                    className={`px-4 py-2 rounded-lg ${currentBody === 'sun' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                    Sun
                </button>
                <button
                    onClick={() => handleBodyChange('mercury')}
                    className={`px-4 py-2 rounded-lg ${currentBody === 'mercury' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                    Mercury
                </button>
            </div>

            {/* Toggle button for info panel */}
            <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="absolute top-4 right-4 z-20 bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                aria-label="Toggle info panel"
            >
                {showInfoPanel ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={currentBody === 'sun' ? '#f59e0b' : '#d1d5db'}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={currentBody === 'sun' ? '#f59e0b' : '#d1d5db'}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>

            {/* Enhanced info panel with scrollable content */}
            {showInfoPanel && (
                <div className="absolute top-4 left-4 right-4 bottom-4 md:top-6 md:left-6 md:right-auto md:bottom-auto info-panel z-10 bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                    {/* Panel header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-800">
                        <h1 className="text-xl md:text-2xl font-bold" style={{ color: currentBody === 'sun' ? '#f59e0b' : '#d1d5db' }}>
                            {currentBody === 'sun' ? 'Solar Explorer' : 'Mercury Explorer'}
                        </h1>
                        <button
                            onClick={() => setShowInfoPanel(false)}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
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
                            {currentBody === 'sun'
                                ? '"The star at the center of our solar system, a nearly perfect sphere of hot plasma that provides energy for life on Earth."'
                                : '"The smallest planet in our solar system and closest to the Sun, with extreme temperature variations."'}
                        </p>

                        {/* Stats grid - responsive columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 stats-grid">
                            {Object.entries(bodyStats[currentBody]).map(([key, value]) => (
                                <div key={key} className="bg-gray-800/90 p-3 rounded-lg border-l-2 hover:border-amber-400 transition-colors"
                                     style={{ borderColor: currentBody === 'sun' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(156, 163, 175, 0.5)' }}>
                                    <div className="text-xs font-medium uppercase tracking-wider" style={{ color: currentBody === 'sun' ? '#f59e0b' : '#d1d5db' }}>
                                        {key.replace(/([A-Z])/g, ' $1')}
                                    </div>
                                    <div className="text-gray-200 text-sm font-bold">{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Controls section */}
                        <div className="space-y-4 pb-4">
                            {/* Sliders */}
                            {currentBody === 'sun' ? (
                                <>
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
                                </>
                            ) : (
                                <>
                                    {[
                                        { label: 'Rotation Speed', value: rotationSpeed, min: 0, max: 3, step: 0.1, onChange: setRotationSpeed, color: 'gray' },
                                        { label: 'Sun Intensity', value: lightIntensity, min: 0.1, max: 3, step: 0.1, onChange: setLightIntensity, color: 'gray' },
                                        { label: 'Exposure', value: exposure, min: 0.1, max: 1.5, step: 0.1, onChange: setExposure, color: 'gray' },
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
                                </>
                            )}

                            {/* Toggle buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setBloomEnabled(!bloomEnabled)}
                                    className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                        bloomEnabled
                                            ? currentBody === 'sun'
                                                ? 'bg-amber-700/90 text-white shadow-md shadow-amber-500/20'
                                                : 'bg-gray-700/90 text-white shadow-md shadow-gray-500/20'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {bloomEnabled ? 'Bloom ON' : 'Bloom OFF'}
                                </button>

                                {currentBody === 'mercury' && (
                                    <button
                                        onClick={() => setShowCraters(!showCraters)}
                                        className={`py-2 px-1 rounded-lg text-sm transition-all flex items-center justify-center ${
                                            showCraters
                                                ? 'bg-gray-700/90 text-white shadow-md shadow-gray-500/20'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {showCraters ? 'Craters ON' : 'Craters OFF'}
                                    </button>
                                )}

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
                                    onClick={resetView}
                                    className="py-2 px-1 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center"
                                >
                                    Reset View
                                </button>
                            </div>

                            {/* View mode buttons - responsive grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {currentBody === 'sun' ? (
                                    <>
                                        {[
                                            { mode: 'default', label: 'Standard' },
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
                                    </>
                                ) : (
                                    <>
                                        {[
                                            { mode: 'default', label: 'Global' },
                                            { mode: 'closeup', label: 'Close-up' },
                                            { mode: 'northPole', label: 'North' },
                                            { mode: 'southPole', label: 'South' },
                                            { mode: 'darkSide', label: 'Dark Side' },
                                            { mode: 'calorisMontes', label: 'Caloris Montes' },
                                        ].map(({ mode, label }) => (
                                            <button
                                                key={mode}
                                                onClick={() => setViewMode(mode)}
                                                className={`py-2 rounded-lg text-xs transition-all ${
                                                    viewMode === mode
                                                        ? 'bg-gray-700/90 text-white shadow-md shadow-gray-500/20'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </>
                                )}
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={currentBody === 'sun' ? '#f59e0b' : '#d1d5db'}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={currentBody === 'sun' ? '#f59e0b' : '#d1d5db'}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>

                <button
                    onClick={resetView}
                    className="bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md p-3 rounded-full border border-gray-700 shadow-lg transition-all"
                    aria-label="Reset view"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill={currentBody === 'sun' ? '#f59e0b' : '#d1d5db'}>
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Galaxy;
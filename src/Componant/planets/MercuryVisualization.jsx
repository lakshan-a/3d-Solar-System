import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';
import mercuryTexture from '../../assets/images/mercury/2k_mercury.jpg';

const MercuryVisualization = () => {
    const canvasRef = useRef(null);
    const [rotationSpeed, setRotationSpeed] = useState(1.5);
    const [viewMode, setViewMode] = useState('global');
    const [lightIntensity, setLightIntensity] = useState(1.0);
    const [exposure, setExposure] = useState(1.0);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [showInfoPanel, setShowInfoPanel] = useState(true);
    const [showFeatures, setShowFeatures] = useState(true);
    const [zoomState, setZoomState] = useState('out');
    const [isFollowing, setIsFollowing] = useState(false);

    const stats = {
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
    };

    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const mercury = useRef(new THREE.Group());
    const composer = useRef(null);
    const bloomPass = useRef(null);
    const outputPass = useRef(null);
    const mercuryRotationSpeed = useRef(0.001);
    const directionalLight = useRef(null);
    const pointLight = useRef(null);
    const hemiLight = useRef(null);
    const animationFrameId = useRef(null);
    const textureLoader = useRef(new THREE.TextureLoader());
    const followTarget = useRef(null);
    const followDistance = useRef(5);

    const texturePaths = useMemo(() => ({
        colorMap: mercuryTexture,
    }), []);

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

    const startFollowing = (target) => {
        if (zoomState === 'in' && followTarget.current === target) {
            stopFollowing();
            setZoomState('out');
            return;
        }

        followTarget.current = target;
        setIsFollowing(true);
        controls.current.enabled = false;
        setZoomState('in');
    };

    const stopFollowing = () => {
        followTarget.current = null;
        setIsFollowing(false);
        controls.current.enabled = true;
        setZoomState('out');
        camera.current.position.set(0, 0, 8);
        camera.current.lookAt(0, 0, 0);
        controls.current.target.set(0, 0, 0);
        controls.current.update();
    };

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
            camera.current.position.set(0, 0, 8);

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
            controls.current.minDistance = 3;
            controls.current.maxDistance = 20;
            controls.current.maxPolarAngle = Math.PI;
            controls.current.minPolarAngle = 0;
            controls.current.autoRotate = autoRotate;
            controls.current.autoRotateSpeed = 0.5;
            controls.current.enablePan = true;
            controls.current.screenSpacePanning = false;

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

            const lensflare = new Lensflare();
            lensflare.addElement(new LensflareElement(textureFlare0, 800, 0, directionalLight.current.color));
            lensflare.addElement(new LensflareElement(textureFlare3, 80, 0.6));
            lensflare.addElement(new LensflareElement(textureFlare3, 90, 0.7));
            lensflare.addElement(new LensflareElement(textureFlare3, 150, 0.9));
            lensflare.addElement(new LensflareElement(textureFlare3, 80, 1));
            directionalLight.current.add(lensflare);

            hemiLight.current = new THREE.HemisphereLight(0xffffff, 0x000044, 0.2);
            scene.current.add(hemiLight.current);

            createMercury();

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

            window.addEventListener('resize', onWindowResize);
            animate();
        };

        const createMercury = () => {
            scene.current.add(mercury.current);

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

            textureLoader.current.load(texturePaths.colorMap, (texture) => {
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
            mercury.current.add(mercuryMesh);
        };

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            mercury.current.rotation.y += mercuryRotationSpeed.current;
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

            if (isFollowing && followTarget.current) {
                const angle = Date.now() * 0.0005;
                const offsetX = Math.sin(angle) * followDistance.current;
                const offsetZ = Math.cos(angle) * followDistance.current;

                camera.current.position.x = offsetX;
                camera.current.position.z = offsetZ;
                camera.current.position.y = followDistance.current * 0.3;

                camera.current.lookAt(0, 0, 0);
                controls.current.target.set(0, 0, 0);
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
    }, [texturePaths, generateStarfield, autoRotate, bloomEnabled, showFeatures, isFollowing]);

    useEffect(() => {
        mercuryRotationSpeed.current = rotationSpeed * 0.001;
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
                stopFollowing();
                camera.current.position.set(0, 0, 8);
                controls.current.reset();
                break;
            case 'northPole':
                startFollowing('north');
                followDistance.current = 5;
                camera.current.position.set(0, 5, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'southPole':
                startFollowing('south');
                followDistance.current = 5;
                camera.current.position.set(0, -5, 0.1);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'equator':
                startFollowing('equator');
                followDistance.current = 5;
                camera.current.position.set(8, 0, 0);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'closeup':
                startFollowing('closeup');
                followDistance.current = 4;
                camera.current.position.set(0, 0, 4);
                camera.current.lookAt(0, 0, 0);
                break;
            case 'darkSide':
                startFollowing('darkSide');
                followDistance.current = 8;
                camera.current.position.set(-8, 0, 0);
                camera.current.lookAt(0, 0, 0);
                setLightIntensity(0.4);
                break;
            case 'calorisMontes':
                startFollowing('caloris');
                followDistance.current = 4.5;
                camera.current.position.set(0, 0.3, 4.5);
                camera.current.lookAt(0, 0.3, 0);
                break;
            default:
                break;
        }
    }, [viewMode]);

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
                    Viewing {viewMode}
                </div>
            )}

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
                        <h1 className="text-xl md:text-2xl font-bold text-indigo-300">
                            Mercury Explorer
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
                        <p className="text-indigo-400 mb-4 text-sm italic">
                            "The smallest planet in our solar system and closest to the Sun, with extreme temperature variations."
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 stats-grid">
                            {Object.entries(stats).map(([key, value]) => (
                                <div key={key} className="glass-panel p-3 rounded-lg border-l-2 border-indigo-500/50 hover:border-indigo-400 transition-colors">
                                    <div className="text-indigo-300 text-xs font-medium uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</div>
                                    <div className="text-indigo-200 text-sm font-bold">{value}</div>
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
                                        stopFollowing();
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
                                    { mode: 'calorisMontes', label: 'Caloris Montes', icon: '🏔️' },
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
                        stopFollowing();
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

export default MercuryVisualization;
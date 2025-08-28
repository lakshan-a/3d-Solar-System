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
const cityLightsTexture = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png';

const HeroSection = () => {
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

    // Settings state
    const [settings, setSettings] = useState({
        rotationSpeed: 1,
        lightIntensity: 1.2,
        exposure: 1.0,
        autoRotate: true,
        bloomEnabled: true,
        showAtmosphere: true,
        showClouds: true,
        showCities: true,
        cloudOpacity: 0.4,
        showInfoPanel: true
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

    // Create Earth
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
            loadTexture(cityLightsTexture)
        ]).then(([colorMap, normalMap, specularMap, cloudMap, nightMap]) => {
            // Configure texture settings
            [colorMap, normalMap, specularMap, cloudMap, nightMap].forEach(texture => {
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

        // Create Earth
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

    // Reset view
    const resetView = useCallback(() => {
        if (controls.current) {
            controls.current.reset();
        }
    }, []);

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
        <>
            {/* Hero content */}
            <div className=" ">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
                    Explore Our Planet
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mb-8 drop-shadow">
                    Discover Earth's beauty from a new perspective
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Start Exploring
                </button>
            </div>

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


            </div>
        </>

    );
};

export default HeroSection;
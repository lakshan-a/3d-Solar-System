import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const GalaxyVisualization = () => {
    const canvasRef = useRef(null);
    const loadingRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rotationSpeed, setRotationSpeed] = useState(1);
    const [starDensity, setStarDensity] = useState(1);
    const [galaxyType, setGalaxyType] = useState('spiral');
    const [stats, setStats] = useState({
        stars: '52,387',
        diameter: '100,000 ly',
        temperature: '10,000,000 K',
        speed: '220 km/s'
    });

    // Three.js variables
    const scene = useRef(new THREE.Scene());
    const camera = useRef(null);
    const renderer = useRef(null);
    const controls = useRef(null);
    const galaxy = useRef(new THREE.Group());
    const galaxyRotationSpeed = useRef(0.001);
    const starInstances = useRef(null);

    useEffect(() => {
        // Initialize Three.js
        const init = () => {
            // Create camera
            camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
            camera.current.position.z = 150;

            // Create renderer
            renderer.current = new THREE.WebGLRenderer({
                canvas: canvasRef.current,
                antialias: true,
                alpha: true
            });
            renderer.current.setSize(window.innerWidth, window.innerHeight);
            renderer.current.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio

            // Add controls
            controls.current = new OrbitControls(camera.current, renderer.current.domElement);
            controls.current.enableDamping = true;
            controls.current.dampingFactor = 0.05;

            // Create galaxy
            createGalaxy();

            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0x333333);
            scene.current.add(ambientLight);

            // Add directional light for core
            const coreLight = new THREE.PointLight(0xffffff, 2, 200);
            coreLight.position.set(0, 0, 0);
            scene.current.add(coreLight);

            // Add stars in the background
            createBackgroundStars();

            // Handle window resize
            window.addEventListener('resize', onWindowResize);

            // Start animation
            animate();

            // Hide loading screen after a delay
            setTimeout(() => {
                setIsLoading(false);
            }, 1000); // Reduced from 1500ms
        };

        // Create the galaxy structure using instanced meshes for better performance
        const createGalaxy = () => {
            scene.current.add(galaxy.current);

            // Create galaxy core
            const coreGeometry = new THREE.SphereGeometry(8, 16, 16); // Reduced segments
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: 0xffcc00,
                transparent: true,
                opacity: 0.8
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            galaxy.current.add(core);

            // Create glowing core effect with simpler geometry
            const coreGlowGeometry = new THREE.SphereGeometry(12, 16, 16); // Reduced segments
            const coreGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff9900,
                transparent: true,
                opacity: 0.3
            });
            const coreGlow = new THREE.Mesh(coreGlowGeometry, coreGlowMaterial);
            galaxy.current.add(coreGlow);

            // Create spiral arms using instanced mesh
            createSpiralArms();

            // Create nebulae
            createNebulae();
        };

        // Create spiral arms with stars using instanced mesh
        const createSpiralArms = () => {
            const armCount = 4;
            const starsPerArm = 12000;
            const totalStars = armCount * starsPerArm + 5000; // Total stars we'll create

            // Create a single geometry for all stars
            const starGeometry = new THREE.SphereGeometry(0.1, 4, 4); // Very simple geometry

            // Create instanced mesh
            const starMaterial = new THREE.MeshBasicMaterial();
            const instances = new THREE.InstancedMesh(starGeometry, starMaterial, totalStars);
            instances.count = 0; // We'll increment this as we add stars
            instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            galaxy.current.add(instances);
            starInstances.current = instances;

            // Create dummy object for matrix updates
            const dummy = new THREE.Object3D();
            const color = new THREE.Color();

            // Function to add a star instance
            const addStarInstance = (x, y, z, size, starColor) => {
                dummy.position.set(x, y, z);
                dummy.scale.set(size, size, size);
                dummy.updateMatrix();
                instances.setMatrixAt(instances.count, dummy.matrix);
                instances.setColorAt(instances.count, color.set(starColor));
                instances.count++;
            };

            // Create stars in spiral arms
            for (let arm = 0; arm < armCount; arm++) {
                const armAngle = (arm / armCount) * Math.PI * 2;

                for (let i = 0; i < starsPerArm; i++) {
                    // Calculate position along spiral arm
                    const distance = 10 + Math.pow(i / starsPerArm, 0.5) * 90;
                    const angle = armAngle + (i / 200) * 10;
                    const spiralOffset = Math.sin(i / 800) * 5;

                    const x = Math.cos(angle) * distance + spiralOffset * Math.cos(angle);
                    const y = (Math.random() - 0.5) * 8;
                    const z = Math.sin(angle) * distance + spiralOffset * Math.sin(angle);

                    // Determine star size and color based on position
                    const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
                    let size, starColor;

                    if (distanceFromCenter < 15) {
                        size = Math.random() * 0.3 + 0.1;
                        starColor = `hsl(${50 + Math.random() * 10}, 100%, ${50 + Math.random() * 30}%)`;
                    } else if (distanceFromCenter < 40) {
                        size = Math.random() * 0.2 + 0.05;
                        starColor = `hsl(${30 + Math.random() * 20}, 100%, ${60 + Math.random() * 30}%)`;
                    } else if (distanceFromCenter < 70) {
                        size = Math.random() * 0.15 + 0.03;
                        starColor = `hsl(0, 0%, ${80 + Math.random() * 20}%)`;
                    } else {
                        size = Math.random() * 0.1 + 0.02;
                        starColor = `hsl(${200 + Math.random() * 40}, 100%, ${70 + Math.random() * 30}%)`;
                    }

                    addStarInstance(x, y, z, size, starColor);
                }
            }

            // Add additional random stars
            for (let i = 0; i < 5000; i++) {
                const distance = 5 + Math.random() * 95;
                const angle = Math.random() * Math.PI * 2;
                const height = (Math.random() - 0.5) * 10;

                const x = Math.cos(angle) * distance;
                const y = height;
                const z = Math.sin(angle) * distance;

                const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
                let size, starColor;

                if (distanceFromCenter < 15) {
                    size = Math.random() * 0.3 + 0.1;
                    starColor = `hsl(${50 + Math.random() * 10}, 100%, ${50 + Math.random() * 30}%)`;
                } else if (distanceFromCenter < 40) {
                    size = Math.random() * 0.2 + 0.05;
                    starColor = `hsl(${30 + Math.random() * 20}, 100%, ${60 + Math.random() * 30}%)`;
                } else if (distanceFromCenter < 70) {
                    size = Math.random() * 0.15 + 0.03;
                    starColor = `hsl(0, 0%, ${80 + Math.random() * 20}%)`;
                } else {
                    size = Math.random() * 0.1 + 0.02;
                    starColor = `hsl(${200 + Math.random() * 40}, 100%, ${70 + Math.random() * 30}%)`;
                }

                addStarInstance(x, y, z, size, starColor);
            }

            // Update the instanced mesh
            instances.instanceMatrix.needsUpdate = true;
            if (instances.instanceColor) {
                instances.instanceColor.needsUpdate = true;
            }
        };

        // Create nebulae for visual effect
        const createNebulae = () => {
            const nebulaCount = 5; // Reduced from 8

            for (let i = 0; i < nebulaCount; i++) {
                const distance = 30 + Math.random() * 60;
                const angle = Math.random() * Math.PI * 2;
                const height = (Math.random() - 0.5) * 15;

                const x = Math.cos(angle) * distance;
                const y = height;
                const z = Math.sin(angle) * distance;

                const nebula = createNebula(x, y, z);
                galaxy.current.add(nebula);
            }
        };

        // Create a single nebula with simpler geometry
        const createNebula = (x, y, z) => {
            const size = 10 + Math.random() * 20;
            const geometry = new THREE.SphereGeometry(size, 8, 8); // Reduced segments

            // Create nebula material with random color
            const colors = [
                new THREE.Color(0.6, 0.2, 0.8), // Purple
                new THREE.Color(0.2, 0.4, 0.9), // Blue
                new THREE.Color(0.9, 0.3, 0.3), // Red
                new THREE.Color(0.1, 0.7, 0.5)  // Green
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.08,
                wireframe: true
            });

            const nebula = new THREE.Mesh(geometry, material);
            nebula.position.set(x, y, z);
            return nebula;
        };

        // Create background stars (distant stars) with simpler implementation
        const createBackgroundStars = () => {
            const starCount = 1000; // Reduced from 2000
            const positions = new Float32Array(starCount * 3);
            const colors = new Float32Array(starCount * 3);
            const sizes = new Float32Array(starCount);

            for (let i = 0; i < starCount; i++) {
                // Position stars in a large sphere around the scene
                const radius = 300 + Math.random() * 700;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);

                // Random color (mostly blue/white)
                colors[i * 3] = Math.random() * 0.5 + 0.5;
                colors[i * 3 + 1] = Math.random() * 0.5 + 0.5;
                colors[i * 3 + 2] = Math.random() * 0.5 + 0.8;

                sizes[i] = Math.random() * 1.5 + 0.5; // Smaller sizes
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const material = new THREE.PointsMaterial({
                size: 1.5,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                sizeAttenuation: false
            });

            const stars = new THREE.Points(geometry, material);
            scene.current.add(stars);
        };

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate the galaxy
            galaxy.current.rotation.y += galaxyRotationSpeed.current;

            // Update controls
            controls.current.update();

            // Render the scene
            renderer.current.render(scene.current, camera.current);
        };

        // Handle window resize
        const onWindowResize = () => {
            camera.current.aspect = window.innerWidth / window.innerHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(window.innerWidth, window.innerHeight);
        };

        // Initialize
        init();

        // Cleanup
        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (renderer.current) {
                renderer.current.dispose();
            }
            if (controls.current) {
                controls.current.dispose();
            }
            if (starInstances.current) {
                starInstances.current.dispose();
            }
        };
    }, []);

    // Update rotation speed when slider changes
    useEffect(() => {
        galaxyRotationSpeed.current = rotationSpeed * 0.001;
    }, [rotationSpeed]);


    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
            {/* Loading screen */}
            {isLoading && (
                <div
                    ref={loadingRef}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500"
                    style={{ opacity: isLoading ? 1 : 0 }}
                >
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h2 className="text-2xl font-semibold text-blue-400">Generating Galaxy...</h2>
                </div>
            )}


            {/* Canvas container */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* Info panel */}
            <div className="absolute top-6 left-6 z-10 bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl max-w-md border border-blue-500/30 shadow-2xl shadow-blue-500/10">
                <h1 className="text-3xl font-bold mb-4 text-blue-400 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    3D Galaxy Explorer
                </h1>

                <p className="text-blue-100 mb-4">
                    This visualization shows a spiral galaxy with over 50,000 stars. Navigate using your mouse:
                </p>

                <ul className="list-disc pl-5 mb-6 text-blue-100 space-y-2">
                    <li><span className="font-semibold">Left click + drag:</span> Rotate view</li>
                    <li><span className="font-semibold">Right click + drag:</span> Pan view</li>
                    <li><span className="font-semibold">Scroll:</span> Zoom in/out</li>
                </ul>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                        <div className="text-blue-300 text-sm font-medium">Stars Count</div>
                        <div className="text-white text-xl font-bold">{stats.stars}</div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                        <div className="text-blue-300 text-sm font-medium">Galaxy Diameter</div>
                        <div className="text-white text-xl font-bold">{stats.diameter}</div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                        <div className="text-blue-300 text-sm font-medium">Core Temperature</div>
                        <div className="text-white text-xl font-bold">{stats.temperature}</div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                        <div className="text-blue-300 text-sm font-medium">Rotation Speed</div>
                        <div className="text-white text-xl font-bold">{stats.speed}</div>
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
                            max="2"
                            step="0.1"
                            value={rotationSpeed}
                            onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="star-density" className="block text-blue-300 mb-2">
                            Star Density
                        </label>
                        <input
                            type="range"
                            id="star-density"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={starDensity}
                            onChange={(e) => setStarDensity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setGalaxyType('spiral')}
                            className={`flex-1 py-3 rounded-xl transition-all ${
                                galaxyType === 'spiral'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                                    : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                            }`}
                        >
                            Spiral
                        </button>

                        <button
                            onClick={() => setGalaxyType('elliptical')}
                            className={`flex-1 py-3 rounded-xl transition-all ${
                                galaxyType === 'elliptical'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                                    : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                            }`}
                        >
                            Elliptical
                        </button>

                        <button
                            onClick={() => setGalaxyType('irregular')}
                            className={`flex-1 py-3 rounded-xl transition-all ${
                                galaxyType === 'irregular'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                                    : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                            }`}
                        >
                            Irregular
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            camera.current.position.set(0, 30, 150);
                            camera.current.lookAt(0, 0, 0);
                            controls.current.reset();
                        }}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Reset View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GalaxyVisualization;
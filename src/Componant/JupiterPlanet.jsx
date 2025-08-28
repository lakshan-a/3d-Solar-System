import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useState, useRef, Suspense } from 'react'
import jupiterTexture from '../assets/images/jupiter/2k_jupiter.jpg'
import jupiterBumpMap from '../assets/images/jupiter/jupiter-bump.jpg'
import ioTexture from '../assets/images/jupiter/2k_io.jpg'
import europaTexture from '../assets/images/jupiter/2k_europa.jpg'
import ganymedeTexture from '../assets/images/jupiter/2k_ganymede.jpg'
import callistoTexture from '../assets/images/jupiter/2k_callisto.jpg'

// Jupiter component with independent lighting
const Jupiter = ({ onClick, selected }) => {
    const [jupiterMap, jupiterBump] = useLoader(THREE.TextureLoader, [
        jupiterTexture,
        jupiterBumpMap
    ])

    const jupiterRef = useRef()
    useFrame(() => {
        jupiterRef.current.rotation.y += 0.002
    })

    return (
        <mesh
            ref={jupiterRef}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
        >
            <sphereGeometry args={[2, 64, 64]} />
            <meshStandardMaterial
                map={jupiterMap}
                bumpMap={jupiterBump}
                bumpScale={0.15}
                roughness={0.8}
                metalness={0.1}
                emissive="#ff8c00"
                emissiveIntensity={selected ? 0.2 : 0.1}
            />
        </mesh>
    )
}

// Moon component with independent selection
const Moon = ({
                  name,
                  size,
                  speed,
                  distance,
                  onClick,
                  selected,
                  texture
              }) => {
    const moonRef = useRef()
    const groupRef = useRef()
    const moonMap = useLoader(THREE.TextureLoader, texture)

    useFrame(() => {
        groupRef.current.rotation.y += speed * 0.005
        moonRef.current.rotation.y += 0.01
    })

    return (
        <group ref={groupRef}>
            <mesh
                ref={moonRef}
                position={[distance, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation()
                    onClick()
                }}
            >
                <sphereGeometry args={[size, 64, 64]} />
                <meshStandardMaterial
                    map={moonMap}
                    roughness={0.8}
                    metalness={0.1}
                    emissive={selected ? "#ffffff" : "#000000"}
                    emissiveIntensity={selected ? 0.3 : 0}
                />
            </mesh>
        </group>
    )
}

const PlanetInfo = ({ planet, moon, visible }) => {
    if (!visible) return null

    return (
        <div className="absolute bottom-10 left-10 bg-black bg-opacity-80 text-white p-6 rounded-lg max-w-md backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-2">{planet.name}</h2>
            {moon ? (
                <>
                    <h3 className="text-xl font-semibold mb-1">{moon.name}</h3>
                    <p className="mb-1"><strong>Diameter:</strong> {moon.diameter}</p>
                    <p className="mb-1"><strong>Orbital Period:</strong> {moon.orbitalPeriod}</p>
                    <p className="mb-1"><strong>Distance from Jupiter:</strong> {moon.distance}</p>
                    <p className="mt-2">{moon.description}</p>
                </>
            ) : (
                <>
                    <p className="mb-1"><strong>Diameter:</strong> {planet.diameter}</p>
                    <p className="mb-1"><strong>Mass:</strong> {planet.mass}</p>
                    <p className="mb-1"><strong>Distance from Sun:</strong> {planet.distance}</p>
                    <p className="mb-1"><strong>Orbital Period:</strong> {planet.orbitalPeriod}</p>
                    <p className="mt-2">{planet.description}</p>
                </>
            )}
        </div>
    )
}

const JupiterPlanet = () => {
    const [selected, setSelected] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const [selectedMoon, setSelectedMoon] = useState(null)

    const jupiterData = {
        name: "Jupiter",
        diameter: "139,820 km",
        mass: "1.898 × 10^27 kg",
        distance: "778.5 million km",
        orbitalPeriod: "11.86 Earth years",
        description: "Jupiter is the largest planet in our solar system. It's a gas giant with a strong magnetic field and at least 79 moons."
    }

    const moonsData = {
        Io: {
            name: "Io",
            diameter: "3,643 km",
            orbitalPeriod: "1.77 Earth days",
            distance: "421,700 km from Jupiter",
            description: "The most volcanically active body in the solar system, with over 400 active volcanoes."
        },
        Europa: {
            name: "Europa",
            diameter: "3,122 km",
            orbitalPeriod: "3.55 Earth days",
            distance: "670,900 km from Jupiter",
            description: "Has a smooth, icy surface likely covering a subsurface ocean that may harbor life."
        },
        Ganymede: {
            name: "Ganymede",
            diameter: "5,262 km",
            orbitalPeriod: "7.15 Earth days",
            distance: "1,070,400 km from Jupiter",
            description: "The largest moon in the solar system, even bigger than Mercury, with its own magnetic field."
        },
        Callisto: {
            name: "Callisto",
            diameter: "4,821 km",
            orbitalPeriod: "16.69 Earth days",
            distance: "1,882,700 km from Jupiter",
            description: "Most heavily cratered object in the solar system, with an ancient surface."
        }
    }

    const moons = [
        { name: "Io", size: 0.3, speed: 0.4, distance: 4, texture: ioTexture },
        { name: "Europa", size: 0.25, speed: 0.6, distance: 6, texture: europaTexture },
        { name: "Ganymede", size: 0.4, speed: 1, distance: 7, texture: ganymedeTexture },
        { name: "Callisto", size: 0.35, speed: 0.8, distance: 9, texture: callistoTexture }
    ]

    const handleJupiterClick = () => {
        setSelected(true)
        setShowInfo(true)
        setSelectedMoon(null)
    }

    const handleMoonClick = (moonName) => {
        setSelectedMoon(moonName)
        setShowInfo(true)
        setSelected(false)
    }

    const handleBackgroundClick = () => {
        setSelected(false)
        setShowInfo(false)
        setSelectedMoon(null)
    }

    return (
        <div className="h-screen w-full bg-black relative" style={{ touchAction: 'none' }}>
            <Canvas
                camera={{ position: [0, 0, 15], fov: 60 }}
                className="w-full h-full"
                onClick={(e) => {
                    if (e.intersections.length === 0) {
                        handleBackgroundClick()
                    }
                }}
            >
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6495ED" />
                <pointLight position={[0, 20, 0]} intensity={0.5} color="#FFFFFF" />

                <Suspense fallback={null}>
                    <Jupiter
                        onClick={handleJupiterClick}
                        selected={selected}
                    />

                    {moons.map((moon, index) => (
                        <Moon
                            key={index}
                            {...moon}
                            onClick={() => handleMoonClick(moon.name)}
                            selected={selectedMoon === moon.name}
                        />
                    ))}
                </Suspense>

                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    zoomSpeed={0.6}
                    panSpeed={0.5}
                    rotateSpeed={0.4}
                    minDistance={5}
                    maxDistance={30}
                />

                <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0}
                    fade
                />
            </Canvas>

            <PlanetInfo
                planet={jupiterData}
                moon={selectedMoon ? moonsData[selectedMoon] : null}
                visible={showInfo}
            />
        </div>
    )
}

export default JupiterPlanet
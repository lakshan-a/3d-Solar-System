import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    const planets = [
        { name: 'Sun', path: '/sun', color: 'bg-yellow-500', description: 'The star at the center of our solar system' },
        { name: 'Mercury', path: '/mercury', color: 'bg-gray-400', description: 'The smallest and innermost planet' },
        { name: 'Venus', path: '/venus', color: 'bg-yellow-200', description: 'Earth\'s sister planet with a toxic atmosphere' },
        { name: 'Earth', path: '/earth', color: 'bg-blue-500', description: 'Our home planet teeming with life' },
        { name: 'Mars', path: '/mars', color: 'bg-red-500', description: 'The red planet with potential for life' },
        { name: 'Jupiter', path: '/jupiter', color: 'bg-yellow-600', description: 'The massive gas giant with a Great Red Spot' },
        { name: 'Saturn', path: '/saturn', color: 'bg-yellow-300', description: 'The ringed planet with spectacular rings' },
        { name: 'Uranus', path: '/uranus', color: 'bg-teal-300', description: 'The ice giant tilted on its side' },
        { name: 'Neptune', path: '/neptune', color: 'bg-blue-400', description: 'The windiest planet with supersonic winds' },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-amber-400">Solar System Explorer</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planets.map((planet) => (
                    <Link
                        key={planet.path}
                        to={planet.path}
                        className={`${planet.color} p-6 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center h-48`}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{planet.name}</h2>
                        <p className="text-gray-900 text-center">{planet.description}</p>
                    </Link>
                ))}
            </div>

            <div className="mt-12 bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 border border-gray-800">
                <h2 className="text-2xl font-bold text-amber-400 mb-4">About This Project</h2>
                <p className="text-gray-300 mb-4">
                    This interactive 3D visualization allows you to explore our solar system's planets in detail.
                    Each planet is rendered with accurate textures and features, with customizable viewing options.
                </p>
                <p className="text-gray-300">
                    Built with React, Three.js, and React Three Fiber, this application provides an immersive
                    educational experience about our cosmic neighborhood.
                </p>
            </div>
        </div>
    );
};

export default Home;
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const planets = [
        { name: 'Sun', path: '/sun', color: 'bg-yellow-500' },
        { name: 'Mercury', path: '/mercury', color: 'bg-gray-400' },
        { name: 'Venus', path: '/venus', color: 'bg-yellow-200' },
        { name: 'Earth', path: '/earth', color: 'bg-blue-500' },
        { name: 'Mars', path: '/mars', color: 'bg-red-500' },
        { name: 'Jupiter', path: '/jupiter', color: 'bg-yellow-600' },
        { name: 'Saturn', path: '/saturn', color: 'bg-yellow-300' },
        { name: 'Uranus', path: '/uranus', color: 'bg-teal-300' },
        { name: 'Neptune', path: '/neptune', color: 'bg-blue-400' },
    ];

    return (
        <nav className="bg-gray-900/80 backdrop-blur-md p-4 sticky top-0 z-50 border-b border-gray-800">
            <div className="container mx-auto flex flex-wrap justify-center gap-2 md:gap-4">
                <Link
                    to="/"
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white font-medium"
                >
                    Solar System
                </Link>

                {planets.map((planet) => (
                    <Link
                        key={planet.path}
                        to={planet.path}
                        className={`px-4 py-2 rounded-lg ${planet.color} hover:opacity-90 transition-opacity text-gray-900 font-medium`}
                    >
                        {planet.name}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
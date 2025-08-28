import React from 'react';
import SunVisualization from '../planets/SunVisualization.jsx';
import MercuryVisualization from '../planets/MercuryVisualization.jsx';
import VenusVisualization from '../planets/VenusVisualization.jsx';
import EarthVisualization from '../planets/EarthVisualization.jsx';
import MarsVisualization from '../planets/MarsVisualization.jsx';
import JupiterVisualization from '../planets/JupiterVisualization.jsx';
import SaturnVisualization from '../planets/SaturnVisualization.jsx';
import UranusVisualization from '../planets/UranusVisualization.jsx';
import NeptuneVisualization from '../planets/NeptuneVisualization.jsx';

const PlanetPage = ({ planet }) => {
    const planetComponents = {
        sun: <SunVisualization />,
        mercury: <MercuryVisualization />,
        venus: <VenusVisualization />,
        earth: <EarthVisualization />,
        mars: <MarsVisualization />,
        jupiter: <JupiterVisualization />,
        saturn: <SaturnVisualization />,
        uranus: <UranusVisualization />,
        neptune: <NeptuneVisualization />,
    };

    return (
        <div className="h-screen">
            {planetComponents[planet]}
        </div>
    );
};

export default PlanetPage;
import { useState } from 'react'
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router";
import GalaxyPlanets from "./Componant/GalaxyPlanets.jsx";
import Galaxy from "./Componant/Galaxy.jsx";
import CosmicHarmonyMap from "./Componant/CosmicHarmonyMap.jsx";
import CosmicHarmonyExplorer from "./Componant/CosmicHarmonyExplorer.jsx";
import GalaxyVisualization from "./Componant/GalaxyVisualization.jsx";
import EarthVisualization from "./Componant/planets/EarthVisualization.jsx";
import MercuryVisualization from "./Componant/planets/MercuryVisualization.jsx";
import VenusVisualization from "./Componant/planets/VenusVisualization.jsx";
import MarsVisualization from "./Componant/planets/MarsVisualization.jsx";
import JupiterVisualization from "./Componant/planets/JupiterVisualization.jsx";
import JupiterPlanet from "./Componant/JupiterPlanet.jsx";
import SaturnVisualization from "./Componant/planets/SaturnVisualization.jsx";
import UranusVisualization from "./Componant/planets/UranusVisualization.jsx";
import NeptuneVisualization from "./Componant/planets/NeptuneVisualization.jsx";
import SunVisualization from "./Componant/planets/SunVisualization.jsx";
// import Navbar from "./Componant/Navbar.jsx";
import PlanetPage from "./Componant/pages/PlanetsPage.jsx";
import Home from "./Componant/pages/Home.jsx";
import GalaxyVisualizationWrapper from "./Componant/GalaxyVisualizationWrapper.jsx";
import HeroSection from "./Componant/HeroSection.jsx";
import Planets from "./Componant/Planets.jsx";

function App() {


    return (

      <BrowserRouter>
          {/*<Navbar />*/}

          <Routes>
              <Route path="/" element={<GalaxyPlanets/>} />
              <Route path="/galaxy" element={<Galaxy/>} />
              <Route path="/map" element={<CosmicHarmonyMap/>} />
              <Route path="/explorer" element={<CosmicHarmonyExplorer/>} />
              <Route path="/visualization" element={<GalaxyVisualization/>} />
              <Route path="/rings" element={<GalaxyVisualizationWrapper/>} />

              <Route path="/" element={<Home/>} />
              {/*<Route path="/sun" element={<PlanetPage/>} />*/}

              <Route path="/sun" element={<SunVisualization/>} />
              <Route path="/mercury" element={<MercuryVisualization/>} />
              <Route path="/venus" element={<VenusVisualization/>} />
              <Route path="/earth" element={<EarthVisualization/>} />
              <Route path="/mars" element={<MarsVisualization/>} />
              <Route path="/jupiter" element={<JupiterVisualization/>} />
              <Route path="/jupiters" element={<JupiterPlanet/>} />
              <Route path="/planet" element={<JupiterPlanet/>} />
              <Route path="/saturn" element={<SaturnVisualization/>} />
              <Route path="/uranus" element={<UranusVisualization/>} />
              <Route path="/neptune" element={<NeptuneVisualization/>} />
              <Route path="/hero" element={<HeroSection/>} />
              <Route path="/planets" element={<Planets/>} />


          </Routes>
      </BrowserRouter>
  )
}

export default App

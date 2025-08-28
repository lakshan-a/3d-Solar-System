import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const GalaxyMap = dynamic(() => import('../Componant/galaxy/GalaxyMap.jsx'), {
    ssr: false,
    loading: () => <div className="loading-galaxy">Loading Galaxy...</div>
})

const GalaxyPage = () => {
    const [selectedBody, setSelectedBody] = useState(null)

    return (
        <>
            <Head>
                <title>Solar System Explorer</title>
                <meta name="description" content="Explore our solar system in 3D" />
            </Head>

            <div className="galaxy-container">
                <GalaxyMap onSelectBody={setSelectedBody} />

                {selectedBody && (
                    <div className="celestial-info-overlay">
                        <h2>{selectedBody.name}</h2>
                        <button
                            onClick={() => window.location.href = `/galaxy/${selectedBody.id}`}
                            className="explore-button"
                        >
                            Explore {selectedBody.name}
                        </button>
                        <button
                            onClick={() => setSelectedBody(null)}
                            className="close-button"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default GalaxyPage
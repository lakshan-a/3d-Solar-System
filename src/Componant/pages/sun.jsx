import React from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const SunVisualization = dynamic(() => import('../planets/SunVisualization.jsx'), {
    ssr: false,
    loading: () => <div className="loading">Loading Sun Visualization...</div>
})

const SunPage = () => {
    return (
        <>
            <Head>
                <title>Sun - Solar System Explorer</title>
                <meta name="description" content="Detailed view of our Sun" />
            </Head>

            <div className="celestial-page">
                <SunVisualization />
            </div>
        </>
    )
}

export default SunPage
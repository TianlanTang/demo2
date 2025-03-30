import React, { useState, useEffect } from 'react';
import { LoadStore } from './loadStore';

const TileMap = () => {
    const store = LoadStore(state => state.activeStore);  
    const { tiles, getSurfaceWidth, getSurfaceHeight } = store();

    const _surfaceWidth = getSurfaceWidth();
    const _surfaceHeight = getSurfaceHeight();

    const width = 900; // Large background width
    const height = 700; // Large background height

    const shiftX = (width - _surfaceWidth) / 2; // Center the surface horizontally
    const shiftY = (height - _surfaceHeight) / 2; // Center the surface vertically

    // State variables for additional functionality
    const [visibleTiles, setVisibleTiles] = useState(tiles.length); // Initially show all tiles
    const [animate, setAnimate] = useState(false); // Control whether to animate
    const [fill, setFill] = useState('none'); // Control whether to fill the holes
    const [isShowIndex, setIsShowIndex] = useState(false); // Control whether to show tile index

    useEffect(() => {
        if (animate) {
            // Incrementally increase the number of visible tiles
            if (visibleTiles < tiles.length) {
                const timer = setTimeout(() => {
                    setVisibleTiles(visibleTiles + 1);
                }, 100); // Adjust the delay (in milliseconds) for animation speed
                return () => clearTimeout(timer);
            }
        }
    }, [visibleTiles, tiles, animate]);

    const handleReload = () => {
        setVisibleTiles(0); // Reset visible tiles
        if (!animate) {
            // If animation is disabled, immediately show all tiles
            setVisibleTiles(tiles.length);
        }
    };

    const toggleFill = () => {
        setFill(fill === 'none' ? 'white' : 'none'); // Toggle fill color
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Buttons container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '20px' }}>
                <button onClick={handleReload} style={{ marginBottom: '10px' }}>
                    Reload
                </button>
                <button onClick={() => setAnimate(!animate)} style={{ marginBottom: '10px' }}>
                    {animate ? 'Disable Animation' : 'Enable Animation'}
                </button>
                <button onClick={toggleFill} style={{ marginTop: '10px' }}>
                    {fill === 'none' ? 'Add Mask' : 'No Mask'}
                </button>
                <button onClick={() => setIsShowIndex(!isShowIndex)} style={{ marginTop: '10px' }}>
                    {isShowIndex ? 'Hide Index' : 'Show Index'}
                </button>
            </div>

            {/* SVG container */}
            <svg
                id="tile_svg"
                width={width}
                height={height}
                style={{ border: '3px solid #000', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
            >
                {/* Large background */}
                <rect width={width} height={height} fill="#f0f0f0" />

                {/* Mask definition */}
                <defs>
                    <mask id="surfaceMask">
                        <rect width={width} height={height} fill="white" />
                        <rect
                            x={shiftX}
                            y={shiftY}
                            width={_surfaceWidth}
                            height={_surfaceHeight}
                            fill="black"
                        />
                    </mask>
                </defs>

   

                {/* Draw tiles */}
                <g transform={`translate(${shiftX}, ${shiftY})`}>
                    {tiles.map((tile, index) => (
                        index < visibleTiles ? (
                            <g key={index} transform={`translate(${tile.x}, ${tile.y})`}>
                                {/* Background */}
                                <rect width={tile.width} height={tile.height} fill={tile.color} />
                                {/* Border */}
                                <rect width={tile.width} height={tile.height} fill="none" stroke="#000" strokeWidth="2" />
                                {/* Tile Index */}
                                {isShowIndex && (
                                    <text
                                        x={tile.width / 2}
                                        y={tile.height / 2}
                                        fill="black"
                                        fontSize="12"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                    >
                                        {index}
                                    </text>
                                )}
                            </g>
                        ) : null
                    ))}
                </g>

                {/* Apply Mask */}
                <rect width={width} height={height} fill={fill} mask="url(#surfaceMask)" />

                {/* Surface area (drawn last) */}
                <rect
                    x={shiftX}
                    y={shiftY}
                    width={_surfaceWidth}
                    height={_surfaceHeight}
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
};

export default TileMap;

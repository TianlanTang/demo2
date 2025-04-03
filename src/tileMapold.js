import { pattern } from './pattern';
import { useStore } from 'zustand';
import { useState, useEffect } from 'react';

const TileMap = () => {
    console.log("TileMap Ready to Load");
    const {
        tiles,
        tileColors,
        surfaceVertices,
        holeVertices,
    } = useStore(pattern);

    const width = 900;
    const height = 600;
    const shiftX = (width + (surfaceVertices[0][0] - surfaceVertices[1][0])) / 2;
    const shiftY = (height + (surfaceVertices[1][1] - surfaceVertices[2][1])) / 2;

    // State to control the number of tiles rendered
    const [visibleTiles, setVisibleTiles] = useState(tiles.flat().length); // Initially show all tiles
    const [animate, setAnimate] = useState(false); // Control whether to animate
    const [fill, setFill] = useState('none'); // Control whether to fill the holes
    const [IsShowIndex, setIsShowIndex] = useState(false); // Control whether to show tile index

    useEffect(() => {
        if (animate) {
            // Incrementally increase the number of visible tiles
            if (visibleTiles < tiles.flat().length) {
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
            setVisibleTiles(tiles.flat().length);
        }
    };

    const toggleFill = () => {
        setFill(fill === 'none' ? 'white' : 'none'); // Toggle fill color
    }

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
                <button onClick={() => setIsShowIndex(!IsShowIndex)} style={{ marginTop: '10px' }}>
                    {IsShowIndex ? 'Hide Index' : 'Show Index'}
                </button>
            </div>

            {/* SVG container */}
            <svg
                id="tile_svg"
                width={width}
                height={height}
                style={{ border: '1px solid #000', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
            >
                {/* Define mask */}
                <defs>
                    <mask id="surfaceMask">
                        <rect width={width} height={height} fill="white" />
                        <polygon
                            points={surfaceVertices.map(([x, y]) => `${x+shiftX},${y+shiftY}`).join(" ")}
                            fill="black"
                        />
                    </mask>
                </defs>

                {/* draw Tiles */}
                {tiles.map((tileGroup, tileGroupIndex) => (
                    tileGroup.map(({ tile, draw }, tileIndex) => (
                        draw && (tileGroupIndex * tileGroup.length + tileIndex < visibleTiles) ? (
                            <g key={`tile-${tileGroupIndex}-quad-${tileIndex}`}>
                                {/* Tile Polygon */}
                                <polygon
                                    points={tile.map(([x, y]) => `${x + shiftX},${y + shiftY}`).join(" ")}
                                    fill={tileColors[tileIndex % tileColors.length]} 
                                    stroke="#000"
                                    strokeWidth="0.5"
                                />
                                {/* Tile Index */}
                                {IsShowIndex && <text
                                    x={tile.reduce((sum, [x, y]) => sum + x, 0) / tile.length + shiftX}
                                    y={tile.reduce((sum, [x, y]) => sum + y, 0) / tile.length + shiftY}
                                    fill="black"
                                    fontSize="12"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {tileIndex}
                                </text>}
                            </g>
                        ) : null
                    ))
                ))}


                {/* draw Holes */}
                {holeVertices.map((hole, index) => (
                    <polygon
                        key={`hole-${index}`}
                        points={hole.map(([x, y]) => `${x+shiftX},${y+shiftY}`).join(" ")}
                        fill={fill}
                        stroke="yellow"
                        strokeWidth="1"
                    />
                ))}

                {/* Apply Mask */}
                <rect width={width} height={height} fill={fill} mask="url(#surfaceMask)" />

                {/* draw Surface */}
                <polygon
                    points={surfaceVertices.map(([x, y]) => `${x+shiftX},${y+shiftY}`).join(" ")}
                    fill='none'
                    stroke="red"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
};

export default TileMap;

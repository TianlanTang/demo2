import { pattern } from './pattern';
import { useStore } from 'zustand';
import { useState, useEffect } from 'react';

const TileMap = () => {
    console.log("TileMap Ready to Load");
    const {
        tileColors,
        selectedWall,
        walls,
        scale,
    } = useStore(pattern);

    const tiles = walls[selectedWall]['tiles'];
    const surfaceVertices = walls[selectedWall]['surfaceVertices'];
    const holeVertices = walls[selectedWall]['holeVertices'];

    const width = Math.max(...surfaceVertices.map(v => v[0]));
    const height = Math.max(...surfaceVertices.map(v => v[1]));

    const shiftX = (width + (surfaceVertices[0][0] - surfaceVertices[1][0])) / 2;
    const shiftY = (height + (surfaceVertices[1][1] - surfaceVertices[2][1])) / 2;

    // State to control the number of tiles rendered
    const [visibleTiles, setVisibleTiles] = useState(tiles.flat().length); // Initially show all tiles
    const [animate, setAnimate] = useState(false); // Control whether to animate
    const [fill, setFill] = useState('none'); // Control whether to fill the holes
    const [IsShowIndex, setIsShowIndex] = useState(false); // Control whether to show tile index

    // tile that is currently hovered
    const [hoveredTile, setHoveredTile] = useState({ groupIndex: null, tileIndex: null });

    // calculate distance between two points
    const getDistance = (p1, p2) => {
        const [x1, y1] = p1;
        const [x2, y2] = p2;
        return (Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / scale).toFixed(0);
    };

    useEffect(() => {
        if (animate) {
            // Incrementally increase the number of visible tiles
            if (visibleTiles < tiles.flat().length) {
                const timer = setTimeout(() => {
                    setVisibleTiles(visibleTiles + 1);
                }, 100); 
                return () => clearTimeout(timer);
            }
        }
    }, [visibleTiles, tiles, animate]);

    useEffect(() => {
        if (!animate) {
            // Reset visible tiles to show all tiles when animation is disabled
            setVisibleTiles(tiles.flat().length);
        }
    }, [tiles, animate]);

    const handleReload = () => {
        setVisibleTiles(0);
        if (!animate) {
            // If animation is disabled, immediately show all tiles
            setVisibleTiles(tiles.flat().length);
        }
    };

    const toggleFill = () => {
        setFill(fill === 'none' ? 'white' : 'none');
    };

    // render polygons and text separately
    const polygons = [];
    const texts = [];

    // collect all polygons and texts
    tiles.forEach((tileGroup, groupIndex) => {
        tileGroup.forEach(({ tile, draw, id }, tileIndex) => {
            const globalIndex = groupIndex * tileGroup.length + tileIndex;
            if (!draw || globalIndex >= visibleTiles) return; 

            // push the polygon to the array
            polygons.push(
                <polygon
                    key={`polygon-${groupIndex}-${tileIndex}`}
                    points={tile.map(([x, y]) => `${x + shiftX},${y + shiftY}`).join(' ')}
                    fill={tileColors[tileIndex % tileColors.length]}
                    stroke="#000"
                    strokeWidth="0.5"
                    onMouseEnter={() => setHoveredTile({ groupIndex, tileIndex })}
                    onMouseLeave={() => setHoveredTile({ groupIndex: null, tileIndex: null })}
                />
            );

            // push the text to the array
            if (IsShowIndex) {
                const cx = tile.reduce((sum, [x]) => sum + x, 0) / tile.length + shiftX;
                const cy = tile.reduce((sum, [, y]) => sum + y, 0) / tile.length + shiftY;

                texts.push(
                    <text
                        key={`indexText-${groupIndex}-${tileIndex}`}
                        x={cx}
                        y={cy}
                        fill="black"
                        fontSize="12"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    >
                        {id}
                    </text>
                );
            }

            // draw the distance between the vertices
            if (hoveredTile.groupIndex === groupIndex && hoveredTile.tileIndex === tileIndex) {
                for (let i = 0; i < tile.length; i++) {
                    const j = (i + 1) % tile.length;
                    const xMid = (tile[i][0] + tile[j][0]) / 2 + shiftX;
                    const yMid = (tile[i][1] + tile[j][1]) / 2 + shiftY;

                    texts.push(
                        <text
                            key={`edge-${groupIndex}-${tileIndex}-${i}`}
                            x={xMid}
                            y={yMid}
                            fill="black"
                            fontSize="12"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {getDistance(tile[i], tile[j])}
                        </text>
                    );
                }
            }
        });
    });

    return (
        <div style={{ width: '100%', padding: '10px' }}>
            {/* Buttons container */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '10px'
                }}
            >
                <button onClick={handleReload}>
                    Reload
                </button>
                <button onClick={() => setAnimate(!animate)}>
                    {animate ? 'Disable Animation' : 'Enable Animation'}
                </button>
                <button onClick={toggleFill}>
                    {fill === 'none' ? 'Add Mask' : 'No Mask'}
                </button>
                <button onClick={() => setIsShowIndex(!IsShowIndex)}>
                    {IsShowIndex ? 'Hide Index' : 'Show Index'}
                </button>
            </div>

            {/* Main content container */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '20px',
                    alignItems: 'flex-start'
                }}
            >
                {/* SVG container */}
                <svg
                    id="tile_svg"
                    width={width}
                    height={height}
                    style={{
                        border: '1px solid #000',
                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                        maxWidth: '100%',
                        height: 'auto'
                    }}
                >
                    {/*Mask */}
                    <defs>
                        <mask id="surfaceMask">
                            <rect width={width} height={height} fill="white" />
                            <polygon
                                points={surfaceVertices.map(([x, y]) => `${x + shiftX},${y + shiftY}`).join(" ")}
                                fill="black"
                            />
                        </mask>
                    </defs>

                    {/* polygons */}
                    {polygons}

                    { /* tiles */}
                    {holeVertices.map((hole, index) => (
                        <polygon
                            key={`hole-${index}`}
                            points={hole.map(([x, y]) => `${x + shiftX},${y + shiftY}`).join(" ")}
                            fill={fill}
                            stroke="yellow"
                            strokeWidth="1"
                        />
                    ))}

                    {/*Mask */}
                    <rect
                        width={width}
                        height={height}
                        fill={fill}
                        mask="url(#surfaceMask)"
                        style={{ pointerEvents: 'none' }} // Allow mouse events to pass through
                    />

                    {/* Surface*/}
                    <polygon
                        points={surfaceVertices.map(([x, y]) => `${x + shiftX},${y + shiftY}`).join(" ")}
                        fill="none"
                        stroke="red"
                        strokeWidth="1"
                        style={{ pointerEvents: 'none' }} // Allow mouse events to pass through
                    />

                    {/* texts */}
                    {texts}
                </svg>
            </div>
        </div>
    );
};

export default TileMap;

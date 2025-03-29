import { pattern } from './pattern';
import { useStore } from 'zustand';

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

    return (
        <svg
            id = "tile_svg"
            width={width}
            height={height}
            style={{ border: '1px solid #000', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
        >

            {/* draw Tiles */}
            {tiles.map((tileGroup, tileGroupIndex) => (
                tileGroup.map(({ tile, draw }, tileIndex) => (
                    draw ? (
                        <polygon
                            key={`tile-${tileGroupIndex}-quad-${tileIndex}`}
                            points={tile.map(([x, y]) => `${x + shiftX},${y + shiftY}`).join(" ")}
                            fill={tileColors[tileIndex % tileColors.length]} 
                            stroke="#000"
                            strokeWidth="0.5"
                        />
                    ) : null
                ))
            ))}

            {/* draw Holes */}
                {holeVertices.map((hole, index) => (
                <polygon
                    key={`hole-${index}`}
                    points={hole.map(([x, y]) => `${x+shiftX},${y+shiftY}`).join(" ")}
                    fill="none"
                    stroke="yellow"
                    strokeWidth="1"
                />
            ))}

            {/* draw Surface */}
            <polygon
                points={surfaceVertices.map(([x, y]) => `${x+shiftX},${y+shiftY}`).join(" ")}
                fill="none"
                stroke="red"
                strokeWidth="1"
            />
        </svg>
    );
};

export default TileMap;

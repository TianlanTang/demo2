import React from 'react';
import { LoadStore } from './loadStore';

const TileMap = () => {
    const store = LoadStore(state => state.activeStore);  
    const {tiles, getSurfaceWidth, getSurfaceHeight} = store();

    const _surfaceWidth = getSurfaceWidth();
    const _surfaceHeight = getSurfaceHeight();
    
    return (
        <svg
            id = "tile_svg"
            width={_surfaceWidth}
            height={_surfaceHeight}
            style={{ border: '3px solid #000', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
        >
        {tiles.map((tile, index) => (
            <g key={index} transform={`translate(${tile.x}, ${tile.y})`}>
                {/* background */}
                <rect width={tile.width} height={tile.height} fill={tile.color} />
                {/* border */}
                <rect width={tile.width} height={tile.height} fill="none" stroke="#000" strokeWidth="2" />
            </g>
        ))}           
        </svg>
    );
};

export default TileMap;

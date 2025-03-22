import React from 'react';
import { useStore } from './store';

const TileMap = () => {
    const {tiles, getSurfaceWidth, getSurfaceHeight, getTileWidth, getTileHeight} = useStore();

    const _tileWidth = getTileWidth();
    const _tileHeight = getTileHeight();
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
                <rect width={_tileWidth} height={_tileHeight} fill={tile.color} />
                {/* border */}
                <rect width={_tileWidth} height={_tileHeight} fill="none" stroke="#000" strokeWidth="2" />
            </g>
        ))}           
        </svg>
    );
};

export default TileMap;

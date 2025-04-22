// MultipleSurface.jsx - Three independent SVG version
import React from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';

// Perspective parameters
const SCALE = 0.7;   // Global scaling
const ROT   = 30;    // Rotation angle
const SKEW  = 30;    // Skew angle
const THETA = 30;    // Angle for floor transformation

// Single surface SVG component
function SurfaceSVG({ wallType, left, top, rot = 0, skew = 0, theta = 0, _SCALE = SCALE }) {
    const { walls, tileColors } = useStore(pattern);
    const wall = walls?.[wallType];
    if (!wall) return null;

    const { tiles, surfaceVertices } = wall;
    // Calculate original dimensions and apply scaling
    const rawW = Math.max(...surfaceVertices.map(v => v[0]));
    const rawH = Math.max(...surfaceVertices.map(v => v[1]));
    const width  = rawW * _SCALE;
    const height = rawH * _SCALE;

    // Determine rotation and translation based on wall type
    let svgWidth = width;
    let svgHeight = height;
    let transform = `rotate(${rot}deg) skewX(${skew}deg)`;
    let transformOrigin = '0 0';

    switch(wallType) {
        case 'east':
            // For east wall, rotate 90° clockwise
            break;
        case 'south':
            // For south wall, rotate 180°
            break;
        case 'west':
            // Transform from bottom right corner
            transformOrigin = `${width}px ${height}px`;
            transform = `skewY(${-skew}deg)`;
            break;
        case 'floor':
            // Transform from origin point
            const θ = theta * Math.PI/180;
            const a0 = Math.cos(θ);
            const b0 = Math.sin(θ);
            const c0 = -a0;
            const d0 = b0;
            const S  = 1/Math.cos(θ);

            // Apply scaling
            const a = a0 * S;
            const b = b0 * S;
            const c = c0 * S;
            const d = d0 * S;
            transformOrigin = `0 0`;
            transform = `matrix(${a}, ${b}, ${c}, ${d}, 0, 0)`;
            break;
        case 'north':
            // Transform from bottom left corner
            transformOrigin = `${0}px ${height}px`;
            transform = `skewY(${skew}deg)`;
            break;
        default:
    }

    // Render all tiles for this surface
    const renderTiles = () => {
        if (!tiles || tiles.length === 0) {
            return <text x="50%" y="50%" textAnchor="middle" fill="red">No tiles data</text>;
        }
        
        const polygons = [];
        tiles.forEach((tileGroup, groupIndex) => {
            tileGroup.forEach(({ tile, draw }, tileIndex) => {
                if (!draw) return;
                
                // Scale down the tile coordinates
                const scaledTile = tile.map(([x, y]) => [x * _SCALE, y * _SCALE]);
                
                polygons.push(
                    <polygon
                        key={`${wallType}-${groupIndex}-${tileIndex}`}
                        points={scaledTile.map(([x, y]) => `${x},${y}`).join(' ')}
                        fill={tileColors[tileIndex % tileColors.length]}
                        stroke="#000"
                        strokeWidth="0.4" // Reduced stroke width to match the scale
                    />
                );
            });
        });
        
        return polygons;
    };

    return (
        <svg
            width={svgWidth}
            height={svgHeight}
            style={{
                position: 'absolute',
                left,
                top,
                transform: transform,
                transformOrigin: transformOrigin,
                border: '1px solid white',
            }}
        >
            {renderTiles()}
            <text 
                x="50%" 
                y="50%" 
                dominantBaseline="middle" 
                textAnchor="middle" 
                fill="white" 
                stroke="black" 
                strokeWidth="0.5"
                style={{ fontSize: '16px', fontWeight: 'bold' }}
            >
                {wallType.toUpperCase()}
            </text>
        </svg>
    );
}

export default function PerspectiveView() {
    const { walls } = useStore(pattern);
    if (!walls) return <div>Loading walls data...</div>;

    // Get the original dimensions of each wall
    const sizeOf = w => ({
        w: Math.max(...w.surfaceVertices.map(v => v[0])),
        h: Math.max(...w.surfaceVertices.map(v => v[1]))
    });
    const westSz  = sizeOf(walls.west);
    const northSz = sizeOf(walls.north);
    const floorSz = sizeOf(walls.floor);

    // Apply scaling
    const scaledWestW = westSz.w * SCALE;
    const scaledWestH = westSz.h * SCALE;
    
    // Position of the common origin in the container
    const originX = 500;
    const originY = 500;

    return (
        <div style={{ position: 'relative', width: 1900, height: 1700 }}>
            {/* West — left wall */}
            <SurfaceSVG
                wallType="west"
                left={originX} 
                top={originY}
                rot={0}
                skew={SKEW}
            />
            {/* North — right wall */}
            <SurfaceSVG
                wallType="north"
                left={originX + scaledWestW}
                top={originY}
                rot={0}
                skew={SKEW}
            />
            {/* Floor — ground */}
            <SurfaceSVG
                wallType="floor"
                left={originX + scaledWestW}
                top={originY + scaledWestH}
                theta={THETA}  
            />
        </div>
    );
}

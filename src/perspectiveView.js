// MultipleSurface.jsx - Three independent SVG version
import React, {useState} from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';


// Perspective parameters
const SCALE = 0.7;   // Global scaling
const THETA = 30;    // Angle for floor transformation

// Single surface SVG component
const SurfaceSVG = ({ direction, wallType, left, top, rot = 0, skew = 0, theta = 0, _SCALE = SCALE, watch = 0 }) => {
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
    let transform = `rotate(${rot}deg) skewX(${skew}deg)`;
    let transformOrigin = '0 0';

    switch(direction) {
        case 'left':
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
            // transform
            const cx = width / 2;
            const cy = height / 2;
            transform = [
                `matrix(${a}, ${b}, ${c}, ${d}, 0, 0)`,
                `translate(${cx}px, ${cy}px)`,
                `rotate(${watch}deg)`,
                `translate(${-cx}px, ${-cy}px)`
            ].join(' ');
            break;
        case 'front':
            // Transform from bottom left corner
            transformOrigin = `${0}px ${height}px`;
            transform = `skewY(${skew}deg)`;
            break;
        default:
    }

    // Render all tiles for this surface
    const renderTiles = () => {
        if (!tiles || tiles.length === 0) {
            return <text x="50%" y="50%" textAnchor="middle" fill="red">Not initialized</text>;
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
            width={width}
            height={height}
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

const PerspectiveView = () => {

    const { walls } = useStore(pattern);

    // State for watch angle
    const [watch, setWatch] = useState(0);
    //wall types
    const walltypes = ['west', 'north', 'east', 'south'];
    const [wallIdx, setWallIndex] = useState(0);

    // Get the original dimensions of each wall
    const sizeOf = w => ({
        w: Math.max(...w.surfaceVertices.map(v => v[0])),
        h: Math.max(...w.surfaceVertices.map(v => v[1]))
    });

    const LeftSz  = sizeOf(walls[walltypes[wallIdx]]);
    const frontSz = sizeOf(walls[walltypes[(wallIdx+1)%walltypes.length]]);
    // Apply scaling
    const scaledLeftW = LeftSz.w * SCALE;
    const scaledLeftH = LeftSz.h * SCALE;
    const scaledFrontW = frontSz.w * SCALE;

    // Container dimensions
    const containerWidth  = 1200;
    const containerHeight = 1000;
    // Scene dimensions (left + front)
    const sceneWidth  = scaledLeftW + scaledFrontW;
    const sceneHeight = scaledLeftH;
    // Center the scene
    const originX = (containerWidth  - sceneWidth)  / 2;
    const originY = (containerHeight - sceneHeight) / 10;

    // Calculate floor shift based on current wall dimensions
    const calcFloorShift = (idx) => {
        if (idx % 4 === 0) return scaledFrontW;

        // hacky way to slightly adjust the floor shift based on wall index, using some magic numbers
        if (idx % 4 === 1) return scaledLeftW + 2
        if (idx % 4 === 2) return scaledFrontW + 1
        if (idx % 4 === 3) return scaledLeftW -1
    };
    
    // Initialize floor shift with calculated value
    const [floorShiftX, setFloorShiftX] = useState(scaledLeftW);

    // Arrow navigation handlers
    const handlePrevWall = () => {
        const curIdx = (wallIdx - 1 + walltypes.length) % walltypes.length;
        setWallIndex(curIdx);
        setWatch(curIdx * 90);
        setFloorShiftX(calcFloorShift(curIdx));
    };
    
    const handleNextWall = () => {
        const curIdx = (wallIdx + 1) % walltypes.length;
        setWallIndex(curIdx);
        setWatch(curIdx * 90);
        setFloorShiftX(calcFloorShift(curIdx));
    };

    return (
        
        <div style={{ position: 'relative', width: containerWidth, height: containerHeight }}>
            {/* Navigation arrows */}
            <button 
                onClick={handlePrevWall}
                style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    fontSize: '24px',
                    padding: '10px 15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    border: '1px solid white',
                    borderRadius: '50%',
                    cursor: 'pointer'
                }}
            >
                ←
            </button>
            
            <button 
                onClick={handleNextWall}
                style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    fontSize: '24px',
                    padding: '10px 15px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    border: '1px solid white',
                    borderRadius: '50%',
                    cursor: 'pointer'
                }}
            >
                →
            </button>
            
            {/* West — left wall */}
            <SurfaceSVG
                direction="left"
                wallType = {walltypes[wallIdx%walltypes.length]}
                left={originX} 
                top={originY}
                rot={0}
                skew={THETA}
            />
            {/* North — right wall */}
            <SurfaceSVG
                direction="front"
                wallType={walltypes[(wallIdx+1)%walltypes.length]}
                left={originX + scaledLeftW}
                top={originY}
                rot={0}
                skew={THETA}
            />
            {/* Floor — ground */}
            <SurfaceSVG
                direction="floor"
                wallType="floor"
                left={(originX + floorShiftX)}
                top={(originY + scaledLeftH)}
                theta={THETA}  
                watch={watch}
            />
        </div>
    );
}

export default PerspectiveView;
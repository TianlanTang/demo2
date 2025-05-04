import React, { useState } from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';
import { getDistance } from './tools';

const TileHints = () => {
    const { walls, selectedWall, scale } = useStore(pattern);
    const tileCounts = walls[selectedWall]['tileCounts'];
    const [expandedIndices, setExpandedIndices] = useState({});
    
    // Standard size for the normalized polygons
    const standardSize = 200;
    const svgSize = 200;
    const padding = 20;  // Padding around the normalized polygon
    
    // Function to normalize a polygon to fit within standard size
    const normalizeTile = (tile) => {
        // Get bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        tile.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate scale factor to fit within standard size
        const scaleFactor = Math.min(
            (standardSize - 2 * padding) / width,
            (standardSize - 2 * padding) / height
        );
        
        // Center offset
        const centerX = (svgSize - width * scaleFactor) / 2;
        const centerY = (svgSize - height * scaleFactor) / 2;
        
        // Normalize the tile
        return tile.map(([x, y]) => [
            (x - minX) * scaleFactor + centerX,
            (y - minY) * scaleFactor + centerY
        ]);
    };

    return (
        <div style={{ width: '350px', maxHeight: '600px', overflowY: 'auto', fontSize: '12px' }}>
            <h3>Tiles: {Object.values(tileCounts).reduce((sum, value) => sum + value[0], 0)}</h3>
            <ul>
                {Object.entries(tileCounts)
                .filter(([key, value]) => value[4])   // Skip if tile is not cut
                .map(([key, value], index) => {
                    // Normalize each tile in the group
                    const normalizedTiles = value[1].map(tile => normalizeTile(tile));
                    
                    return (
                        <li key={`complete-${index}`}>
                            <strong>counts: </strong> {value[0]}
                            <br />
                            <strong>edges length: </strong> {value[2]}
                            <br />
                            <strong>Indices: </strong>
                            <span 
                                onClick={() => setExpandedIndices(prev => ({ ...prev, [key]: !prev[key] }))}
                                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                {expandedIndices[key] ? 'Hide Indices' : 'Show Indices'}
                            </span>
                            {expandedIndices[key] && (
                                <div style={{ marginTop: '5px' }}>
                                    {value[3].reduce((acc, curr, i) => {
                                        if (i % 5 === 0 && i !== 0) {
                                            acc.push(<br key={`br-${i}`} />);
                                        }
                                        acc.push(curr);
                                        if (i !== value[3].length - 1) {
                                            acc.push(', ');
                                        }
                                        return acc;
                                    }, [])}
                                </div>
                            )}
                            <svg width={svgSize} height={svgSize} style={{ display: 'block', marginTop: '5px' }}>
                                {normalizedTiles.map((normalizedTile, tileIdx) => {
                                    // Calculate polygon center for text positioning
                                    const centerX = normalizedTile.reduce((sum, [x]) => sum + x, 0) / normalizedTile.length;
                                    const centerY = normalizedTile.reduce((sum, [, y]) => sum + y, 0) / normalizedTile.length;
                                    
                                    return (
                                    <React.Fragment key={`tile-container-${key}-${tileIdx}`}>
                                        <polygon
                                            key={`tile-${key}-${tileIdx}`}
                                            points={normalizedTile.map(([x, y]) => `${x},${y}`).join(' ')}
                                            fill="#2196F3"
                                            stroke="black"
                                            strokeWidth="0.5"
                                        />
                                        {/* Display distance between vertices */}
                                        {normalizedTile.map((vertex, i) => {
                                            const nextIndex = (i + 1) % normalizedTile.length;
                                            const nextVertex = normalizedTile[nextIndex];
                                            const xMid = (vertex[0] + nextVertex[0]) / 2;
                                            const yMid = (vertex[1] + nextVertex[1]) / 2;
                                            
                                            // Calculate direction vector from center to edge midpoint
                                            const dirX = xMid - centerX;
                                            const dirY = yMid - centerY;
                                            
                                            // Normalize and scale for offset
                                            const length = Math.sqrt(dirX * dirX + dirY * dirY);
                                            const offsetX = length > 0 ? (dirX / length) * 10 : 0; // 10px offset
                                            const offsetY = length > 0 ? (dirY / length) * 10 : 0;
                                            
                                            // New text position slightly outside the edge
                                            const textX = xMid + offsetX;
                                            const textY = yMid + offsetY;
                                            
                                            // Use original vertices for distance calculation
                                            const origVertex = value[1][tileIdx][i];
                                            const origNextVertex = value[1][tileIdx][nextIndex];
                                            
                                            return (
                                                <text
                                                    key={`edge-${key}-${tileIdx}-${i}`}
                                                    x={textX}
                                                    y={textY}
                                                    fill="black"
                                                    fontSize="10"
                                                    textAnchor="middle"
                                                    alignmentBaseline="middle"
                                                >
                                                    {getDistance(origVertex, origNextVertex, scale)}
                                                </text>
                                            );
                                        })}
                                    </React.Fragment>
                                )})}
                            </svg>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default TileHints;

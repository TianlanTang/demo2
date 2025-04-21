import React, { useState } from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';

const TileHints = () => {
    const { walls, selectedWall } = useStore(pattern);
    const tileCounts = walls[selectedWall]['tileCounts'];
    const [expandedIndices, setExpandedIndices] = useState({});

    return (
        <div style={{ width: '350px', maxHeight: '600px', overflowY: 'auto', fontSize: '12px' }}>
            <h3>Tiles: {Object.values(tileCounts).reduce((sum, value) => sum + value[0], 0)}</h3>
            <ul>
                {Object.entries(tileCounts).map(([key, value], index) => (
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
                        <svg width="280" height="280" style={{ display: 'block', marginTop: '5px' }}>
                            {value[1].map((tile, tileIdx) => (
                                <polygon
                                    key={`tile-${key}-${tileIdx}`}
                                    points={tile.map(([x, y]) => `${x},${y}`).join(' ')}
                                    fill="#2196F3"
                                    stroke="black"
                                    strokeWidth="0.5"
                                />
                            ))}
                        </svg>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TileHints;

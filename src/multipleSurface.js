import React from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';

const MultipleSurface = () => {
  const { walls, tileColors } = useStore(pattern);
  
  // Scale factor to reduce overall size by 30%
  const scaleFactor = 0.7;

  // Render a single surface with its tiles
  const renderSurface = (wallType) => {
    const wall = walls[wallType];
    if (!wall) return null;

    const { tiles, surfaceVertices, holeVertices } = wall;

    // Calculate SVG dimensions and apply scale factor
    const width = Math.max(...surfaceVertices.map(v => v[0])) * scaleFactor;
    const height = Math.max(...surfaceVertices.map(v => v[1])) * scaleFactor;

    // Determine rotation and translation based on wall type
    let transform = '';
    let svgWidth = width;
    let svgHeight = height;
    
    switch(wallType) {
      case 'east':
        // For east wall, rotate 90° clockwise
        svgWidth = height;
        svgHeight = width;
        transform = `translate(${height}, 0) rotate(90)`;
        break;
      case 'south':
        // For south wall, rotate 180°
        transform = `translate(${width}, ${height}) rotate(180)`;
        break;
      case 'west':
        // For west wall, rotate 90° counterclockwise
        svgWidth = height;
        svgHeight = width;
        transform = `translate(0, ${width}) rotate(-90)`;
        break;
      default:
        // North and floor remain unrotated
        transform = '';
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
          const scaledTile = tile.map(([x, y]) => [x * scaleFactor, y * scaleFactor]);
          
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

    // Scale hole vertices
    const scaledHoleVertices = holeVertices.map(hole => 
      hole.map(([x, y]) => [x * scaleFactor, y * scaleFactor])
    );
    
    // Scale surface vertices
    const scaledSurfaceVertices = surfaceVertices.map(([x, y]) => 
      [x * scaleFactor, y * scaleFactor]
    );

    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{
          border: '1px solid #000',
          boxShadow: '0 0 7px rgba(0,0,0,0.5)', // Reduced shadow size
          maxWidth: '100%',
          height: 'auto',
          margin: '3px' // Reduced margin
        }}
      >
        {/* Apply transformation for orientation */}
        <g transform={transform}>
          {/* Render all tiles */}
          {renderTiles()}
          
          {/* Render holes - using scaled coordinates */}
          {scaledHoleVertices.map((hole, index) => (
            <polygon
              key={`${wallType}-hole-${index}`}
              points={hole.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="white"
              stroke="yellow"
              strokeWidth="0.7" // Reduced stroke width
            />
          ))}
          
          {/* Draw surface outline - using scaled coordinates */}
          <polygon
            points={scaledSurfaceVertices.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none"
            stroke="red"
            strokeWidth="0.7" // Reduced stroke width
          />
        </g>
        
        {/* Label for the surface */}
        <text
          x={7} // Reduced position
          y={14} // Reduced position
          fill="black"
          fontSize="10" // Reduced font size
          fontWeight="bold"
        >
          {wallType.charAt(0).toUpperCase() + wallType.slice(1)}
        </text>
      </svg>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: '7px', // Reduced gap
      padding: '14px' // Reduced padding
    }}>
      {/* North Wall */}
      <div>
        {renderSurface('north')}
      </div>
      
      {/* Middle Row: West, Floor, East */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '7px', // Reduced gap
        alignItems: 'center'
      }}>
        <div>{renderSurface('west')}</div>
        <div>{renderSurface('floor')}</div>
        <div>{renderSurface('east')}</div>
      </div>
      
      {/* South Wall */}
      <div>
        {renderSurface('south')}
      </div>
    </div>
  );
};

export default MultipleSurface;
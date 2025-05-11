import React, { useState } from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';
import { getDistance } from './tools';


const STANDARD_SIZE = 200;   // size of each normalized tile mini‑canvas
const PADDING       = 20;    // internal padding inside each mini‑canvas
const SPACING       = 10;    // gap between mini‑canvases when laid out

const TileHints = () => {

  const { walls, selectedWall, scale, OGroutWidth } = useStore(pattern);
  const tileCounts = walls[selectedWall]['tileCounts'];

  const [expandedIndices, setExpandedIndices] = useState({});

  // normalize a tile, make it looks greater
  const normalizeTile = (tile) => {
    
    let minX =  Infinity, minY =  Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    tile.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    const width  = maxX - minX;
    const height = maxY - minY;

    // scale so that the polygon fits inside STANDARD_SIZE‑PADDING 
    const scaleFactor = Math.min(
      (STANDARD_SIZE - 2 * PADDING) / width,
      (STANDARD_SIZE - 2 * PADDING) / height
    );

    // center the shape inside the mini‑canvas 
    const offsetX = (STANDARD_SIZE - width  * scaleFactor) / 2;
    const offsetY = (STANDARD_SIZE - height * scaleFactor) / 2;

    return tile.map(([x, y]) => [
      (x - minX) * scaleFactor + offsetX,
      (y - minY) * scaleFactor + offsetY
    ]);
  };

  const totalTiles = Object.values(tileCounts).reduce((s, v) => s + v[0], 0);
  const totalCuts  = Object.values(tileCounts).filter(v => v[4])
                                               .reduce((s, v) => s + v[0], 0);

  return (
    <div style={{ width: 350, maxHeight: 600, overflowY: 'auto', fontSize: 12 }}>
      <h3>
        Total Tiles: {totalTiles}<br />
        Cut Tiles: {totalCuts}
      </h3>

      {/* cut tiles */}
      <TileGroup
        tileCounts={tileCounts}
        filterCut={true}
        normalizeTile={normalizeTile}
        expandedIndices={expandedIndices}
        setExpandedIndices={setExpandedIndices}
        scale={scale}
      />

      {/* un‑cut tiles */}
      <h3>
        Tiles under {OGroutWidth} grout width, Total:&nbsp;
        {Object.values(tileCounts).filter(v => !v[4])
                                  .reduce((s, v) => s + v[0], 0)}
      </h3>

      <TileGroup
        tileCounts={tileCounts}
        filterCut={false}
        normalizeTile={normalizeTile}
        expandedIndices={expandedIndices}
        setExpandedIndices={setExpandedIndices}
        scale={scale}
      />
    </div>
  );
};


const TileGroup = ({
  tileCounts,
  filterCut,
  normalizeTile,
  expandedIndices,
  setExpandedIndices,
  scale
}) => {
  return (
    <ul>
      {Object.entries(tileCounts)
        .filter(([_, value]) => filterCut ? value[4] : !value[4])
        .map(([key, value], liIdx) => {
          // value = [count, tiles[], edgeLen, idxList[], isCutBool] 
          const normalizedTiles = value[1].map(normalizeTile);
          const svgWidth  = normalizedTiles.length * (STANDARD_SIZE + SPACING) - SPACING;
          const svgHeight = STANDARD_SIZE;

          return (
            <li key={`li-${liIdx}`} style={{ marginBottom: 10 }}>
              <strong>counts:</strong> {value[0]}<br />
              <strong>edges length:</strong> {value[2]}<br />
              <strong>Indices:</strong>&nbsp;
              <span
                onClick={() => setExpandedIndices(p => ({ ...p, [key]: !p[key] }))}
                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
              >
                {expandedIndices[key] ? 'Hide Indices' : 'Show Indices'}
              </span>

              {expandedIndices[key] && (
                <div style={{ marginTop: 5 }}>
                  {value[3].reduce((acc, curr, idx) => {
                    if (idx % 5 === 0 && idx !== 0) acc.push(<br key={`br-${idx}`} />);
                    acc.push(curr);
                    if (idx !== value[3].length - 1) acc.push(', ');
                    return acc;
                  }, [])}
                </div>
              )}

              {/* SVG: one mini‑canvas per tile, laid out horizontally */}
              <svg
                width={svgWidth}
                height={svgHeight}
                style={{ display: 'block', marginTop: 5 }}
              >
                {normalizedTiles.map((tile, tileIdx) => {
                  // horizontal offset so mini‑canvases do not overlap 
                  const translateX = tileIdx * (STANDARD_SIZE + SPACING);

                  //  centroid for label direction 
                  const centerX = tile.reduce((s, [x]) => s + x, 0) / tile.length;
                  const centerY = tile.reduce((s, [, y]) => s + y, 0) / tile.length;

                  return (
                    <g key={`${key}-${tileIdx}`} transform={`translate(${translateX}, 0)`}>
                      {/* the polygon itself */}
                      <polygon
                        points={tile.map(([x, y]) => `${x},${y}`).join(' ')}
                        fill="#2196F3"
                        stroke="black"
                        strokeWidth={0.5}
                      />

                      {/* edge‑length labels */}
                      {tile.map((vertex, i) => {
                        const nextIdx    = (i + 1) % tile.length;
                        const nextVertex = tile[nextIdx];

                        const xMid = (vertex[0] + nextVertex[0]) / 2;
                        const yMid = (vertex[1] + nextVertex[1]) / 2;

                        // move label slightly outward along the radial direction 
                        const dirX = xMid - centerX;
                        const dirY = yMid - centerY;
                        const len  = Math.hypot(dirX, dirY);
                        const offsetX = len !== 0 ? (dirX / len) * 10 : 0;
                        const offsetY = len !== 0 ? (dirY / len) * 10 : 0;

                        // real‑world distance computed from original vertices 
                        const origV   = value[1][tileIdx][i];
                        const origNxt = value[1][tileIdx][nextIdx];

                        return (
                          <text
                            key={`edge-${tileIdx}-${i}`}
                            x={xMid + offsetX}
                            y={yMid + offsetY}
                            fontSize={10}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                          >
                            {getDistance(origV, origNxt, scale)}
                          </text>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </li>
          );
        })}
    </ul>
  );
};

export default TileHints;

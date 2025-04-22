// MultipleSurface.jsx  — 三个独立 SVG 版
import React from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';

// 透视参数
const SCALE = 0.7;   // 全局缩放
const ROT   = 30;    // 旋转角度
const SKEW  = 30;    // 剪切角度

// 单面 SVG 组件
function SurfaceSVG({ wallType, left, top, rot = 0, skew = 0, _SCALE = SCALE }) {
  const { walls, tileColors } = useStore(pattern);
  const wall = walls?.[wallType];
  if (!wall) return null;

  const { tiles, surfaceVertices } = wall;
  // 计算原始尺寸并应用缩放
  const rawW = Math.max(...surfaceVertices.map(v => v[0]));
  const rawH = Math.max(...surfaceVertices.map(v => v[1]));
  const width  = rawW * _SCALE;
  const height = rawH * _SCALE;

    // Determine rotation and translation based on wall type
    let svgWidth = width;
    let svgHeight = height;
    let transform = `rotate(${rot}deg) skewX(${skew}deg)`
    let transformOrigin = '0 0';

    switch(wallType) {
        case 'east':
            // For east wall, rotate 90° clockwise
            break;
        case 'south':
            // For south wall, rotate 180°
            break;
        case 'west':
            // For west wall, rotate 90° counterclockwise
            break;
        case 'floor':
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
      }}
    >
      {renderTiles()}
    </svg>
  );
}

export default function PerspectiveView() {
  const { walls } = useStore(pattern);
  if (!walls) return <div>Loading walls data...</div>;

  // 取出每面墙的原始尺寸
  const sizeOf = w => ({
    w: Math.max(...w.surfaceVertices.map(v => v[0])),
    h: Math.max(...w.surfaceVertices.map(v => v[1]))
  });
  const westSz  = sizeOf(walls.west);
  const northSz = sizeOf(walls.north);
  const floorSz = sizeOf(walls.floor);

  // 应用缩放
  const scaledWestW = westSz.w * SCALE;
  const scaledWestH = westSz.h * SCALE;
  const scaledNorthW = northSz.w * SCALE;
  const scaledNorthH = northSz.h * SCALE;
  const scaledFloorW = floorSz.w * SCALE;
  const scaledFloorH = floorSz.h * SCALE;

  // 公共原点在容器内的位置
  const originX = 500;
  const originY = 500;

  // 转换角度为弧度
  const rotRad = ROT * Math.PI / 180;
  const skewRad = SKEW * Math.PI / 180;

  // 计算地面四个角落在经过旋转和倾斜后的位置
  // 地面左上角(0,0)在旋转和倾斜变换后仍然是原点(originX, originY)
  // 计算地面左下角(0,h)的位置，这是西面墙的右下角位置
  const floorLeftBottomX = originX + scaledFloorH * Math.sin(rotRad);
  const floorLeftBottomY = originY + scaledNorthH / Math.cos(rotRad) - scaledFloorW * Math.sin(rotRad);
  
  // 计算地面右上角(w,0)的位置，这是北面墙的左下角位置
  const floorRightTopX = originX + scaledFloorW * Math.cos(rotRad);
  const floorRightTopY = originY - scaledFloorW * Math.sin(rotRad);

  return (
    <div style={{ position: 'relative', width: 1900, height: 1700 }}>
      {/* Floor — 地面 */}
      <SurfaceSVG
        wallType="floor"
        left={floorRightTopX}
        top={floorLeftBottomY}
        rot={ROT}
        skew={-SKEW}
      />
      {/* West — 左墙 */}
      {/* <SurfaceSVG
        wallType="west"
        left={originX} 
        top={originY}
        rot={-ROT}
        skew={-SKEW}
      /> */}
      {/* North — 右墙 */}
      <SurfaceSVG
        wallType="north"
        left={floorRightTopX}
        top={floorRightTopY}
        rot={ROT}
        skew={SKEW}
      />
    </div>
  );
}

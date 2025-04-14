import React, { useRef } from 'react';
import { useStore } from 'zustand';
import { pattern } from './pattern';

const TileExample = () => {
  const { tiles, tileColors, patternName } = useStore(pattern);
  const canvasHeight = 600;

  // Get the first group of tiles
  const tileGroup = tiles[0] || [];

  // Calculate bounding box for all tiles in tiles[0]
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  tileGroup.forEach(({ tile }) => {
    tile.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
  });

  const regionWidth = maxX - minX;
  const regionHeight = maxY - minY;
  // Use uniform scale based on the fixed height
  const scale = canvasHeight / regionHeight;
  // Compute svg width to make left/right edges flush
  const canvasWidth = regionWidth * scale;

  // Transform points so that top-left of the bounding box aligns with (0,0)
  const transformPoint = ([x, y]) => [
    (x - minX) * scale,
    (y - minY) * scale,
  ];

  const svgRef = useRef(null);
  const handleExport = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = patternName + ".svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBase64 = "data:image/svg+xml;base64," + window.btoa(svgString);
    
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = patternName + ".png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    };
    img.src = svgBase64;
  };

  return (
    <div>
      <svg ref={svgRef} width={canvasWidth} height={canvasHeight} style={{ border: '0px' }}>
        {tileGroup.map(({ tile }, index) => (
          <polygon
            key={`tile-${index}`}
            points={tile.map(pt => transformPoint(pt).join(',')).join(' ')}
            fill={tileColors[index % tileColors.length] || 'gray'}
            stroke="#000"
            strokeWidth="0.5"
          />
        ))}
      </svg>
      <button onClick={handleExport}>export SVG</button>
      <button onClick={handleExportPng}>expor PNG</button>
    </div>
  );
};

export default TileExample;

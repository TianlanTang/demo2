import ClipperLib from "clipper-lib";

// Use an integer scale factor to minimize floating point errors
const SCALE = 1e4; // Reduced scale to mitigate floating point precision errors

export const calAnchors_clipper = (
    anchor,
    boundingBox,
    patternVertices,
    connection,
    surfaceVertices,
    holeVertices,
    tileVertices,
    scale,
) => {

    if (!anchor || !connection || !surfaceVertices || !boundingBox || !patternVertices || !holeVertices) {
        throw new Error('Missing data');
    }
    console.log("holeVertices: ", holeVertices);
    console.log("surfaceVertices: ", surfaceVertices);    // Convert surface and holes to Clipper format
    const surfacePath = convertPolygon(surfaceVertices);
    const holePaths = holeVertices.map(hole => convertPolygon(hole));
      // 直接计算表面积
    const surfaceArea = Math.abs(ClipperLib.Clipper.Area(surfacePath)) / (SCALE * SCALE);
    console.log("原始表面积:", surfaceArea);
    
    // 计算所有孔洞与表面相交的面积
    let totalIntersectionHoleArea = 0;
    for (const holePath of holePaths) {
        // 计算每个孔洞与表面的交集
        const holeIntersection = clipPolygon(holePath, [surfacePath]);
        
        // 如果有交集，则计算交集面积
        if (holeIntersection && holeIntersection.length > 0) {
            const intersectionArea = areaFromPaths(holeIntersection);
            totalIntersectionHoleArea += intersectionArea;
            console.log("孔洞与表面相交的面积:", intersectionArea);
        } else {
            console.log("孔洞完全在表面外部，没有相交区域");
        }
    }
    console.log("总孔洞相交面积:", totalIntersectionHoleArea);
    
    // 有效表面积 = 表面积 - 孔洞相交面积
    const effectiveSurfaceArea = surfaceArea - totalIntersectionHoleArea;
    console.log("计算的有效表面积:", effectiveSurfaceArea);
    
    // 仍然保留effectiveSurfacePaths用于其他计算
    const effectiveSurfacePaths = computeEffectiveSurfacePaths(surfacePath, holePaths);

    const anchors = [];
    const queue = [[anchor[0], anchor[1]]];
    const visited = new Set();
    visited.add(anchor.toString());

    // calculate the area of the total area covered by the tiles
    let areaCovered = 0;

    const tileCounts = {}; // Dictionary for count tiles
    let globalTileId = 1; // Added auto-increment tile id starting from 1

    while (queue.length > 0) {
        const [ax, ay] = queue.shift();

        // Compute the bounding box of the current grouped shape
        const compositeBBox = boundingBox.map(([dx, dy]) => [ax + dx, ay + dy]);
        const compositePath = convertPolygon(compositeBBox);

        // Use Clipper to calculate intersection with effective surface
        const compositeIntersection = clipPolygon(compositePath, effectiveSurfacePaths);
        const compositeArea = Math.abs(ClipperLib.Clipper.Area(compositePath));
        const intersectionArea = areaFromPaths(compositeIntersection);


        const compositeAllInside = Math.abs(intersectionArea - compositeArea / 10 ** 8) < 1e-5;

        const compositeAllOutside = intersectionArea === 0;

        if (!compositeAllOutside) {
            let compositeTileAnchors = [];
            let localAreaCovered = 0; 
            if (compositeAllInside) {
                // eslint-disable-next-line no-loop-func
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    const tilePath = convertPolygon(tilePoly);
                    const minX = Math.min(...tilePoly.map(([x]) => x));
                    const minY = Math.min(...tilePoly.map(([_, y]) => y));
                    const tileArea = Math.abs(ClipperLib.Clipper.Area(tilePath) / 10 ** 8 );;
                    localAreaCovered += tileArea; // Increment local area covered
                    const tileVertices = [tilePoly.map(([x, y]) => {
                        const alignedPoint = [x - minX, y - minY];
                        const pointPath = convertPolygon([alignedPoint]);
                        const intersection = clipPolygon(pointPath, effectiveSurfacePaths);
                        if (intersection.length > 0) {
                            return intersection[0].map(({ X, Y }) => [X / SCALE, Y / SCALE])[0];
                        }
                        return alignedPoint;
                    })];
                    const tileVerticesKey = tileVertices
                        .map(polygon =>
                        polygon.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]) // Sort within each polygon
                        .map(point => point.map(num => Number(num).toFixed(2))) 
                        )
                        .sort((a, b) => {
                        // Flatten polygons into strings for sorting
                        const aStr = a.flat().toString();
                        const bStr = b.flat().toString();
                        return aStr.localeCompare(bStr);
                        })
                        .flat()
                        .toString();
                    const edgeLengths = tilePoly.map(([x1, y1], i) => {
                        const [x2, y2] = tilePoly[(i + 1) % tilePoly.length];
                        return (Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 ) / 0.2).toFixed(0);
                    }).join(',');
                    const currentId = globalTileId++;
                    if (!tileCounts[tileVerticesKey]) {
                        tileCounts[tileVerticesKey] = [0, tileVertices, edgeLengths, [], false]; // Added array for ids, the last represents the tile is cut or not
                    }
                    tileCounts[tileVerticesKey][0] += 1; // Increment count
                    tileCounts[tileVerticesKey][3].push(currentId); // Append current id to array
                    // Return tile with auto-increment id
                    return { tile: tilePoly, draw: true, id: currentId };
                });
            } else {
                // eslint-disable-next-line no-loop-func
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    const tilePath = convertPolygon(tilePoly);
                    const tileIntersection = clipPolygon(tilePath, effectiveSurfacePaths);
                    const tileIntersectionArea = areaFromPaths(tileIntersection);
                    const tileArea = Math.abs(ClipperLib.Clipper.Area(tilePath));
                    const draw = tileIntersectionArea > 0;
                    const isCut = (tileArea / 10 ** 8 - tileIntersectionArea ) > 1e-5; // Check if the tile is cut
                    if (draw) {
                        const clippedTile = tileIntersection.map(path =>
                            path.map(({ X, Y }) => [X / SCALE, Y / SCALE])
                        );
                        const allPoints = clippedTile.flat();
                        const minX = Math.min(...allPoints.map(([x]) => x));
                        const minY = Math.min(...allPoints.map(([_, y]) => y));
                        const tileVertices = clippedTile.map(tile =>
                            tile.map(([x, y]) => {
                                const alignedPoint = [x - minX, y - minY];
                                const pointPath = convertPolygon([alignedPoint]);
                                const intersection = clipPolygon(pointPath, effectiveSurfacePaths);
                                if (intersection.length > 0) {
                                    return intersection[0].map(({ X, Y }) => [X / SCALE, Y / SCALE])[0];
                                }
                                return alignedPoint;
                            })
                        );
                        const tileVerticesKey = tileVertices
                            .map(polygon =>
                            polygon.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
                            .map(point => point.map(num => Number(num).toFixed(2))) 
                            // Sort within each polygon
                            )
                            .sort((a, b) => {
                            // Flatten polygons into strings for sorting
                            const aStr = a.flat().toString();
                            const bStr = b.flat().toString();
                            return aStr.localeCompare(bStr);
                            })
                            .flat()
                            .toString();                        
                        const intersectEdgeLengths = clippedTile
                            .flatMap(tile => 
                                tile.map(([x1, y1], i) => {
                                    const [x2, y2] = tile[(i + 1) % tile.length];
                                    return (Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 0.2).toFixed(0);
                                })
                            )
                            .join(',');
                        const currentId = globalTileId++;
                        if (!tileCounts[tileVerticesKey]) {
                            tileCounts[tileVerticesKey] = [0, tileVertices, intersectEdgeLengths, [], isCut]; // Added array for ids
                        }
                        tileCounts[tileVerticesKey][0] += 1;
                        tileCounts[tileVerticesKey][3].push(currentId);
                        localAreaCovered += tileIntersectionArea;
                        // Return with id if draw is true
                        return { tile: tilePoly, draw, id: currentId };
                    }
                    return { tile: tilePoly, draw };
                });
            }
            areaCovered += localAreaCovered; 
            if (compositeTileAnchors.some(item => item.draw)) {
                anchors.push(compositeTileAnchors);
            }
        }

        // BFS: Explore adjacent grouped shapes
        for (const [dx, dy] of connection) {
            const [nx, ny] = [ax + dx, ay + dy];
            // Changed key generation to use integer coordinates from the integer scale
            const key = [Math.round(nx * SCALE), Math.round(ny * SCALE)].toString();
            if (visited.has(key)) continue;

            const nextBoundingBox = boundingBox.map(([dx, dy]) => [nx + dx, ny + dy]);
            const nextPath = convertPolygon(nextBoundingBox);
            const nextIntersection = clipPolygon(nextPath, [surfacePath]);
            const nextArea = areaFromPaths(nextIntersection);

            // Ensure BFS continues if the anchor is within the surface
            if (nextArea > 0) {
                queue.push([nx, ny]);
            }
            visited.add(key);
        }
    }

    // Convert pixel area to real-world area in square meters
    const realAreaCovered = Number((areaCovered / (scale * scale) / 1000000).toFixed(2)); 
    const realEffectiveSurfaceArea = Number((effectiveSurfaceArea / (scale * scale) / 1000000).toFixed(2));
    
    console.log("areaCovered:", areaCovered);
    console.log("EffectiveSurfaceArea:", effectiveSurfaceArea);

    return {
        anchors, 
        tileAreaCovered: realAreaCovered, 
        effectiveSurfaceArea: realEffectiveSurfaceArea, 
        tileCounts
    };
};

// Convert a 2D point array [[x, y], ...] to Clipper format using integer scaling
const convertPolygon = (polygon) => {
    return polygon.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) }));
};

// Compute the effective surface by subtracting holes from the outer boundary
const computeEffectiveSurfacePaths = (outerPath, holePaths) => {
    const cpr = new ClipperLib.Clipper();
    cpr.AddPath(outerPath, ClipperLib.PolyType.ptSubject, true);
    cpr.AddPaths(holePaths, ClipperLib.PolyType.ptClip, true);
    const solution = new ClipperLib.Paths();
    cpr.Execute(
        ClipperLib.ClipType.ctDifference,
        solution,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero
    );
    return solution;
};

// Use Clipper to calculate the intersection of a subject polygon with clip paths
const clipPolygon = (subject, clipPaths) => {
    const cpr = new ClipperLib.Clipper();
    cpr.AddPath(subject, ClipperLib.PolyType.ptSubject, true);
    cpr.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, true);
    const solution = new ClipperLib.Paths();
    cpr.Execute(
        ClipperLib.ClipType.ctIntersection,
        solution,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero
    );
    return solution;
};

// Calculate the total area of Clipper paths
const areaFromPaths = (paths) => {
    let total = 0;
    for (const path of paths) {
        total += Math.abs(ClipperLib.Clipper.Area(path));
    }
    return total / (SCALE * SCALE);
};


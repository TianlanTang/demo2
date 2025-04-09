import ClipperLib from "clipper-lib";

export const calAnchors_clipper = (
    anchor,
    boundingBox,
    patternVertices,
    connection,
    surfaceVertices,
    holeVertices,
    tileVertices
) => {
    console.log("Start calculating Anchors");

    if (!anchor || !connection || !surfaceVertices || !boundingBox || !patternVertices || !holeVertices) {
        throw new Error('Missing data');
    }

    // Ensure all vertices are rounded to 4 decimal places
    const round = (num) => Number(num.toFixed(4));

    // Convert surface and holes to Clipper format
    const surfacePath = convertPolygon(surfaceVertices);
    const holePaths = holeVertices.map(hole => convertPolygon(hole));
    const effectiveSurfacePaths = computeEffectiveSurfacePaths(surfacePath, holePaths);
    const effectiveSurfaceArea = areaFromPaths(effectiveSurfacePaths); // Calculate effective surface area

    const anchors = [];
    const queue = [[anchor[0], anchor[1]]];
    const visited = new Set();
    visited.add(anchor.toString());

    // calculate the area of the total area covered by the tiles
    let areaCovered = 0;

    const tileCounts = {}; // Dictionary for count tiles

    let count = 0;
    while (queue.length > 0) {
        count++;
        const [ax, ay] = queue.shift();

        // Compute the bounding box of the current grouped shape
        const compositeBBox = boundingBox.map(([dx, dy]) => [ax + dx, ay + dy]);
        const compositePath = convertPolygon(compositeBBox);

        // Use Clipper to calculate intersection with effective surface
        const compositeIntersection = clipPolygon(compositePath, effectiveSurfacePaths);
        const compositeArea = Math.abs(ClipperLib.Clipper.Area(compositePath));
        const intersectionArea = areaFromPaths(compositeIntersection);

        const compositeAllInside = Math.abs(intersectionArea - compositeArea) < 1e-5;
        const compositeAllOutside = intersectionArea === 0;

        if (!compositeAllOutside) {
            let compositeTileAnchors = [];
            let localAreaCovered = 0; 
            if (compositeAllInside) {
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    const edgeLengthsKey = tilePoly.map(([x1, y1], i) => {
                        const [x2, y2] = tilePoly[(i + 1) % tilePoly.length];
                        return (Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 0.2).toFixed(0);
                    }).join(',');
                    tileCounts[edgeLengthsKey] = tileCounts[edgeLengthsKey] || [0, null];
                    tileCounts[edgeLengthsKey][0] += 1; // Increment count
                    if (tileCounts[edgeLengthsKey][1] === null) {
                        const minX = Math.min(...tilePoly.map(([x]) => x));
                        const minY = Math.min(...tilePoly.map(([_, y]) => y));
                        // Wrap the vertex array in an array
                        tileCounts[edgeLengthsKey][1] = [ tilePoly.map(([x, y]) => {
                            const alignedPoint = [x - minX, y - minY]; // Align by subtracting min values
                            const pointPath = convertPolygon([alignedPoint]);
                            const intersection = clipPolygon(pointPath, effectiveSurfacePaths);
                            if (intersection.length > 0) {
                                return intersection[0].map(({ X, Y }) => [Number(X), Number(Y)])[0]; // Use intersection point
                            }
                            return alignedPoint; // Use aligned point if no intersection
                        }) ];
                    }
                    return { tile: tilePoly, draw: true };
                });
            } else {
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    const tilePath = convertPolygon(tilePoly);
                    const tileIntersection = clipPolygon(tilePath, effectiveSurfacePaths);
                    const tileIntersectionArea = areaFromPaths(tileIntersection);
                    const draw = tileIntersectionArea > 0;
                    if (draw) {
                        const clippedTile = tileIntersection.map(path =>
                            path.map(({ X, Y }) => [Number(X), Number(Y)]) // Ensure numeric values
                        );
                        const intersectEdgeLengthsKey = clippedTile
                            .flatMap(tile => // Flatten the paths to handle multiple polygons
                                tile.map(([x1, y1], i) => {
                                    const [x2, y2] = tile[(i + 1) % tile.length];
                                    return (Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 0.2).toFixed(0);
                                })
                            )
                            .join(',');
                        tileCounts[intersectEdgeLengthsKey] = tileCounts[intersectEdgeLengthsKey] || [0, null];
                        tileCounts[intersectEdgeLengthsKey][0] += 1; // Increment count
                        if (tileCounts[intersectEdgeLengthsKey][1] === null) {
                            const allPoints = clippedTile.flat(); // Flatten all points from clippedTile
                            const minX = Math.min(...allPoints.map(([x]) => x));
                            const minY = Math.min(...allPoints.map(([_, y]) => y));
                            // Store separated vertex arrays for each continuous polygon
                            tileCounts[intersectEdgeLengthsKey][1] = clippedTile.map(tile =>
                                tile.map(([x, y]) => {
                                    const alignedPoint = [x - minX, y - minY]; // Align by subtracting min values
                                    const pointPath = convertPolygon([alignedPoint]);
                                    const intersection = clipPolygon(pointPath, effectiveSurfacePaths);
                                    if (intersection.length > 0) {
                                        return intersection[0].map(({ X, Y }) => [Number(X), Number(Y)])[0]; // Use intersection point
                                    }
                                    return alignedPoint; // Use aligned point if no intersection
                                })
                            );
                        }
                        localAreaCovered += tileIntersectionArea;
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
            const key = [round(nx), round(ny)].toString();
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
    console.log(`Processed ${count} anchors`);
    return {anchors, areaCovered, effectiveSurfaceArea, tileCounts}; // Include dictionaries in the result
};

// Convert a 2D point array [[x, y], ...] to Clipper format [{X, Y}, ...]
const convertPolygon = (polygon) => {
    return polygon.map(([x, y]) => ({ X: x, Y: y }));
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
    return total;
};

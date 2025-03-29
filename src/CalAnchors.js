export const calAnchors = (
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

    const anchors = []; // Store grouped shapes, each containing all tiles with a draw flag

    // BFS to generate grouped shape anchors
    const queue = [[anchor[0], anchor[1]]];
    const visited = new Set();
    visited.add(anchor.toString());
    while (queue.length > 0) {
        const [ax, ay] = queue.shift();

        // Compute the bounding box of the current grouped shape
        const compositeBBox = boundingBox.map(([dx, dy]) => [ax + dx, ay + dy]);

        const compositeAllInside = compositeBBox.every(pt =>
            isPointInSurface(pt, surfaceVertices, holeVertices)
        );
        // If a vertex is inside a hole or on the edge of a hole, it is not considered "completely outside"
        const compositeAllOutside = compositeBBox.every(pt => {
            const inSurface = isPointInsidePolygon(pt, surfaceVertices) || isPointOnPolygonEdge(pt, surfaceVertices);
            const inHole = isPointInHole(pt, holeVertices);
        
            // Check if all points are either inside a hole or outside/on the boundary
            return !(inSurface || inHole);  // If a point is neither in the surface nor in the hole, return false
        });
        

        // Only consider adding if part of the grouped shape is inside the surface
        if (!compositeAllOutside) {
            let compositeTileAnchors = []; // Store information for each tile in the current group

            if (compositeAllInside) {
                // If the entire bounding box is inside the surface, all tiles are drawable
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    return { tile: tilePoly, draw: true };
                });
            } else {
                // If part of the bounding box is inside the surface, check each tile individually
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    const draw = isPolygonInside(tilePoly, surfaceVertices, holeVertices);
                    return { tile: tilePoly, draw };
                });
            }
            // Add the current group only if at least one tile is drawable
            if (compositeTileAnchors.some(item => item.draw)) {
                anchors.push(compositeTileAnchors);
            }
        }

        // BFS: Explore adjacent grouped shapes
        for (const [dx, dy] of connection) {
            const [nx, ny] = [ax + dx, ay + dy];
            const key = [nx, ny].toString();
            if (visited.has(key)) continue;
            // Check if the next group is partially or completely inside the surface, or on the edge
            const nextBoundingBox = boundingBox.map(([dx, dy]) => [nx + dx, ny + dy]);
            
            // Determine whether to skip based on whether all points are outside the surface and not on the edge
            const isNextGroupOutsideSurface = nextBoundingBox.every(pt => {
                const inSurface = isPointInsidePolygon(pt, surfaceVertices) || isPointOnPolygonEdge(pt, surfaceVertices);
                return !inSurface; // If a point is neither inside the surface nor on the edge, it is considered outside
            });

            // Skip adding to the queue if all points are completely outside the surface
            if (!isNextGroupOutsideSurface) {
                queue.push([nx, ny]);
            }
            visited.add(key);
        }
    }
    return anchors;
};

// Helper function: Check if a point is inside a polygon (Ray-casting algorithm)
const isPointInsidePolygon = (point, vertices) => {
    const [px, py] = point;
    let inside = false;
    let j = vertices.length - 1;
    for (let i = 0; i < vertices.length; i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];

        // If the point is exactly on the edge, it is not considered inside (surface allows edge points, but holes do not)
        const crossProduct = (py - yi) * (xj - xi) - (px - xi) * (yj - yi);
        if (crossProduct === 0) {
            if (
                Math.min(xi, xj) <= px && px <= Math.max(xi, xj) &&
                Math.min(yi, yj) <= py && py <= Math.max(yi, yj)
            ) {
                return false;
            }
        }

        const intersect = (yi > py) !== (yj > py) &&
            px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
        j = i;
    }
    return inside;
};

// Helper function: Check if a point is on the edge of a polygon
const isPointOnPolygonEdge = (point, vertices) => {
    const [px, py] = point;
    let j = vertices.length - 1;
    for (let i = 0; i < vertices.length; i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];
        const crossProduct = (py - yi) * (xj - xi) - (px - xi) * (yj - yi);
        // Use a small tolerance to handle floating-point precision issues
        if (Math.abs(crossProduct) < 1e-10) {
            if (
                px >= Math.min(xi, xj) && px <= Math.max(xi, xj) &&
                py >= Math.min(yi, yj) && py <= Math.max(yi, yj)
            ) {
                return true;
            }
        }
        j = i;
    }
    return false;
};

const isPointInSurface = (point, surfaceVertices, holeVertices) => {
    // Check if the point is inside the outer boundary (allow edge points)
    const inSurface = isPointInsidePolygon(point, surfaceVertices) || isPointOnPolygonEdge(point, surfaceVertices);
    if (!inSurface) return false;
    // For each hole, if the point is strictly inside or on the edge, it is excluded from the surface
    for (const hole of holeVertices) {
        if (isPointInsidePolygon(point, hole) || isPointOnPolygonEdge(point, hole)) {
            return false;
        }
    }
    return true;
};

// Helper function: Check if a point is inside any hole or on the edge of a hole
const isPointInHole = (point, holeVertices) => {
    for (const hole of holeVertices) {
        if (isPointInsidePolygon(point, hole) || isPointOnPolygonEdge(point, hole)) {
            return true;
        }
    }
    return false;
};

// Check the containment status of a polygon (tile)
// Logic: If all vertices are inside the surface, return true; if all are outside, return false; otherwise, check boundary intersections
const isPolygonInside = (polygon, surfaceVertices, holeVertices) => {
    // Additional check: If no vertices are strictly inside the surface, but some are on the edge, the tile is not considered inside
    const strictInsideCount = polygon.filter(pt => isPointInsidePolygon(pt, surfaceVertices)).length;
    const onEdgeCount = polygon.filter(pt => !isPointInsidePolygon(pt, surfaceVertices) && isPointOnPolygonEdge(pt, surfaceVertices)).length;
    if (strictInsideCount === 0 && onEdgeCount > 0) return false;

    let inSurfaceCount = 0;
    let inHoleCounts = new Map(); // Record the number of points in different holes

    for (const pt of polygon) {
        if (isPointInSurface(pt, surfaceVertices, holeVertices)) {
            inSurfaceCount++;
        } else {
            for (let i = 0; i < holeVertices.length; i++) {
                if (isPointInsidePolygon(pt, holeVertices[i]) || isPointOnPolygonEdge(pt, holeVertices[i])) {
                    inHoleCounts.set(i, (inHoleCounts.get(i) || 0) + 1);
                    break;
                }
            }
        }
    }

    // If all vertices are inside the surface, return true
    if (inSurfaceCount === polygon.length) return true;
    
    // If all vertices are inside a single hole, return false
    if (inHoleCounts.size === 1 && inSurfaceCount === 0) return false;

    // If tile vertices are distributed across multiple holes, return true
    if (inHoleCounts.size > 1) return true;

    // If tile vertices are partially in a hole and partially outside the surface, return true
    if (inHoleCounts.size > 0 && inSurfaceCount === 0) return true;

    // Construct tile edges
    const polyEdges = polygon.map((pt, idx, arr) => [pt, arr[(idx + 1) % arr.length]]);
    // Construct surface (including holes) edges
    const surfaceEdges = [
        ...surfaceVertices.map((pt, idx, arr) => [pt, arr[(idx + 1) % arr.length]]),
        ...holeVertices.flatMap(hole =>
            hole.map((pt, idx, arr) => [pt, arr[(idx + 1) % arr.length]])
        )
    ];

    const crossProduct = (a, b, c) =>
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const isPointOnSegment = (a, b, p) =>
        p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]) &&
        p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
    const doLinesIntersect = (p1, p2, p3, p4) => {
        const d1 = crossProduct(p1, p2, p3);
        const d2 = crossProduct(p1, p2, p4);
        const d3 = crossProduct(p3, p4, p1);
        const d4 = crossProduct(p3, p4, p2);
        if (d1 * d2 < 0 && d3 * d4 < 0) return true;
        if (d1 === 0 && isPointOnSegment(p1, p2, p3)) return true;
        if (d2 === 0 && isPointOnSegment(p1, p2, p4)) return true;
        if (d3 === 0 && isPointOnSegment(p3, p4, p1)) return true;
        if (d4 === 0 && isPointOnSegment(p3, p4, p2)) return true;
        return false;
    };

    return surfaceEdges.some(sEdge =>
        polyEdges.some(pEdge => doLinesIntersect(sEdge[0], sEdge[1], pEdge[0], pEdge[1]))
    );
};
export const calAnchors = (        
        anchor,
        boundingBox,
        patternVertices,
        connection,
        surfaceVertices,
        holeVertices,
    ) => { 
    console.log("Start to cal Anchors");

    if (!anchor || !connection || !surfaceVertices || !boundingBox || !patternVertices || !holeVertices) {
        throw new Error('Missing data');
    }

    // calculate anchors
    const anchors = [];

    // BFS to find all anchors
    const queue = [[anchor[0], anchor[1]]];
    const visited = new Set();
    visited.add(anchor.toString());
    while (queue.length > 0) {
        const [x, y] = queue.shift();
        anchors.push([x, y]);
        for (const [dx, dy] of connection) {
            const [nx, ny] = [x + dx, y + dy];
            if (visited.has([nx, ny].toString())) {
                continue;
            }
            if (isValid(nx, ny, boundingBox, patternVertices, surfaceVertices, holeVertices)) {
                queue.push([nx, ny]);
            }
            visited.add([nx, ny].toString());
        }
    }
    return anchors;
}



const isValid = (x, y, boundingBox, patternVertices, surfaceVertices, holeVertices) => {
    // x, y: anchor point for this tile
    const _boundingBoxVertices = boundingBox.map(([dx, dy]) => [x + dx, y + dy]);
    const _patternVertices = patternVertices.map(([dx, dy]) => [x + dx, y + dy]);

    // Function to check if a point is inside the polygon
    const isPointInsidePolygon = (point, vertices) => {
        const [px, py] = point;
        let inside = false;
        let j = vertices.length - 1;
        for (let i = 0; i < vertices.length; i++) {
            const [xi, yi] = vertices[i];
            const [xj, yj] = vertices[j];

            // check if the point is on the edge of the polygon
            const crossProduct = (py - yi) * (xj - xi) - (px - xi) * (yj - yi);
            if (crossProduct === 0) {
                if (
                    Math.min(xi, xj) <= px && px <= Math.max(xi, xj) &&
                    Math.min(yi, yj) <= py && py <= Math.max(yi, yj)
                ) {
                    return false;  
                }
            }

            const intersect = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
            j = i;
        }
        return inside;
    };

    // function to check if a point is inside the surface
    const isPointInside = (point) => isPointInsidePolygon(point, surfaceVertices);

    // function to check if a point is inside the surface and not inside any hole
    const isPointInSurface = (point) => {
        if (!isPointInside(point)) return false;

        for (const hole of holeVertices) {
            if (isPointInside(point, hole)) {
                return false; 
            }
        }
        return true; 
    };

    // cal cross product 
    const crossProduct = (x1, y1, x2, y2, x3, y3) => {
        return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    };

    // determine if a point is on a line segment
    const isPointOnSegment = ([x1, y1], [x2, y2], [px, py]) => {
        return (px >= Math.min(x1, x2) && px <= Math.max(x1, x2) && py >= Math.min(y1, y2) && py <= Math.max(y1, y2));
    };

    // tool function, check if two line segments intersect, using cross product
    const doLinesIntersect = ([x1, y1], [x2, y2], [x3, y3], [x4, y4]) => {
        const dir1 = crossProduct(x1, y1, x2, y2, x3, y3); 
        const dir2 = crossProduct(x1, y1, x2, y2, x4, y4); 
        const dir3 = crossProduct(x3, y3, x4, y4, x1, y1); 
        const dir4 = crossProduct(x3, y3, x4, y4, x2, y2); 

        // if two lines are colinear, we see them as not intersecting
        if (dir1 === 0 && dir2 === 0 && dir3 === 0 && dir4 === 0) {
            return false;
        }
        
        // if two points are at different sides of the other line
        // and vice versa
        // then these two lines intersect
        if (dir1 * dir2 < 0 && dir3 * dir4 < 0) {
            return true; 
        }
        
        // check if any of the two points of one line segment is on the other line segment
        if (dir1 === 0 && isPointOnSegment([x1, y1], [x2, y2], [x3, y3])) return true;
        if (dir2 === 0 && isPointOnSegment([x1, y1], [x2, y2], [x4, y4])) return true;
        if (dir3 === 0 && isPointOnSegment([x3, y3], [x4, y4], [x1, y1])) return true;
        if (dir4 === 0 && isPointOnSegment([x3, y3], [x4, y4], [x2, y2])) return true;
        
        return false;
    };

    const allBoundingBoxInside = _boundingBoxVertices.every(vertex => isPointInSurface(vertex));
    if (allBoundingBoxInside) return true;

    // check if the vertices of bounding box are all outside the surface, return False 
    const allBoundingBoxOutside = _boundingBoxVertices.every(vertex => !isPointInSurface(vertex));
    if (allBoundingBoxOutside) return false;

    // check if any vertex of pattern is inside the surface, return True
    const anyPatternInside = _patternVertices.some(vertex => isPointInSurface(vertex));
    if (anyPatternInside) return true;

    // check if each edge of pattern intersects with the surface, return True
    const patternEdges = _patternVertices.map((_, idx, arr) => [arr[idx], arr[(idx + 1) % arr.length]]);
    const surfaceEdges = [
        ...surfaceVertices.map((_, idx, arr) => [arr[idx], arr[(idx + 1) % arr.length]]),
        ...holeVertices.flatMap(hole => hole.map((_, idx, arr) => [arr[idx], arr[(idx + 1) % arr.length]]))
      ];

    const edgesIntersect = surfaceEdges.some(surfaceEdge => 
        patternEdges.some(patternEdge => 
            doLinesIntersect(...surfaceEdge, ...patternEdge)
        )
    );
    
    if (edgesIntersect) return true;

    return false;

}



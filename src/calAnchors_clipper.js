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

    const anchors = [];
    const queue = [[anchor[0], anchor[1]]];
    const visited = new Set();
    visited.add(anchor.toString());

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
            if (compositeAllInside) {
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    return { tile: tilePoly, draw: true };
                });
            } else {
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    const tilePath = convertPolygon(tilePoly);
                    const tileIntersection = clipPolygon(tilePath, effectiveSurfacePaths);
                    const tileIntersectionArea = areaFromPaths(tileIntersection);
                    const draw = tileIntersectionArea > 0;
                    return { tile: tilePoly, draw };
                });
            }
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
    return anchors;
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

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

    const anchors = []; // 存储分组后的 shape，每个 shape 包含所有 tile 及其绘制标识

    // BFS 遍历生成 grouped shape anchors
    const queue = [[anchor[0], anchor[1]]];
    const visited = new Set();
    visited.add(anchor.toString());
    while (queue.length > 0) {
        const [ax, ay] = queue.shift();

        // 计算当前分组 shape 的 bounding box
        const compositeBBox = boundingBox.map(([dx, dy]) => [ax + dx, ay + dy]);

        const compositeAllInside = compositeBBox.every(pt =>
            isPointInSurface(pt, surfaceVertices, holeVertices)
        );
        // 修改处：如果某顶点落在 hole 内或在 hole 边上，则不计入“完全在外”
        const compositeAllOutside = compositeBBox.every(pt => {
            const inSurface = isPointInsidePolygon(pt, surfaceVertices) || isPointOnPolygonEdge(pt, surfaceVertices);
            const inHole = isPointInHole(pt, holeVertices);
            return (!inSurface && !inHole);
        });

        // 仅当分组 shape 部分在 surface 内时考虑加入
        if (!compositeAllOutside) {
            let compositeTileAnchors = []; // 存储当前组内每个 tile 的信息

            if (compositeAllInside) {
                // 如果整个 bounding box 都在 surface 内，则所有 tile 均可绘制
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    return { tile: tilePoly, draw: true };
                });
            } else {
                // 如果部分在 surface 内，逐个 tile 检查
                compositeTileAnchors = tileVertices.map(tile => {
                    const tilePoly = tile.map(([dx, dy]) => [ax + dx, ay + dy]);
                    const draw = isPolygonInside(tilePoly, surfaceVertices, holeVertices);
                    return { tile: tilePoly, draw };
                });
            }
            // 仅当至少有一个 tile 可绘制时，加入当前分组
            if (compositeTileAnchors.some(item => item.draw)) {
                anchors.push(compositeTileAnchors);
            }
        }

        // BFS：探索相邻的 grouped shape
        for (const [dx, dy] of connection) {
            const [nx, ny] = [ax + dx, ay + dy];
            const key = [nx, ny].toString();
            if (visited.has(key)) continue;
            // 利用 boundingBox 检查下一个分组是否部分在 surface 内
            if (isPolygonInside(boundingBox.map(([dx, dy]) => [nx + dx, ny + dy]), surfaceVertices, holeVertices)) {
                queue.push([nx, ny]);
            }
            visited.add(key);
        }
    }
    return anchors;
};

// 辅助函数：检测点是否在多边形内部（射线法）
const isPointInsidePolygon = (point, vertices) => {
    const [px, py] = point;
    let inside = false;
    let j = vertices.length - 1;
    for (let i = 0; i < vertices.length; i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];

        // 如果点正好在边上，此处不认为在内部（surface中允许边上点，但不允许hole边上点）
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

// 新增辅助函数：检测点是否落在多边形的边上
const isPointOnPolygonEdge = (point, vertices) => {
    const [px, py] = point;
    let j = vertices.length - 1;
    for (let i = 0; i < vertices.length; i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];
        const crossProduct = (py - yi) * (xj - xi) - (px - xi) * (yj - yi);
        // 使用一个很小的容差判断是否接近于0
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
    // 判断点是否在外部轮廓内（允许边上）
    const inSurface = isPointInsidePolygon(point, surfaceVertices) || isPointOnPolygonEdge(point, surfaceVertices);
    if (!inSurface) return false;
    // 对于每个洞，如果点严格在洞内部或落在洞边上，则视为“被洞排除”
    for (const hole of holeVertices) {
        if (isPointInsidePolygon(point, hole) || isPointOnPolygonEdge(point, hole)) {
            return false;
        }
    }
    return true;
};

// 新增辅助函数：检测点是否在任意洞内或落在洞边上
const isPointInHole = (point, holeVertices) => {
    for (const hole of holeVertices) {
        if (isPointInsidePolygon(point, hole) || isPointOnPolygonEdge(point, hole)) {
            return true;
        }
    }
    return false;
};

// 检查多边形（tile）的包含状态
// 逻辑：如果所有顶点都在 surface 内，则返回 true；如果所有都在外，则返回 false；否则，检查边界相交情况
const isPolygonInside = (polygon, surfaceVertices, holeVertices) => {
    // 新增判断：如果所有顶点都没有严格在 surface 内，且有顶点仅在边上，则认为 tile 不在 surface 内
    const strictInsideCount = polygon.filter(pt => isPointInsidePolygon(pt, surfaceVertices)).length;
    const onEdgeCount = polygon.filter(pt => !isPointInsidePolygon(pt, surfaceVertices) && isPointOnPolygonEdge(pt, surfaceVertices)).length;
    if (strictInsideCount === 0 && onEdgeCount > 0) return false;

    let inSurfaceCount = 0;
    let inHoleCounts = new Map(); // 记录不同 hole 的点数量

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

    // 若所有顶点都在 surface 内，返回 true
    if (inSurfaceCount === polygon.length) return true;
    
    // 若所有顶点都在 hole 内（但不跨 hole），返回 false
    if (inHoleCounts.size === 1 && inSurfaceCount === 0) return false;

    // 若 tile 顶点分布在多个不同的 holes 内，返回 true
    if (inHoleCounts.size > 1) return true;

    // 若 tile 顶点部分在 hole 里，部分在 surface 外，返回 true
    if (inHoleCounts.size > 0 && inSurfaceCount === 0) return true;

    // 构造 tile 的边
    const polyEdges = polygon.map((pt, idx, arr) => [pt, arr[(idx + 1) % arr.length]]);
    // 构造 surface（包括 hole）的边
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

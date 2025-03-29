import { calAnchors } from './calAnchors';

export const calQuads = (
    tileVertices, 
    anchor, 
    boundingBox,
    patternVertices,
    connection,
    surfaceVertices,
    holeVertices,
) => {
        console.log("Start to cal Quads");
        const anchors = calAnchors(
            anchor,
            boundingBox,
            patternVertices,
            connection,
            surfaceVertices,
            holeVertices,
        );

        const res = anchors.map(anchor => 
            tileVertices.map(tile => 
                tile.map(([dx, dy]) => [anchor[0] + dx, anchor[1] + dy])
        ));
        
        return res
};


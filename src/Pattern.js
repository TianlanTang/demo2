import {create} from 'zustand';

// load patterns from json
const constloadPattern = async () => {
    try {
        const response = await fetch("/TilePatterns.json");
        const data = await response.json();
        return data.patterns;
    } catch (error) {
        console.error("Error loading patterns", error);
        return [];
    }
};

// load minimum tile length from json
const loadMinimumTileLength = async () => {
    try {
        const response = await fetch("/oneTilePatterns.json");
        const data = await response.json();
        return data.minimumTileLength;
    } catch (error) {
        console.error("Error loading minimum tile length", error);
        return 0;
    }
};

export const pattern = create((set, get) => ({

    // anchor point of the pattern, 1x2, depends on the layout
    anchor: [0, 0],

    // grout widtn range
    groutRange: [],

    // base size of the pattern
    minimumTileLength: 50,

    // grout width
    groutWidth: 0,

    // vertices of the outline of the pattern, mx2
    vertices: [],

    // bounding box vertices, 4x2
    boundingBox: [],

    // shift of all vertices of separate tiles nx4x2
    shift: [],

    // tileProportion of the pattern related to the smallest size, nx2
    tileProportion: [],

    // set anchor point
    setAnchor: (anchor) => get().anchor = anchor,

    // add vertices
    addVertices: (vertex) => {
        get().vertices.push(vertex);
    },

    // add bounding box
    addBoundingBox: (box) => {
        get().boundingBox.push(box);
    },

    // add shift
    addShift: (shift) => {
        get().shift.push(shift);  
    },

    // add tileProportion
    addtileProportion: (tileProportion) => {
        get().tileProportion.push(tileProportion);
    },
}));
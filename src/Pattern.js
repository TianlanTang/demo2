import {create} from 'zustand';

// load patterns from json
const loadPattern = async () => {
    try {
        const response = await fetch("/TilePatterns.json");
        const data = await response.json();
        return data.patterns;
    } catch (error) {
        console.error("Error loading patterns", error);
        return [];
    }
};

// Load scale  from json
const loadScale = async () => {
    try {
        const response = await fetch("/TilePatterns.json");
        const data = await response.json();
        return data.scale;
    } catch (error) {
        console.error("Error loading scale factors", error);
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

// tool function
const updateTransformedVertices = (key, vertices, x, y, minimumTileLength, tileProportion, groutWidth, scale) => {
    const transformed = vertices.map(vertex => [
        (x + vertex[0] * minimumTileLength * tileProportion[0] / tileProportion[1] + groutWidth * vertex[3]) * scale,
        (y + vertex[1] * minimumTileLength * tileProportion[0] / tileProportion[1] + groutWidth * vertex[2]) * scale
    ]);
    
    set({ [key]: [...get()[key], ...transformed] });
};


export const pattern = create((set, get) => ({

    // sacle the original size to pixel size
    scale: 0.2,

    // anchor point of the pattern, 1x2, depends on the layout
    anchor: [0, 0],

    // grout widtn range
    groutRange: [],

    // base size of the pattern
    minimumTileLength: 50,

    // grout width
    groutWidth: 0,

    // vertices of the outline of the pattern, mx2
    patternVertices: [],

    // bounding box vertices, 4x2
    boundingBox: [],

    // shift of all vertices of separate tiles nx4x2
    tileVertices: [],

    // connection shift of four direction, 4 * x
    connection: [],

    // init
    init: async (patternName, proportionIndex) => {

        // load parameters
        const {
            scale,
            anchor,
            minimumTileLength,
            groutWidth,
        } = get()

        // anchor point
        [x, y] = anchor;

        // load patterns
        const patterns = await loadPattern();
        const pattern = patterns.find(p => p.name === patternName);

        if (!pattern) {
            console.error("Pattern not found", patternName);
            return;
        }

        // load proportion
        const tileProportion = pattern.tileProportion[Number(proportionIndex)];
        if (!tileProportion) {
            console.error("proportion not found", tileProportion);
            return;
        }

        // set patternVertices
        updateTransformedVertices(
            'patternVertices',
            pattern.patternVertices,
            x, y, minimumTileLength, tileProportion, groutWidth, scale
        );
        
        // set bounding box
        updateTransformedVertices(
            'boundingBox',
            pattern.boundingBox,
            x, y, minimumTileLength, tileProportion, groutWidth, scale
        );

        // set connection
        updateTransformedVertices(
            'connection',
            pattern.connection,
            x, y, minimumTileLength, tileProportion, groutWidth, scale
        );

        // set tileVertices
        const tileVertices = pattern.tileVertices;
        for (let i = 0; i < tileVertices.length; i++) {
            updateTransformedVertices(
                'tileVertices',
                tileVertices[i],
                x, y, minimumTileLength, tileProportion, tileProportion, groutWidth, scale
            );
        }
    },

    // load scale
    loadscale: async () => {
        const scale = await loadScale();
        set({scale});
    },

    // load minimum tile length
    loadMinimumTileLength: async () => {
        const minimumTileLength = await loadMinimumTileLength();
        set({minimumTileLength});
    },

    // set anchor point
    setAnchor: (anchor) => get().anchor = anchor,

    // add patternVertices
    addPatternVertices: (vertex) => {
        get().patternVertices.push(vertex);
    },

    // add bounding box
    addBoundingBox: (box) => {
        get().boundingBox.push(box);
    },

    // add tileVertices
    addTileVertices: (tileVertices) => {
        get().tileVertices.push(tileVertices);  
    },

    // add connection
    addConnection: (connection) => {
        get().connection.push(connection);
    },
}));
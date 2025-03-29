import {create} from 'zustand';
import { loadPattern, loadScale, loadMinimumTileLength} from './tools';
import { calQuads } from './calQuads';

export const pattern = create((set, get) => ({

    // pattern name
    patternName: "Grid",
    // pattern proportion
    proportionIndex: 4,

    // surface vetices 
    OSurfaceVertices: [[0, 0], [3000, 0], [3000, 2300], [0, 2300]],
    // surface vertices pixel
    surfaceVertices: [[0, 0], [600, 0], [600, 460], [0, 460]], 

    // holes vertices
    OHoleVertices: [],
    // holes vertices pixel
    holeVertices: [],

    // sacle the original size to pixel size
    scale: 0.2,

    // anchor point of the pattern, 1x2, depends on the layout
    // anchor is the top left corner of the bounding box
    anchor: [0, 0],

    // grout widtn range
    groutRange: [],

    // base size of the pattern
    minimumTileLength: 50,

    // grout width
    OGroutWidth: 0,

    //Tile color 
    tileColors: ["#2196F3", "#FFC107", "#4CAF50", "#9C27B0", "#FF5722"],

    // offset of the whole layout
    offsetX: 0,
    offsetY: 0,

    // tiles
    tiles: [],

    patterns: [],  // save all patterns
    isDataLoaded: false, 
    
    //preload data
    preloadData: async () => {
        const patterns = await loadPattern();
        const scale = await loadScale();
        const minimumTileLength = await loadMinimumTileLength();
        if (!patterns || !scale || !minimumTileLength) {
            console.error("load data failed");
            return;
        }
        set({ patterns, proportions: pattern.tileProportion, scale, minimumTileLength, isDataLoaded: true });
        console.log("Data loaded");
    },

    // generate layout
    generateLayout: () => {
        const { 
            patternName, 
            proportionIndex,
            anchor, 
            patterns, 
            scale, 
            minimumTileLength, 
            OGroutWidth,
            surfaceVertices,
            holeVertices,
            offsetX,
            offsetY
        } = get();
    
        const pattern = patterns.find(p => p.name === patternName);
        if (!pattern) {
            console.error("Pattern not found");
            return;
        }
        
        const tileProportion = pattern.tileProportion[Number(proportionIndex)];
        const { patternVertices, boundingBox, connection, tileVertices } = pattern;
        const [x, y] = anchor;
        
        const Transform = (vertices) => {
            return vertices.map(vertex => {
                const extraX = vertex[3] || 0;
                const extraY = vertex[2] || 0;
                const newX = (x + vertex[0] * minimumTileLength * tileProportion[0] / tileProportion[1] + OGroutWidth * extraX) * scale;
                const newY = (y + vertex[1] * minimumTileLength * tileProportion[0] / tileProportion[1] + OGroutWidth * extraY) * scale;
                return [newX, newY];
            });
        };
        
        const transformedPatternVertices = Transform(patternVertices);
        const transformedBoundingBox = Transform(boundingBox);
        const transformedConnection = Transform(connection);
        console.log("Transformed connection: ", transformedConnection);

        const transformedTileVertices = tileVertices.map(tileVertex => Transform(tileVertex));;

        set({tiles: calQuads(    
            transformedTileVertices, 
            [x + offsetX * scale, y + offsetY * scale], 
            transformedBoundingBox,
            transformedPatternVertices,
            transformedConnection,
            surfaceVertices,
            holeVertices,
        )});

        console.log("Pattern initialized");
    },

    // init
    init: () => {
        get().generateLayout()
    },

    // set anchor point
    setAnchor: (anchor) => {
        set({ anchor: anchor });
    },

    // set grout width
    setOGroutWidth: (OGroutWidth) => {
        set({ OGroutWidth: OGroutWidth });
        get().init();
    },

    // set surface vertices
    setOSurfaceVertices: (OSurfaceVertices) => {
        const newOSurfaceVertices = [...OSurfaceVertices];
        set({ 
            OSurfaceVertices: newOSurfaceVertices,
            surfaceVertices: newOSurfaceVertices.map(([x, y]) => [x * get().scale, y * get().scale])
        });
    },

    // remove all holes
    removeHoles: () => {
        set({ 
            OHoleVertices: [],
            holeVertices: [] 
        });
    },

    // add surface Vertices
    addOSurfaceVertex: (OSurfaceVerTex) => {
        const newOsurfaceVertices = [...get().OSurfaceVertices, ...OSurfaceVerTex];
        // add surface vertex
        set({ 
            OSurfaceVertices: newOsurfaceVertices,
            surfaceVertices: newOsurfaceVertices.map(([x, y]) => [x * get().scale, y * get().scale])
        });
    },

    // add hole vertices
    addOHoleVertices: (OHoleVertex) => {
        const newOHoleVertices = [...get().OHoleVertices, ...OHoleVertex];
        // add hole
        set({ 
            OHoleVertices: newOHoleVertices,
            holeVertices: newOHoleVertices.map(([x, y]) => [x * get().scale, y * get().scale])
         });
    },

    // update offset
    setOffsetX: (offsetX) => {
        set({ offsetX: offsetX });
        get().init();
    },
    setOffsetY: (offsetY) => {
        set({ offsetY: offsetY });
        get().init();
    },

    // set pattern 
    setPattern: (patternName, proportionIndex) => {
        set({ patternName: patternName, proportionIndex: proportionIndex });
        get().init();
    },

    // reset
    reset: () => {
        set({
            OSurfaceVertices: [[0, 0], [3000, 0], [3000, 2300], [0, 2300]],
            surfaceVertices: [[0, 0], [600, 0], [600, 460], [0, 460]],
            OHoleVertices: [],
            holeVertices: [],
            OGroutWidth: 0,
            offset: [0, 0]
        });
        get().init();
    }
}));


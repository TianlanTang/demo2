import {create} from 'zustand';
import { loadPattern, loadScale, loadMinimumTileLength} from './tools';

export const pattern = create((set, get) => ({

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
    groutWidth: 0,

    // vertices of the outline of the pattern, mx2
    patternVertices: [],

    // bounding box vertices, 4x2
    boundingBox: [],

    // shift of all vertices of separate tiles nx4x2
    tileVertices: [],

    // connection shift of four direction, 4 * x
    connection: [],

    //Tile color 
    tileColor: ["#2196F3", "#FFC107", "#4CAF50", "#9C27B0", "#FF5722"],

    // init
    init: async (patternName, proportionIndex) => {

        // load patterns
        const patterns = await loadPattern();
        const pattern = patterns.find(p => p.name === patternName);
        if (!pattern) {
            console.error("Pattern not found", patternName);
            return;
        }

        // load essential parameters
        const scale = await loadScale();
        const minimumTileLength = await loadMinimumTileLength();
        if (!scale || !minimumTileLength) {
            console.error("Missing scale or minimum tile length");
            return;
        }
        set({ scale : scale, minimumTileLength : minimumTileLength });

        // load parameters
        const {      
            anchor,   
            groutWidth,
            updateTransformedVertices,
        } = get() 

        // anchor point
        const [x, y] = anchor;

        // load proportion
        const tileProportion = pattern.tileProportion[Number(proportionIndex)];
        if (!tileProportion) {
            console.error("proportion not found", tileProportion);
            return;
        }

        set(() => ({
            patternVertices: [],
            boundingBox: [],
            connection: [],
            tileVertices: []
        })); 
        
        set(() => {
            updateTransformedVertices('patternVertices', pattern.patternVertices, x, y, minimumTileLength, tileProportion, groutWidth, scale);
            updateTransformedVertices('boundingBox', pattern.boundingBox, x, y, minimumTileLength, tileProportion, groutWidth, scale);
            updateTransformedVertices('connection', pattern.connection, x, y, minimumTileLength, tileProportion, groutWidth, scale);
            pattern.tileVertices.forEach(tile => {
                updateTransformedVertices('tileVertices', tile, x, y, minimumTileLength, tileProportion, groutWidth, scale);
            });
        });
    },

    // set anchor point
    setAnchor: (anchor) => {
        set({ anchor: anchor });
    },

    // set grout width
    setGroutWidth: (groutWidth) => {
        set({ groutWidth: groutWidth });
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

    // update transformed vertices (adding grout)
    updateTransformedVertices: (key, vertices, x, y, minimumTileLength, tileProportion, groutWidth, scale) => {
        const transformed = vertices.map(vertex => [
            (x + vertex[0] * minimumTileLength * tileProportion[0] / tileProportion[1] + groutWidth * vertex[3]) * scale,
            (y + vertex[1] * minimumTileLength * tileProportion[0] / tileProportion[1] + groutWidth * vertex[2]) * scale
        ]);    
        set({ [key]: [...get()[key], ...transformed] });
    }
}));


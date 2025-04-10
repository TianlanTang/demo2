import {create} from 'zustand';
import { loadPattern, loadScale, loadMinimumTileLength, loadProps} from './tools';
import { calAnchors_clipper } from './calAnchors_clipper';

export const pattern = create((set, get) => ({

    // pattern name
    patternName: "Square Grid Pattern",
    // pattern proportion
    proportionIndex: 4,

    // size indices
    // m * n m is the number of different sizes, n is the number of tiles in the pattern
    propIndices: [], 
    // tile props
    tileProps: [],
    // common props
    commonProps: [],

    // surface vetices 
    OSurfaceVertices: [[0, 0], [3000, 0], [3000, 2300], [0, 2300]],
    // surface vertices pixel
    surfaceVertices: [[0, 0], [600, 0], [600, 460], [0, 460]], 

    // holes vertices
    OHoleVertices: [],
    // holes vertices pixel
    holeVertices: [
        [[0, 0], [200, 0], [200, 200], [0, 200]]
    ],

    // decide hot to deal with the grout
    isShrinking: false,

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
    tileColors: [
        "#2196F3", "#FFC107", "#4CAF50", "#9C27B0", "#FF5722", 
        "#E91E63", "#795548", "#607D8B", "#00BCD4", "#8BC34A", 
        "#FF9800", "#673AB7"
    ],
      
    // offset of the whole layout
    offsetX: 0,
    offsetY: 0,

    // tiles
    tiles: [],

    // bounding box size, used to calculate the laytou
    boundingBoxSize: [],
    
    // layout of the pattern, used to calculate the anchor point
    layout: "TopLeft",

    patterns: [],  // save all patterns
    isDataLoaded: false, 

    // total area covered by the tiles
    tileAreaCovered: 0,
    // total area of the surface minus the holes
    effectiveSurfaceArea: 0,

    // is tile on wall 
    isWall: true,

    tileCounts: {}, // Dictionary for count tiles
    
    //preload data
    preloadData: async () => {
        const patterns = await loadPattern();
        const scale = await loadScale();
        const minimumTileLength = await loadMinimumTileLength();
        const [commonProps, tileProps] = await loadProps();
        if (!patterns || !scale || !minimumTileLength) {
            console.error("load data failed");
            return;
        }
        set({ patterns, scale, minimumTileLength, commonProps, tileProps, isDataLoaded: true });
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
            offsetY,
        } = get();
    
        const pattern = patterns.find(p => p.name === patternName);
        if (!pattern) {
            console.error("Pattern not found");
            return;
        }
        
        // used to calculate the size of the pattern
        const tileProportion = pattern.tileProportion[Number(proportionIndex)];

        // used to find the standard size of the pattern
        // which is used to calulate the costs
        const propIndices = pattern.propIndices[Number(proportionIndex)];

        const { patternVertices, boundingBox, connection, tileVertices } = pattern;
        const [x, y] = anchor;
        
        const Transform = (vertices) => {
            return vertices.map(vertex => {
                const extraX = vertex[3] || 0;
                const extraY = vertex[2] || 0;
                const newX = (vertex[0] * minimumTileLength * tileProportion[0] / tileProportion[1] + OGroutWidth * extraX) * scale;
                const newY = (vertex[1] * minimumTileLength * tileProportion[0] / tileProportion[1] + OGroutWidth * extraY) * scale;
                return [newX, newY];
            });
        };


        const transformedPatternVertices = Transform(patternVertices);
        const transformedBoundingBox = Transform(boundingBox);
        const transformedConnection = Transform(connection);
        const transformedTileVertices = tileVertices.map(tileVertex => Transform(tileVertex));
        

        console.time("calAnchors");
        const {anchors, tileAreaCovered, effectiveSurfaceArea, tileCounts} = calAnchors_clipper(    
            [x + offsetX * scale, y + offsetY * scale], 
            transformedBoundingBox,
            transformedPatternVertices,
            transformedConnection,
            surfaceVertices,
            holeVertices,
            transformedTileVertices, 
            scale,
        );
        set({tiles: anchors, 
            tileAreaCovered: tileAreaCovered,
            effectiveSurfaceArea: effectiveSurfaceArea,
            tileCounts: tileCounts,
            boundingBoxSize: [transformedBoundingBox[1][0] - transformedBoundingBox[0][0], transformedBoundingBox[2][1] - transformedBoundingBox[1][1]],
            propIndices: propIndices,
        });

        // Check for duplicate anchors
        const uniqueAnchors = anchors.filter((anchor, index, self) =>
            index === self.findIndex((a) => a[0] === anchor[0] && a[1] === anchor[1])
        );
        if (uniqueAnchors.length !== anchors.length) {
            alert("Duplicate anchors found");
        }
        console.timeEnd("calAnchors");
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

    setSurfaceVertices: (surfaceVertices) => {
        const newSurfaceVertices = [...surfaceVertices];
        set({ 
            OSurfaceVertices: newSurfaceVertices,
            surfaceVertices: newSurfaceVertices.map(([x, y]) => [x * get().scale, y * get().scale])
        });
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

    // set layout 
    setLayout: (layout) => {
        set({ layout: layout });
        const { boundingBoxSize, surfaceVertices, init} = get();
        let anchor;
        switch (layout) {
            case "TopLeft":
                anchor = [0, 0];
                break;
            case "TopRight":
                anchor = [surfaceVertices[1][0] - boundingBoxSize[0], 0];
                break;
            case "BottomLeft":
                anchor = [0, surfaceVertices[3][1] - boundingBoxSize[1]];
                break;
            case "BottomRight":
                anchor = [surfaceVertices[1][0] - boundingBoxSize[0], surfaceVertices[3][1] - boundingBoxSize[1]];
                break;
            case "LeftCenter":
                anchor = [0, (surfaceVertices[3][1] - boundingBoxSize[1]) / 2];
                break;
            case "RightCenter":
                anchor = [surfaceVertices[1][0] - boundingBoxSize[0], (surfaceVertices[3][1] - boundingBoxSize[1]) / 2];
                break;
            case "TopCenter":
                anchor = [(surfaceVertices[1][0] - boundingBoxSize[0]) / 2, 0];
                break;
            case "BottomCenter":
                anchor = [(surfaceVertices[1][0] - boundingBoxSize[0]) / 2, surfaceVertices[3][1] - boundingBoxSize[1]];
                break;
            case "Center":
                anchor = [(surfaceVertices[1][0] - boundingBoxSize[0]) / 2, (surfaceVertices[3][1] - boundingBoxSize[1]) / 2];
                break;
            default:
                console.error("Invalid layout type");
                return;
        }
        set({ anchor }); // Update the anchor point
        console.log("Layout updated:", layout);
        console.log("Anchor point updated:", anchor);
        init();
    },

    // set pattern 
    setPattern: (patternName, proportionIndex) => {
        set({ patternName: patternName, proportionIndex: proportionIndex });
        const { layout, setLayout } = get();
        get().init(); // init first to update bounding box size
        setLayout(layout); // Recalculate the layout and anchor point
    },

    // set will or floor
    setIsWall: () => {
        set({ isWall: !get().isWall });
    },

    // reset
    reset: () => {
        set({
            OSurfaceVertices: [[0, 0], [3000, 0], [3000, 2300], [0, 2300]],
            surfaceVertices: [[0, 0], [600, 0], [600, 460], [0, 460]],
            OHoleVertices: [],
            holeVertices: [],
            OGroutWidth: 0,
            offsetX: 0,
            offsetY: 0,
        });
        get().init();
    }
}));


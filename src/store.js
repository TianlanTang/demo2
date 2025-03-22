import { create } from "zustand";

export const useStore = create((set, get) => ({ 
    // Layout state

    //store each single tile
    tiles: [],

    // layout type, supporting horizontal at the moment, 
    // need to be extended to support diamond and 45 degree
    layoutType: "horizontal",

    //layout options
    // default is center
    // incremental adjustment support on default.
    // leftcenter 
    // -- -- -
    // [] [] [
    // -- -- -
    // rightcenter
    // - -- --
    // ] [] []
    // - -- --
    // bottomcenter
    // - -- -
    // ] [] [
    // ] [] [
    // topcenter
    // ] [] [
    // ] [] [
    // - -- -  

    /*
    layoutOptions: [
        "leftBottom", 
        "rightBottom", 
        "leftTop",
        "rightTop",
        "leftCenter",
        "rightCenter",
        "bottomCenter",
        "topCenter",
        "center"
    ],
    */
    layoutOptions: "center",

    //horizontal offset for each tile
    hSpacing: 0,
    //vertical offset for each tile
    vSpacing: 0,

    // offset for the whole layout 
    // used for layout options
    offsetX: 0,
    offsetY: 0,

    //Original surface size
    oSurfaceHeight: 2300,
    oSurfaceWidth: 3000,

    //Original grout width
    oGroutWidth: 25,

    //Original tile size
    oTileHeight: 300,
    oTileWidth: 600,
    
    //Tile color 
    tileColorEven: "#2196F3", 
    tileColorOdd: "#FFC107",
    
    generateHorizonTalLayout: () => {
        const {
        tileColorEven,
        tileColorOdd,
        hSpacing,
        vSpacing,
        } = get();

        const surfaceWidth = get().getSurfaceWidth();
        const surfaceHeight = get().getSurfaceHeight()
        const tileWidth = get().getTileWidth();
        const tileHeight = get().getTileHeight();
        const groutWidth = get().getGroutWidth();

        let tiles = [];

        // calculate cols and rows 
        const cols = Math.ceil((surfaceWidth - tileWidth) / (tileWidth + groutWidth)) + 1;
        const rows = Math.ceil((surfaceHeight - tileHeight) / (tileHeight + groutWidth)) + 1;

        // get left top tile location
        const {startX, startY} = get().calTopLeft(cols, rows);

        // calculate locations for each tile
        for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {

                let x = 0;
                let y = 0;

                // do not consider the whole layout offset here
                if (row % 2 === 0) {
                    x = col * (tileWidth + groutWidth) + startX;
                }
                else {
                    x = col * (tileWidth + groutWidth) + startX + hSpacing;
                    console.log("hSpacing", hSpacing);
                }

                if (col % 2 === 0) {
                    y = row * (tileHeight + groutWidth) + startY;
                }
                else {
                    y = row * (tileHeight + groutWidth) + startY + vSpacing;
                }
                    
                // calculate tile color
                const color = (row + col) % 2 === 0 ? tileColorEven : tileColorOdd;
                
                // add tile to the list
                tiles.push({
                    id: `${row}-${col}`,
                    x: x,
                    y: y,
                    visibleWidth: tileWidth,
                    visibleHeight: tileHeight,
                    color: color,
                });

            }
        }
        set({ tiles });
    },

    // generate layout
    init: () => get().generateLayout(),

    generateLayout: () => {
        get().generateHorizonTalLayout();
    },

    // cal top left tile location based on layoutOptions
    // The whole layout offset is considered here.
    calTopLeft: (numCols, numRows) => {
        const {
            offsetX,
            offsetY,
            layoutOptions,
            getTileWidth,
            getTileHeight,
            getGroutWidth,
            getSurfaceWidth,
            getSurfaceHeight,
        } = get();

        const tileWidth = getTileWidth();
        const tileHeight = getTileHeight();
        const groutWidth = getGroutWidth();
        const surfaceWidth = getSurfaceWidth();
        const surfaceHeight = getSurfaceHeight();

        let startX = 0;
        let startY = 0;
        // left top tile is whole
        if (layoutOptions === "leftTop") {
            startX = offsetX;
            startY = offsetY;
        }
        // right top tile is whole
        else if (layoutOptions === "rightTop") {
            startX = surfaceWidth - (tileWidth + groutWidth) * numCols + groutWidth + offsetX;
            startY = offsetY;
        }
        // left bottom tile is whole
        else if (layoutOptions === "leftBottom") {
            startX = offsetX;
            startY = surfaceHeight - (tileHeight + groutWidth) * numRows + groutWidth + offsetY;
        }
        // right bottom tile is whole
        else if (layoutOptions === "rightBottom") {
            startX = surfaceWidth - (tileWidth + groutWidth) * numCols + groutWidth + offsetX;
            startY = surfaceHeight - (tileHeight + groutWidth) * numRows + groutWidth + offsetY;
        }
        // left center tile is whole
        else if (layoutOptions === "leftCenter") {
            startX = offsetX;
            startY = (surfaceHeight - (tileHeight + groutWidth) * numRows + groutWidth) / 2 + offsetY;
        }
        // right center tile is whole
        else if (layoutOptions === "rightCenter") {
            startX = surfaceWidth - (tileWidth + groutWidth) * numCols + groutWidth + offsetX;
            startY = (surfaceHeight - (tileHeight + groutWidth) * numRows + groutWidth) / 2 + offsetY;
        }
        // bottom center tile is whole
        else if (layoutOptions === "bottomCenter") {
            startX = (surfaceWidth - (tileWidth + groutWidth) * numCols + groutWidth) / 2 + offsetX;
            startY = surfaceHeight - (tileHeight + groutWidth) * numRows + groutWidth + offsetY;
        }
        // top center tile is whole
        else if (layoutOptions === "topCenter") {
            startX = (surfaceWidth - (tileWidth + groutWidth) * numCols + groutWidth) / 2 + offsetX;
            startY = offsetY;
        }
        // center tile is whole
        else if (layoutOptions === "center") {
            startX = (surfaceWidth - (tileWidth + groutWidth) * numCols + groutWidth) / 2 + offsetX;
            startY = (surfaceHeight - (tileHeight + groutWidth) * numRows + groutWidth) / 2 + offsetY;
        }
        return {startX, startY};
    },

    // cal actual width and height
    // using a fixed height 460 as the base
    getScaleFactor: () => {
        const scaleFactor = 460 / get().oSurfaceHeight;
        return scaleFactor;
    },
    getSurfaceHeight: () => { 
        const SurfaceHeight = 460;
        return SurfaceHeight;
    },
    getSurfaceWidth: () => { 
        const surfaceWidth = get().oSurfaceWidth * get().getScaleFactor();
        return surfaceWidth;
    },
    getTileWidth: () => { 
        const tileWidth = get().oTileWidth * get().getScaleFactor(); 
        return tileWidth;
    },
    getTileHeight: () => { 
        const tileHeight = get().oTileHeight * get().getScaleFactor(); 
        return tileHeight;
    },
    getGroutWidth: () => { 
        const groutWidth = get().oGroutWidth * get().getScaleFactor(); 
        return groutWidth;
    },
    
    // set prameters
    setTileWidth: (tileWidth) => {
        set({ oTileWidth: tileWidth })
        get().generateLayout();
    },
    setTileHeight: (tileHeight) => {
        set({ oTileHeight: tileHeight })
        get().generateLayout();
    },
    setSurfaceWidth: (surfaceWidth) => {
        set({ oSurfaceWidth: surfaceWidth })
        get().generateLayout();
    },
    setSurfaceHeight: (surfaceHeight) => {
        set({ oSurfaceHeight: surfaceHeight })
        get().generateLayout();
    },
    setGroutWidth: (groutWidth) => {
        set({ oGroutWidth: groutWidth })
        get().generateLayout();
    },
    
    // whole layout offset
    setOffsetX(offsetX) {
        set({ offsetX });
        get().generateLayout();
    },
    setOffsetY(offsetY) {
        set({ offsetY });
        get().generateLayout();
    },

    // layout options
    setLayoutOptions(layoutOptions) {
        set({ layoutOptions });
        get().generateLayout();
    },

    // horizontal spacing
    setHSpacing(hSpacing) {
        set({ hSpacing });
        get().generateLayout();
    },
    setVSpacing(vSpacing) {
        set({ vSpacing });
        get().generateLayout();
    },

    // reset layout
    reset: () => {
        set({
            offsetX: 0,
            offsetY: 0,
            hSpacing: 0,
            vSpacing: 0,
            layoutOptions: "center",
        });
        get().generateLayout();
    },

}));
import { create } from "zustand";

const loadPatterns = async () => {
    try {
        const response = await fetch("/oneTilePatterns.json");
        const data = await response.json();
        return data.patterns;
    } catch (error) {
        console.error("Error loading patterns", error);
        return [];
    }
};

export const oneTileHerringBoneStore = create((set, get) => ({ 
    
    // store each single tile location
    tiles: [],

    // patterntype
    patternType: "Herringbone single horizontal basic W/Lratio 1:2",

    layoutOptions: "leftTop",

    // offset for the whole layout 
    // used for layout options 10
    offsetX: 0,
    offsetY: 0,

    //Original surface size
    oSurfaceHeight: 2300,
    oSurfaceWidth: 3000,

    //Original grout width
    oGroutWidth: 0,

    //Original tile size, based on tile pattern
    oTileHeight: 600,
    oTileWidth: 300,
    
    //Tile color 
    tileColor: ["#2196F3", "#FFC107", "#4CAF50", "#9C27B0", "#FF5722"],
    
    // grout adjust
    groutAdjust: 1,

    // cal location 
    generateLayout: () => {
        const {
            getGroutWidth,
            calOuterShift,
            calInnerShift,
            calOuterColsAndRows,
            calInnerColsOrRows,
            calTopLeft,
            groutAdjust,
            } = get();
    
            const groutWidth = getGroutWidth();
            const [numOuterCols, numOuterRows] = calOuterColsAndRows();
            const [outHorizontalShift, outVerticalShift] = calOuterShift();
            const [innerHorizontalShift, innerVerticalShift] = calInnerShift();
            const numInnerCols = calInnerColsOrRows();


            let tiles = [];

            // cal top left
            const startTiles = calTopLeft(numOuterCols, numOuterRows);
            for (let row = -1; row < numOuterRows; row++) {
                for (let col = -1; col < numOuterCols; col++) {
                    for (let inner = 0; inner < numInnerCols; inner++) {
                        for (let [x, y, width, height, color] of startTiles) {
                            // + groutWidth * row, + groutWidth * col 
                            // these two are important when the gourt width is not 0
                            // which means tiles in a row will not be at the same line, a little shift on vertical direction need to be added
                            const xLoc = x + col * outHorizontalShift + inner * innerHorizontalShift + groutWidth * row * groutAdjust;
                            const yLoc = y + row * outVerticalShift + inner * innerVerticalShift + groutWidth * col * groutAdjust;
                            tiles.push({ x: xLoc, y: yLoc, width:width, height:height, color:color}); 
                        }
                    }
                }
            }
            set({ tiles });
    },

    // generate layout
    init: () => {
        get().generateLayout();
    },


    // cal anchor point
    calTopLeft: () => {
        const {
            offsetX,
            offsetY,
            layoutOptions,
            getTileWidth,
            getTileHeight,
            calOuterShift,
            getGroutWidth,
            getSurfaceWidth,
            getSurfaceHeight,
            calOuterColsAndRows,
            tileColor,
            patternType,
        } = get();

        const tileWidth = getTileWidth();
        const tileHeight = getTileHeight();
        const groutWidth = getGroutWidth();
        const OuterShift = calOuterShift();
        const surfaceWidth = getSurfaceWidth();
        const surfaceHeight = getSurfaceHeight();
        const [numOuterCols, numOuterRows] = calOuterColsAndRows();

        let startX = 0;
        let startY = 0;

        var startTiles = [];

        // left top tile is whole
        if (layoutOptions === "leftTop") {
            // loc for left top corner, width, height and color
            if (patternType === "Herringbone single horizontal basic W/Lratio 1:2") {
                startTiles.push([offsetX, offsetY, tileWidth, tileHeight, tileColor[0]]);
                startTiles.push([offsetX + tileWidth + groutWidth, offsetY, tileHeight, tileWidth, tileColor[1]]);
            }
            else if (patternType === "Herringbone single horizontal basic W/Lratio 1:3" || patternType === "Herringbone single horizontal narrow W/Lratio 1:4") {
                startTiles.push([offsetX, offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([offsetX, offsetY + tileWidth + groutWidth, tileWidth, tileHeight, tileColor[1]]);
            }
            else if (patternType === "Herringbone single horizontal blunt W/Lratio 1:1.5") {
                startTiles.push([offsetX, offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([offsetX, offsetY + tileWidth + groutWidth, tileWidth, tileHeight, tileColor[1]]);
                startTiles.push([offsetX + tileHeight + groutWidth, offsetY - tileHeight + tileWidth, tileWidth, tileHeight, tileColor[3]]);
                startTiles.push([offsetX + tileHeight + groutWidth, offsetY - tileHeight - groutWidth, tileHeight, tileWidth, tileColor[4]]);
            }
        }
        // right top tile is whole
        else if (layoutOptions === "rightTop") {
            if (patternType === "Herringbone single horizontal basic W/Lratio 1:2") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth + tileWidth + offsetX, offsetY, tileWidth, tileHeight, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 2 + tileWidth * 2 + offsetX, offsetY, tileHeight, tileWidth, tileColor[1]]);
            }
            else if (patternType === "Herringbone single horizontal basic W/Lratio 1:3") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 3 + tileWidth * 3 + offsetX, offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 3 + tileWidth * 3 + offsetX, offsetY + tileWidth + groutWidth, tileWidth, tileHeight, tileColor[1]]);
            }
            else if (patternType === "Herringbone single horizontal blunt W/Lratio 1:1.5") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 1 + groutWidth * 5 + offsetX, offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 1 + groutWidth * 5 + offsetX, offsetY + tileWidth + groutWidth, tileWidth, tileHeight, tileColor[1]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 2 + groutWidth * 6 + offsetX, offsetY - tileHeight + tileWidth, tileWidth, tileHeight, tileColor[3]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 2 + groutWidth * 6 + offsetX, offsetY - tileHeight - groutWidth, tileHeight, tileWidth, tileColor[4]]);
            }
            else if (patternType === "Herringbone single horizontal narrow W/Lratio 1:4") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 4 + tileWidth * 4 + offsetX, offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 4 + tileWidth * 4 + offsetX, offsetY + tileWidth + groutWidth, tileWidth, tileHeight, tileColor[1]]);          }
        }    
        // left bottom tile is whole
        else if (layoutOptions === "leftBottom") {
            if (patternType === "Herringbone single horizontal basic W/Lratio 1:2") {
                startTiles.push([offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth + tileHeight + offsetY, tileWidth, tileHeight, tileColor[0]]);
                startTiles.push([offsetX + tileWidth + groutWidth, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth + tileHeight + offsetY, tileHeight, tileWidth, tileColor[1]]);    
            }
            else if (patternType === "Herringbone single horizontal basic W/Lratio 1:3") {
                startTiles.push([offsetX, surfaceHeight - OuterShift[1] * numOuterRows + offsetY + tileWidth * 2 + groutWidth * 2, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([offsetX, surfaceHeight - OuterShift[1] * numOuterRows + offsetY + groutWidth * 3 + tileWidth * 3, tileWidth, tileHeight, tileColor[1]]);
            }
            else if (patternType === "Herringbone single horizontal blunt W/Lratio 1:1.5") {
                startTiles.push([offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 3 + tileHeight * 1 + tileWidth * 2 + offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 4 + tileHeight * 1 + tileWidth * 3 + offsetY, tileWidth, tileHeight, tileColor[1]]);
                startTiles.push([offsetX + tileHeight + groutWidth, surfaceHeight - OuterShift[1] * numOuterRows + tileWidth * 2 + groutWidth * 2 + offsetY, tileHeight, tileWidth, tileColor[3]]);
                startTiles.push([offsetX + tileHeight + groutWidth, surfaceHeight - OuterShift[1] * numOuterRows + tileWidth * 3 + offsetY + groutWidth * 3, tileWidth, tileHeight, tileColor[4]]);
            }
            else if (patternType === "Herringbone single horizontal narrow W/Lratio 1:4") {
                startTiles.push([offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 3 + tileWidth * 3 + offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 4 + tileWidth * 4 + offsetY, tileWidth, tileHeight, tileColor[1]]);
            }
        }
        // right bottom tile is whole
        else if (layoutOptions === "rightBottom") {
            if(patternType === "Herringbone single horizontal basic W/Lratio 1:2") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth + tileWidth + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth + tileHeight + offsetY, tileWidth, tileHeight, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 2 + tileWidth * 2 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth + tileHeight + offsetY, tileHeight, tileWidth, tileColor[1]]);
            }
            else if (patternType === "Herringbone single horizontal basic W/Lratio 1:3") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 3 + tileWidth * 3 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + offsetY + tileWidth * 2 + groutWidth * 2, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 3 + tileWidth * 3 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + offsetY + groutWidth * 3 + tileWidth * 3, tileWidth, tileHeight, tileColor[1]])
            }
            else if (patternType === "Herringbone single horizontal blunt W/Lratio 1:1.5") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 1 + groutWidth * 5 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 3 + tileHeight * 1 + tileWidth * 2 + offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 1 + groutWidth * 5 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 4 + tileHeight * 1 + tileWidth * 3 + offsetY, tileWidth, tileHeight, tileColor[1]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 2 + groutWidth * 6 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + tileWidth * 2 + groutWidth * 2 + offsetY, tileHeight, tileWidth, tileColor[3]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + tileWidth * 3 + tileHeight * 2 + groutWidth * 6 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + tileWidth * 3 + offsetY + groutWidth * 3, tileWidth, tileHeight, tileColor[4]]);
            }
            else if (patternType === "Herringbone single horizontal narrow W/Lratio 1:4") {
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 4 + tileWidth * 4 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 3 + tileWidth * 3 + offsetY, tileHeight, tileWidth, tileColor[0]]);
                startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 4 + tileWidth * 4 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth * 4 + tileWidth * 4 + offsetY, tileWidth, tileHeight, tileColor[1]]);        
            }
        }
        // TODO: finish the rest of the layout options
        // left center tile is whole
        else if (layoutOptions === "leftCenter") {
            startTiles.push([offsetX, (surfaceHeight - OuterShift[1] * numOuterRows + groutWidth) / 2 + offsetY, tileWidth, tileHeight, tileColor[0]]);
            startTiles.push([offsetX + tileWidth + groutWidth, (surfaceHeight - OuterShift[1] * numOuterRows + groutWidth) / 2 + offsetY, tileHeight, tileWidth, tileColor[1]]);
        }
        // right center tile is whole
        else if (layoutOptions === "rightCenter") {
            startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth + tileWidth + offsetX, (surfaceHeight - OuterShift[1] * numOuterRows + groutWidth) / 2 + offsetY, tileWidth, tileHeight, tileColor[0]]);
            startTiles.push([surfaceWidth - OuterShift[0] * numOuterCols + groutWidth * 2 + tileWidth * 2 + offsetX, (surfaceHeight - OuterShift[1] * numOuterRows + groutWidth) / 2 + offsetY, tileHeight, tileWidth, tileColor[1]]);
        }
        // bottom center tile is whole
        else if (layoutOptions === "bottomCenter") {
            startTiles.push([(surfaceWidth - OuterShift[0] * numOuterCols + groutWidth) / 2 + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth + tileHeight + offsetY, tileWidth, tileHeight, tileColor[0]]);
            startTiles.push([(surfaceWidth - OuterShift[0] * numOuterCols + groutWidth) / 2  + tileWidth + groutWidth + offsetX, surfaceHeight - OuterShift[1] * numOuterRows + groutWidth + tileHeight + offsetY, tileHeight, tileWidth, tileColor[1]]);
        }
        // top center tile is whole
        else if (layoutOptions === "topCenter") {
            startTiles.push([(surfaceWidth - OuterShift[0] * numOuterCols + groutWidth) / 2 + offsetX, offsetY, tileWidth, tileHeight, tileColor[0]]);
            startTiles.push([(surfaceWidth - OuterShift[0] * numOuterCols + groutWidth) / 2 + tileWidth + groutWidth + offsetX , offsetY, tileHeight, tileWidth, tileColor[1]]);
        }
        // center tile is whole
        else if (layoutOptions === "center") {
            startTiles.push([(surfaceWidth - OuterShift[0] * numOuterCols + groutWidth) / 2 + offsetX, (surfaceHeight - OuterShift[1] * numOuterRows + groutWidth) / 2 + offsetY, tileWidth, tileHeight, tileColor[0]]);
            startTiles.push([(surfaceWidth - OuterShift[0] * numOuterCols + groutWidth) / 2 + tileWidth + groutWidth + offsetX, (surfaceHeight - OuterShift[1] * numOuterRows + groutWidth) / 2 + offsetY, tileHeight, tileWidth, tileColor[1]]);
        }
        return startTiles;
    },
        
    // cal shift for a combined pattern, conside all grout, at outer side
    calOuterShift: () => {
        if (get().patternType === "Herringbone single horizontal basic W/Lratio 1:2") {
            return [get().getTileWidth() * 2 + get().getTileHeight() + get().getGroutWidth() * 3, get().getTileWidth() * 2 + get().getTileHeight() + get().getGroutWidth() * 3];
        }
        else if (get().patternType === "Herringbone single horizontal basic W/Lratio 1:3") {
            return [get().getTileWidth() * 3 + get().getTileHeight() + get().getGroutWidth() * 4, get().getTileWidth() * 3 + get().getTileHeight() + get().getGroutWidth() * 4];
        }
        else if (get().patternType === "Herringbone single horizontal blunt W/Lratio 1:1.5") {
            return [get().getTileWidth() * 3 + get().getTileHeight() * 2 + get().getGroutWidth() * 5, get().getTileWidth() * 3 + get().getTileHeight() * 2+ get().getGroutWidth() * 5];
        }
        else if (get().patternType === "Herringbone single horizontal narrow W/Lratio 1:4") {
            return [get().getTileWidth() * 4 + get().getTileHeight() + get().getGroutWidth() * 5, get().getTileWidth() * 4 + get().getTileHeight() + get().getGroutWidth() * 5];
        }
    },
    // cal shift for a combined pattern, consider all grout, at inner side
    calInnerShift: () => {
        return [get().getTileWidth() + get().getGroutWidth(), get().getTileWidth() + get().getGroutWidth()];
        
    },

    // cal outer cols and rows
    calOuterColsAndRows: () => {
        return [Math.ceil(get().getSurfaceWidth() / get().calOuterShift()[0]) + 1, Math.ceil(get().getSurfaceHeight() / (get().calOuterShift()[1])) + 1];
    },

    // cal inner cols or rows
    calInnerColsOrRows: () => {
        if (get().patternType === "Herringbone single horizontal basic W/Lratio 1:2") {
            return 4;
        }
        else if (get().patternType === "Herringbone single horizontal basic W/Lratio 1:3") {
            return 6;
        }
        else if (get().patternType === "Herringbone single horizontal blunt W/Lratio 1:1.5") {
            return 6;
        }
        else if (get().patternType === "Herringbone single horizontal narrow W/Lratio 1:4") {
            return 8;
        }
    },

    // set grout adjust
    setGroutAdjust: () => {
        if (get().patternType === "Herringbone single horizontal basic W/Lratio 1:2") {
            set({ groutAdjust : 1 }); 
        }
        else if (get().patternType === "Herringbone single horizontal basic W/Lratio 1:3") {
            set({ groutAdjust : 2 });
        }
        else if (get().patternType === "Herringbone single horizontal blunt W/Lratio 1:1.5") {
            set({ groutAdjust : 1 });
        }
        else if (get().patternType === "Herringbone single horizontal narrow W/Lratio 1:4") {
            set({ groutAdjust : 3});
        }
    },

    // set tile pattern
    setPattern: async (patternName, scaleIndex) => {
        const patterns = await loadPatterns();

        const pattern = patterns.find(p => p.name === patternName);

        if (!pattern) {
            console.error("Pattern not found", patternName);
            return;
        }

        const tile = pattern.tiles[0];
        const tileScale = pattern.tileScale[Number(scaleIndex)];

        if (!tile || !tileScale) {
            console.error("Pattern not found", patternName, scaleIndex);
            return;
        }

        const [numerator, denominator] = tileScale;

        set({
            oTileWidth: tile.width * numerator / denominator,
            oTileHeight: tile.height * numerator / denominator,
            patternType: patternName
        });
        get().setGroutAdjust();
        get().generateLayout();
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

    // set other parameters
    setSurfaceWidth: (surfaceWidth) => {
        set({ oSurfaceWidth: surfaceWidth })
        get().generateLayout();
    },
    setSurfaceHeight: (surfaceHeight) => {
        set({ oSurfaceHeight: surfaceHeight })
        get().generateLayout();
    },
    setGroutWidth: (groutWidth) => {
        set({ oGroutWidth: groutWidth });
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

    // reset layout
    reset: () => {
        get().setPattern("Herringbone single horizontal basic W/Lratio 1:2", 3);
        set({
            oSurfaceHeight: 2300,
            oSurfaceWidth: 3000,
            oGroutWidth: 0,
            offsetX: 0,
            offsetY: 0,
            layoutOptions: "leftTop",
            groutAdjust: 1,
        });
        get().generateLayout();
    },

})); 
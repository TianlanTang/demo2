import { create } from 'zustand';
import { loadPattern, loadScale, loadMinimumTileLength, loadProps } from './tools';
import { calAnchors_clipper } from './calAnchors_clipper';

// 全局共享的属性 tileProps、commonProps 放到 state 内
// 默认墙面状态，注意这里不包含全局共享属性，也删除了 isShrinking
const defaultWallState = {
    patternName: "Square Grid Pattern",
    proportionIndex: 0,
    propIndices: [],
    OSurfaceVertices: [],
    surfaceVertices: [],
    OHoleVertices: [],
    holeVertices: [],
    anchor: [0, 0],
    offsetX: 0,
    offsetY: 0,
    layout: "TopLeft",
    tiles: [],
    boundingBoxSize: [],
    tileAreaCovered: 0,
    effectiveSurfaceArea: 0,
    tileCounts: {},
    isInitialized: false,
    isWall: true, 
    // scale removed from here
};

export const pattern = create((set, get) => ({
    // Add scale as a global property
    scale: 0.2, // Default scale value
    groutRange: [],
    OGroutWidth: 0,
    tileColors: [
        "#2196F3", "#FFC107", "#4CAF50", "#9C27B0", "#FF5722",
        "#E91E63", "#795548", "#607D8B", "#00BCD4", "#8BC34A",
        "#FF9800", "#673AB7"
    ],
    isDataLoaded: false,
    minimumTileLength: 50,
    patterns: [],
    // 全局共享的 tileProps 与 commonProps
    tileProps: [],
    commonProps: [],
    
    // 固定 5 个墙面，根据墙面类型设置 isWall：
    // east、south、west、north 为正面（isWall: true），floor 为反面（isWall: false）
    walls: {
        east: { ...defaultWallState, isWall: true },
        south: { ...defaultWallState, isWall: true },
        west: { ...defaultWallState, isWall: true },
        north: { ...defaultWallState, isWall: true },
        floor: { ...defaultWallState, isWall: false },
    },

    // 当前选中的墙面
    selectedWall: "east",

    // 预加载数据
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

        // initialize all walls with the loaded data
        get().initializeWalls();
    },

    // 根据指定墙面类型生成布局（仅操作该墙面的独立数据）
    // 参数仅包含 wallType（只有一个参数，保持不变）
    generateLayout: (wallType = "east") => {
        const wall = get().walls[wallType];
        if (!wall) {
            console.error("Invalid wall type:", wallType);
            return;
        }
        const {
            patternName,
            proportionIndex,
            anchor,
            offsetX,
            offsetY,
            surfaceVertices,
            holeVertices,
        } = wall;
        const { patterns, minimumTileLength, OGroutWidth, scale } = get(); // Use global scale
        const patternData = patterns.find(p => p.name === patternName);
        if (!patternData) {
            console.error("Pattern not found", patternName);
            return;
        }
        const tileProportion = patternData.tileProportion[Number(proportionIndex)];
        const propIndices = patternData.propIndices[Number(proportionIndex)];
        const { patternVertices, boundingBox, connection, tileVertices } = patternData;
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
        const { anchors, tileAreaCovered, effectiveSurfaceArea, tileCounts } = calAnchors_clipper(
            [x + offsetX * scale, y + offsetY * scale],
            transformedBoundingBox,
            transformedPatternVertices,
            transformedConnection,
            surfaceVertices,
            holeVertices,
            transformedTileVertices,
            scale,
        );
        console.timeEnd("calAnchors");

        // 更新该墙面的数据
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: {
                    ...state.walls[wallType],
                    tiles: anchors,
                    tileAreaCovered,
                    effectiveSurfaceArea,
                    tileCounts,
                    boundingBoxSize: [
                        transformedBoundingBox[1][0] - transformedBoundingBox[0][0],
                        transformedBoundingBox[2][1] - transformedBoundingBox[1][1]
                    ],
                    propIndices,
                }
            }
        }));

        // 检查重复的锚点
        const uniqueAnchors = anchors.filter((a, index, self) =>
            index === self.findIndex(b => b[0] === a[0] && b[1] === a[1])
        );
        if (uniqueAnchors.length !== anchors.length) {
            alert("Duplicate anchors found");
        }
        console.log("Pattern initialized for wall:", wallType);
    },

    // 初始化指定墙面（生成布局），参数只有 wallType（默认 "east"）
    init: (wallType = "east") => {
        console.log("Initializing wall:", wallType);
        // Calculate scale first if not already set or if it needs updating
        get().calculateScale(wallType);
        get().generateLayout(wallType);
        
        // Mark the wall as initialized if this is its first initialization
        const wall = get().walls[wallType];
        if (wall && !wall.isInitialized) {
            set(state => ({
                walls: {
                    ...state.walls,
                    [wallType]: {
                        ...state.walls[wallType],
                        isInitialized: true
                    }
                }
            }));
            console.log(`Wall ${wallType} marked as initialized`);
        }
    },

    // 更新指定墙面的 anchor 点，参数顺序调整为: newAnchor, wallType(默认 "east")
    setAnchor: (newAnchor, wallType = "east") => {
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: { ...state.walls[wallType], anchor: newAnchor }
            }
        }));
    },

    // 更新指定墙面的 offsetX，并重新初始化
    // 参数顺序调整为: offsetX, wallType(默认 "east")
    setOffsetX: (offsetX, wallType = "east") => {
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: { ...state.walls[wallType], offsetX }
            }
        }));
        get().init(wallType);
    },

    // 更新指定墙面的 offsetY，并重新初始化
    // 参数顺序调整为: offsetY, wallType(默认 "east")
    setOffsetY: (offsetY, wallType = "east") => {
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: { ...state.walls[wallType], offsetY }
            }
        }));
        get().init(wallType);
    },

    // 设置指定墙面的 layout 与 anchor
    // 参数顺序调整为: layout, wallType(默认 "east")
    setLayout: (layout, wallType = "east") => {
        const wall = get().walls[wallType];
        if (!wall) {
            console.error("Invalid wall type:", wallType);
            return;
        }
        const { boundingBoxSize, surfaceVertices } = wall;
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
                anchor = [
                    (surfaceVertices[1][0] - boundingBoxSize[0]) / 2,
                    (surfaceVertices[3][1] - boundingBoxSize[1]) / 2
                ];
                break;
            default:
                console.error("Invalid layout type");
                return;
        }
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: { ...state.walls[wallType], layout, anchor }
            }
        }));
        console.log("Layout updated for", wallType, ":", layout);
        console.log("Anchor point updated for", wallType, ":", anchor);
        get().init(wallType);
    },

    // 设置指定墙面的图案参数，并重新初始化
    // 参数顺序调整为: patternName, proportionIndex, wallType(默认 "east")
    setPattern: (patternName, proportionIndex, wallType = "east") => {
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: { ...state.walls[wallType], patternName, proportionIndex }
            }
        }));
        setTimeout (() => {
            get().init(wallType);
        }, 0); // Delay to ensure state updates are applied before re-initializing
        // 按当前墙面的 layout 重新计算 anchor
        const currentLayout = get().walls[wallType].layout;
        get().setLayout(currentLayout, wallType);
    },

    // 更新指定墙面的 OSurfaceVertices，同时更新 surfaceVertices
    // 参数顺序调整为: OSurfaceVertices, wallType(默认 "east")
    setOSurfaceVertices: (OSurfaceVertices, wallType = "east") => {
        console.log(`Updating vertices for ${wallType}`, OSurfaceVertices);
        
        // Store new vertices for the target wall
        const newWalls = {};
        newWalls[wallType] = {
            ...get().walls[wallType],
            OSurfaceVertices: [...OSurfaceVertices]
        };
        
        // Extract dimensions from the new vertices
        const getWallDimensions = (vertices) => {
            const minX = Math.min(...vertices.map(v => v[0]));
            const maxX = Math.max(...vertices.map(v => v[0]));
            const minY = Math.min(...vertices.map(v => v[1]));
            const maxY = Math.max(...vertices.map(v => v[1]));
            
            return {
                width: maxX - minX,
                height: maxY - minY,
                minX, maxX, minY, maxY
            };
        };
        
        const dimensions = getWallDimensions(OSurfaceVertices);
        
        // Coordinate changes across walls based on the updated wall
        
        // Pair opposite walls (east-west, north-south)
        const oppositeWall = {
            east: 'west',
            west: 'east',
            north: 'south',
            south: 'north',
            floor: 'floor' // Floor is its own opposite for simplicity
        };
        
        // Keep track of walls we've already updated
        const updatedWalls = new Set([wallType]);
        
        // 1. Update the opposite wall (east-west or north-south pairing)
        if (wallType !== 'floor') {
            const opposite = oppositeWall[wallType];
            updatedWalls.add(opposite);
            
            // Copy dimensions but maintain the opposite wall's orientation
            const oppositeWallVertices = [...get().walls[opposite].OSurfaceVertices];
            
            // For opposite walls, dimensions should match but orientation differs
            if (wallType === 'east' || wallType === 'west') {
                // For east-west pair, maintain vertical alignment but match width
                const oppositeDims = getWallDimensions(oppositeWallVertices);
                
                // The base coordinates are maintained, just adapt width/height
                newWalls[opposite] = {
                    ...get().walls[opposite],
                    OSurfaceVertices: [
                        [oppositeDims.minX, oppositeDims.minY], 
                        [oppositeDims.minX + dimensions.width, oppositeDims.minY],
                        [oppositeDims.minX + dimensions.width, oppositeDims.minY + dimensions.height],
                        [oppositeDims.minX, oppositeDims.minY + dimensions.height]
                    ]
                };
            } 
            else if (wallType === 'north' || wallType === 'south') {
                // For north-south pair, maintain horizontal alignment but match width
                const oppositeDims = getWallDimensions(oppositeWallVertices);
                
                newWalls[opposite] = {
                    ...get().walls[opposite],
                    OSurfaceVertices: [
                        [oppositeDims.minX, oppositeDims.minY], 
                        [oppositeDims.minX + dimensions.width, oppositeDims.minY],
                        [oppositeDims.minX + dimensions.width, oppositeDims.minY + dimensions.height],
                        [oppositeDims.minX, oppositeDims.minY + dimensions.height]
                    ]
                };
            }
        }
        
        // 2. When any of east, south, north walls' height changes, update all 4 walls' heights
        if (wallType === 'east' || wallType === 'west' || wallType === 'north' || wallType === 'south') {
            const wallsToUpdate = ['east', 'west', 'north', 'south'].filter(w => !updatedWalls.has(w));
            
            wallsToUpdate.forEach(wall => {
                updatedWalls.add(wall);
                const currentVertices = [...get().walls[wall].OSurfaceVertices];
                const wallDims = getWallDimensions(currentVertices);
                
                // Update height while preserving width and position
                newWalls[wall] = {
                    ...get().walls[wall],
                    OSurfaceVertices: [
                        [wallDims.minX, wallDims.minY], 
                        [wallDims.maxX, wallDims.minY],
                        [wallDims.maxX, wallDims.minY + dimensions.height],
                        [wallDims.minX, wallDims.minY + dimensions.height]
                    ]
                };
            });
        }
        
        // 3. Update the floor based on wall dimensions
        if (!updatedWalls.has('floor')) {
            // Get the east-west dimension (which should now be consistent)
            const eastWallVertices = newWalls['east']?.OSurfaceVertices || get().walls['east'].OSurfaceVertices;
            const eastDims = getWallDimensions(eastWallVertices);
            
            // Get the north-south dimension (which should now be consistent)
            const northWallVertices = newWalls['north']?.OSurfaceVertices || get().walls['north'].OSurfaceVertices;
            const northDims = getWallDimensions(northWallVertices);
            
            // Floor should match east-west width and north-south width
            newWalls['floor'] = {
                ...get().walls['floor'],
                OSurfaceVertices: [
                    [0, 0],
                    [northDims.width, 0],
                    [northDims.width, eastDims.width],
                    [0, eastDims.width]
                ]
            };
        }
        
        // Special handling if floor was directly changed
        if (wallType === 'floor') {
            // Floor dimensions determine the dimensions of all walls
            const floorWidth = dimensions.width;  // north-south dimension
            const floorHeight = dimensions.height; // east-west dimension
            
            // Update east and west walls (they should have the same width as floor depth)
            ['east', 'west'].forEach(wall => {
                updatedWalls.add(wall);
                const currentVertices = [...get().walls[wall].OSurfaceVertices];
                const wallDims = getWallDimensions(currentVertices);
                const wallHeight = wallDims.height; // Preserve existing width
                
                newWalls[wall] = {
                    ...get().walls[wall],
                    OSurfaceVertices: [
                        [wallDims.minX, wallDims.minY], 
                        [wallDims.minX + floorHeight, wallDims.minY],
                        [wallDims.minX + floorHeight, wallDims.minY + wallHeight],
                        [wallDims.minX, wallDims.minY + wallHeight]
                    ]
                };
            });
            
            // Update north and south walls (they should have the same width as floor width)
            ['north', 'south'].forEach(wall => {
                updatedWalls.add(wall);
                const currentVertices = [...get().walls[wall].OSurfaceVertices];
                const wallDims = getWallDimensions(currentVertices);
                const wallHeight = wallDims.height; // Preserve existing height
                
                newWalls[wall] = {
                    ...get().walls[wall],
                    OSurfaceVertices: [
                        [wallDims.minX, wallDims.minY], 
                        [wallDims.minX + floorWidth, wallDims.minY],
                        [wallDims.minX + floorWidth, wallDims.minY + wallHeight],
                        [wallDims.minX, wallDims.minY + wallHeight]
                    ]
                };
            });
        }
        
        // Apply all the coordinated changes at once
        set(state => ({
            walls: {
                ...state.walls,
                ...newWalls
            }
        }));
        
        // Recalculate scale for all affected walls
        setTimeout(() => {
            Object.keys(newWalls).forEach(wall => {
                get().calculateScale(wall);
            });
        }, 0);

        setTimeout(() => {
            Object.keys(get().walls).forEach(wallType => {
                const wall = get().walls[wallType];
                if (wall.isInitialized) {
                    get().init(wallType);
    
                    // 按当前墙面的 layout 重新计算 anchor
                    const currentLayout = wall.layout;
                    get().setLayout(currentLayout, wallType);
                    console.log("Coordinated wall updates completed");
                }
            });
        }, 0); // Delay to ensure state updates are applied before re-initializing}
    },

    // 向指定墙面添加新的 OSurfaceVertex，并更新 surfaceVertices
    // 参数顺序调整为: OSurfaceVerTex, wallType(默认 "east")
    addOSurfaceVertex: (OSurfaceVerTex, wallType = "east") => {
        const wall = get().walls[wallType];
        if (!wall) {
            console.error("Invalid wall type:", wallType);
            return;
        }
        const newOSurfaceVertices = [...wall.OSurfaceVertices, ...OSurfaceVerTex];
        
        // First update the OSurfaceVertices
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: {
                    ...state.walls[wallType],
                    OSurfaceVertices: newOSurfaceVertices
                }
            }
        }));
        
    },

    // 移除指定墙面的所有孔洞数据
    // 只有一个参数，保持不变
    removeHoles: (wallType = "east") => {
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: {
                    ...state.walls[wallType],
                    OHoleVertices: [],
                    holeVertices: []
                }
            }
        }));
    },

    // 向指定墙面添加孔洞数据，并更新 holeVertices
    // 参数顺序调整为: OHoleVertex, wallType(默认 "east")
    addOHoleVertices: (OHoleVertex, wallType = "east") => {
        const wall = get().walls[wallType];
        if (!wall) {
            console.error("Invalid wall type:", wallType);
            return;
        }
        const newOHoleVertices = [...wall.OHoleVertices, ...OHoleVertex];
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: {
                    ...state.walls[wallType],
                    OHoleVertices: newOHoleVertices,
                    holeVertices: newOHoleVertices.map(([x, y]) => [x * state.scale, y * state.scale])
                }
            }
        }));
    },

    // 重置指定墙面为默认状态，并重新生成布局
    // 参数保持不变（只有一个参数）
    reset: (wallType = "east") => {
        set(state => ({
            walls: {
                ...state.walls,
                [wallType]: { ...defaultWallState, isWall: wallType === "floor" ? false : true }
            }
        }));
        setTimeout(() => get().init(wallType), 0);
    },

    // 设置当前选中的墙面
    setSelectedWall: (selectedWall) => {
        // 更新选中墙面
        set({ selectedWall });
        // 延后到下一个事件循环再初始化，避免依赖 console.log 的延迟副作用
        setTimeout(() => get().init(selectedWall), 0);
    },

    // 切换全局的 isWall（注意全局设置时不会影响各固定墙面的 isWall，
    // 各墙面 isWall 根据类型自动设置，因此这里仅作为全局标识参考）
    setIsWall: () => {
        set(state => ({ isWall: !state.isWall }));
    },

    // 设置全局 OGroutWidth，并刷新所有墙面的布局
    setOGroutWidth: (OGroutWidth) => {
        set({ OGroutWidth });
        setTimeout(() => {
            Object.keys(get().walls).forEach(wallType => {
                get().init(wallType);
            });
        }, 0);
    },

    // 全局设置 offsetX，遍历所有墙面进行更新
    setOffsetXGlobal: (offsetX) => {
        const walls = get().walls;
        const updatedWalls = {};
        setTimeout(() => {  
            Object.keys(walls).forEach(wallType => {
                updatedWalls[wallType] = { ...walls[wallType], offsetX };
                get().init(wallType);
            });
        }, 0);
        set({ walls: updatedWalls });
    },

    // 全局设置 offsetY，遍历所有墙面进行更新
    setOffsetYGlobal: (offsetY) => {
        const walls = get().walls;
        const updatedWalls = {};
        setTimeout(() => {
            Object.keys(walls).forEach(wallType => {
                updatedWalls[wallType] = { ...walls[wallType], offsetY };
                get().init(wallType);
            });
        }, 0)
        set({ walls: updatedWalls });
    },

    // Add a new method to calculate and set scale based on OSurfaceVertices
    calculateScale: (wallType = "east") => {
        const wall = get().walls[wallType];
        if (!wall || !wall.OSurfaceVertices || wall.OSurfaceVertices.length === 0) {
            console.error("Cannot calculate scale: Invalid wall or vertices");
            return;
        }
        
        const maxY = Math.max(...wall.OSurfaceVertices.map(v => v[1]));
        
        // Calculate new scale based on maxY only
        const newScale = 600 / maxY;
        
        // Only update if new scale is smaller than current scale
        const currentScale = get().scale;
        
        if (newScale < currentScale) {
            console.log(`Updating scale: ${currentScale} -> ${newScale} (from maxY=${maxY})`);
            
            // Update the global scale
            set({ scale: newScale });
            
            // Update all walls' surfaceVertices with the new scale
            const updatedWalls = {};
            Object.keys(get().walls).forEach(type => {
                updatedWalls[type] = {
                    ...get().walls[type],
                    surfaceVertices: get().walls[type].OSurfaceVertices.map(
                        ([x, y]) => [x * newScale, y * newScale]
                    )
                };
            });
            
            set(state => ({
                walls: {
                    ...state.walls,
                    ...updatedWalls
                }
            }));
        } else {
            console.log(`Keeping current scale: ${currentScale} (new scale ${newScale} not smaller)`);
            
            // Just update this wall's surfaceVertices with the current scale
            set(state => ({
                walls: {
                    ...state.walls,
                    [wallType]: {
                        ...state.walls[wallType],
                        surfaceVertices: state.walls[wallType].OSurfaceVertices.map(
                            ([x, y]) => [x * currentScale, y * currentScale]
                        )
                    }
                }
            }));
        }
        
        return get().scale; // Return the current scale (whether updated or not)
    },

    // Initialize all walls with coordinated OSurfaceVertices
    initializeWalls: () => {
        // Start with default dimensions
        const wallHeight = 3000;
        const roomWidth = 3000;  // east-west dimension
        const roomDepth = 3000;  // north-south dimension
        
        // Set OSurfaceVertices for all walls in a coordinated way
        set(state => ({
            walls: {
            ...state.walls,
            east: {
                ...state.walls.east,
                OSurfaceVertices: [
                [0, 0],
                [roomDepth, 0],
                [roomDepth, wallHeight],
                [0, wallHeight]
                ]
            },
            west: {
                ...state.walls.west,
                OSurfaceVertices: [
                [0, 0],
                [roomDepth, 0],
                [roomDepth, wallHeight],
                [0, wallHeight]
                ]
            },
            north: {
                ...state.walls.north,
                OSurfaceVertices: [
                [0, 0],
                [roomWidth, 0],
                [roomWidth, wallHeight],
                [0, wallHeight]
                ]
            },
            south: {
                ...state.walls.south,
                OSurfaceVertices: [
                [0, 0],
                [roomWidth, 0],
                [roomWidth, wallHeight],
                [0, wallHeight]
                ]
            },
            floor: {
                ...state.walls.floor,
                OSurfaceVertices: [
                [0, 0],
                [roomWidth, 0],
                [roomWidth, roomDepth],
                [0, roomDepth]
                ]
            }
            }
        }));
        
        // Calculate scale for each wall
        Object.keys(get().walls).forEach(wallType => {
            get().calculateScale(wallType);
        });
        
        console.log("All walls initialized with coordinated dimensions");
    },
}));


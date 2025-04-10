/* Tools */

// load surface from json
export const loadSurface = async () => {
    try {
        const response = await fetch("/TilePatterns.json");
        const data = await response.json();
        return data.surface;
    } catch (error) {
        console.error("Error loading surface", error);
        return [];
    }
};

// load patterns from json
export const loadPattern = async () => {
    try {
        const response = await fetch("/TilePatterns.json");
        const data = await response.json();
        return data.patterns;
    } catch (error) {
        console.error("Error loading patterns", error);
        return [];
    }
};

// Load scale from json
export const loadScale = async () => {
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
export const loadMinimumTileLength = async () => {
    try {
        const response = await fetch("/TilePatterns.json");
        const data = await response.json();
        return data.minimumTileLength;
    } catch (error) {
        console.error("Error loading minimum tile length", error);
        return 0;
    }
};

// load sizes from json
export const loadProps = async () => {
    try {
        const response = await fetch("/tileProps.json");
        const data = await response.json();
        return [data.CommonProps, data.TileProps];
    } catch (error) {
        console.error("Error loading tile sizes", error);
        return [];
    }
};




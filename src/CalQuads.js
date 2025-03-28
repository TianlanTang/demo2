import zustand from 'zustand';
import { calAnchors } from './CalAnchors';
import { pattern } from './pattern';

export const calQuads = async () => {
    try {
        const {
            tileVertices,
        } = pattern.get();

        const anchors = calAnchors();
    }
    catch (error) {
        console.error("Failed to calculate quads", error);
        return [];
    }
};

import {pattern} from './pattern.js';
import {loadSizes} from './tools.js';

const calCost = () => {
    const {
        tiles,
        propIndices,
        tileProps,
        totalAreaCovered,
        effectiveSurfaceArea,
    } = pattern.getState();

    const tileCount = new Array(tiles.length).fill(0);

    for (const tileGroup of tiles) {
        for (let index = 0; index < tileGroup.length; index++) {
            const tile = tileGroup[index];
            // tile is drawn
            if (tile.draw) {
                tileCount[index]++;
            }
        }
    }

    // GroutMixtureWaterContent
    const GroutMixtureWaterContent = 0.5; // 50% water content in grout mixture
    // GroutDensity
    const GroutDensity = 1600; // kg/m3
    
    // calculate the total cost of the tiles
    let titleCosts = [];
    //  calculate the total cost of Grout
    let maximumThickness = 0
    let maximumGroutCost = 0;
    for (let index = 0; index < tileCount.length; index++) {
        const propIndex = propIndices[index];
        const tileProp = tileProps[propIndex];
        const M2PerTile = (tileProp.Width * tileProp.Length) / 1000000 ; // convert from mm to m2
        const tileCost = tileCount[index] * M2PerTile * tileProp.Cost * tileProp.ContingencyFactor; // cost per tile
        titleCosts.Add(tileCost);

        maximumThickness = Math.max(maximumThickness, tileProp.GroutThickness);
        maximumGroutCost = Math.max(maximumGroutCost, tileProp.GroutCost); 
    }

    const groutCost = (effectiveSurfaceArea - totalAreaCovered) * maximumThickness * (1-GroutMixtureWaterContent) * GroutDensity * maximumGroutCost; // cost of grout



}
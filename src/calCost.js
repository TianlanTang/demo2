export const calCost = ({
    tiles,
    propIndices,
    commonProps,
    tileProps,
    tileAreaCovered,
    effectiveSurfaceArea,
    isWall,
}) => {
    const tileCount = new Array(tiles[0].length).fill(0);

    // calculate the preapartion cost 
    const preparationCostGeneral = commonProps.SurfacePreparationGeneral * effectiveSurfaceArea; // cost of preparation
    const preparationCostWaterProof = commonProps.SurfacePreparationWaterProof * effectiveSurfaceArea; // cost of waterproofing

    for (const tileGroup of tiles) {
        for (let index = 0; index < tileGroup.length; index++) {
            const tile = tileGroup[index];
            // tile is drawn
            if (tile.draw) {
                tileCount[index]++;
            }
        }
    }

    // tile names
    let tileNames = [];

    // calculate the total cost of the tiles
    let tileCosts = [];

    for (let index = 0; index < tileCount.length; index++) {
        const tileProp = tileProps[propIndices[index]];
        const M2PerTile = tileProp.Area / 1000000; // convert from mm to m2
        const tileCost = tileCount[index] * M2PerTile * commonProps.TileCost * commonProps.ContingencyFactor; // cost per tile
        tileNames.push(tileProp.Name);
        tileCosts.push(tileCost);
    }

    // Combine tileNames, tileCount, and tileCosts into a single array
    const tileSummary = tileNames.map((name, index) => ({
        tileName: name,
        count: tileCount[index],
        cost: tileCosts[index]
    }));

    const tileLayAndGroutCosts = tileAreaCovered * commonProps.LayAndGroutCost; // cost of tile laying and grouting
    const groutArea = effectiveSurfaceArea - tileAreaCovered;
    const groutMixRequiredm3 = groutArea * commonProps.GroutThickness / 1000 * commonProps.GroutContingencyFactor; // convert from mm to m3
    const netGroutRequiredm3 = groutMixRequiredm3 * (1 - commonProps.GroutMixtureWaterContent); // net grout required in m3
    const netGroutRequiredKg =netGroutRequiredm3 * commonProps.GroutDensity ; //  grout kg required
    const groutCost = netGroutRequiredKg * commonProps.GroutCost; // cost of grout
    const adhensiveRequiredKg = isWall
        ? tileAreaCovered * commonProps.AdhensiveWallCover
        : tileAreaCovered * commonProps.AdhensiveFloorCover; // cost of adhensive
    const adhensiveCost = adhensiveRequiredKg * commonProps.AdhensiveCost; // cost of adhensive

    const groutCostOnBag = commonProps.GroutCostPerBag * Math.ceil(netGroutRequiredKg / commonProps.GroutBagSize); // cost of grout on bag
    const adhensiveCostOnBag = commonProps.AdhensiveCostPerBag * Math.ceil(adhensiveRequiredKg / commonProps.AdhensiveBagSize); // cost of adhensive on bag

    return {
        costInfos: {
            totalCosts: tileCosts.reduce((acc, cost) => acc + cost, 0) + tileLayAndGroutCosts + groutCostOnBag + adhensiveCostOnBag,
            preparationCostGeneral,
            preparationCostWaterProof,
            effectiveSurfaceArea,
            tileAreaCovered,
            tileSummary, 
            tileMaterialCost: tileCosts.reduce((acc, cost) => acc + cost, 0),
            tileLayAndGroutCosts,
            groutArea,
            groutThickness: commonProps.GroutThickness,
            groutMixRequiredm3,
            groutMixtureWaterContent: commonProps.GroutMixtureWaterContent,
            groutDensity: commonProps.GroutDensity,
            netGroutRequiredm3,
            netGroutRequiredKg,
            groutCostPerKg: commonProps.GroutCost,
            groutCostOnWieght: groutCost,
            groutBagSize: commonProps.GroutBagSize,
            groutCostPerBag: commonProps.GroutCostPerBag,
            groutBagRequired: Math.ceil(netGroutRequiredKg / commonProps.GroutBagSize),
            groutCostOnBag,
            adhensiveCoverage: isWall ? commonProps.AdhensiveWallCover : commonProps.AdhensiveFloorCover,
            adhensiveRequiredKg: adhensiveRequiredKg,
            adhensiveCostPerKg: commonProps.AdhensiveCost,
            adhensiveCostOnWeight: adhensiveCost,
            adhensiveBagSize: commonProps.AdhensiveBagSize,
            adhensiveCostPerBag: commonProps.AdhensiveCostPerBag,
            adhensiveBagRequired: Math.ceil(adhensiveRequiredKg / commonProps.AdhensiveBagSize),
            adhensiveCostOnBag,
            },
        };
};
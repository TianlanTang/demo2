import React, { useState, useEffect } from 'react';
import { calCost } from './calCost';
import { useStore } from 'zustand';
import { pattern } from './pattern';

const CostInfo = () => {

    const {
        tiles,
        propIndices,
        tileProps,
        commonProps,
        tileAreaCovered,
        effectiveSurfaceArea,
        isWall,
    } = useStore(pattern);
	// required data for cost calculation

	// Use internal state for modal display and costInfos
	const [showModal, setShowModal] = useState(false);
	const [costInfos, setCostInfos] = useState(null);

	// When modal is shown, load costInfos
	useEffect(() => {
		if (showModal) {
			const updatedCosts = calCost({
				tiles,
				propIndices,
				tileProps,
				commonProps,
				tileAreaCovered,
				effectiveSurfaceArea,
				isWall,
			}).costInfos;
			setCostInfos(updatedCosts);
		}
	}, [showModal, tiles, propIndices, tileProps, commonProps, tileAreaCovered, effectiveSurfaceArea, isWall]);

	return (
		<div>
			{/* Always rendered button */}
			<button onClick={() => setShowModal(true)}>Show Cost Info</button>
			{/* Modal display when showModal is true */}
			{showModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 9999
					}}
				>
					<div
						style={{
							position: 'relative',
							backgroundColor: 'white',
							padding: '20px',
							borderRadius: '5px',
							maxWidth: '80%',
							maxHeight: '80%',
							overflowY: 'auto'
						}}
					>
						{/* Close button inside modal box at top-right */}
						<button
							onClick={() => setShowModal(false)}
							style={{
								position: 'absolute',
								top: '10px',
								right: '10px',
								border: 'none',
								background: 'transparent',
								fontSize: '20px',
								cursor: 'pointer'
							}}
						>
							x
						</button>
						<h3>Cost Information</h3>
						{costInfos && (
							<div>

                                <h4>Total Costs</h4>
                                <p>Total Costs ($): {costInfos.totalCosts.toFixed(4)}</p>
                                <p>Tile Material Cost ($): {costInfos.tileMaterialCost.toFixed(4)}</p>
                                <p>Tile Lay And Grout Costs ($): {costInfos.tileLayAndGroutCosts.toFixed(4)}</p>
                                <p>Grout Cost on Bag ($): {costInfos.groutCostOnBag.toFixed(4)}</p>
                                <p>Adhensive Cost on Bag ($): {costInfos.adhensiveCostOnBag.toFixed(4)}</p>

								<h4>General Information</h4>
								<p>Effective Surface Area (m²): {costInfos.effectiveSurfaceArea.toFixed(4)}</p>
								<p>Tile Area Covered (m²): {costInfos.tileAreaCovered.toFixed(4)}</p>
                                <p>Grout Area (m²): {costInfos.groutArea.toFixed(4)}</p>

								<h4>Tile Summary</h4>
								<table border="1" cellPadding="5" cellSpacing="0">
									<thead>
										<tr>
											<th>Tile Name</th>
											<th>Count</th>
											<th>Cost ($)</th>
										</tr>
									</thead>
									<tbody>
										{costInfos.tileSummary.map((tile, index) => (
											<tr key={index}>
												<td>{tile.tileName}</td>
												<td>{tile.count.toFixed(4)}</td>
												<td>{tile.cost.toFixed(4)}</td>
											</tr>
										))}
									</tbody>
								</table>

                                <h4>Tile Costs</h4>
                                <p>Tile Material Cost ($): {costInfos.tileMaterialCost.toFixed(4)}</p>
								<p>Tile Lay And Grout Costs ($): {costInfos.tileLayAndGroutCosts.toFixed(4)}</p>

								<h4>Grout Costs</h4>
								<p>Grout Area (m³): {costInfos.groutArea.toFixed(4)}</p>
								<p>Grout Thickness (mm): {costInfos.groutThickness.toFixed(4)}</p>
								<p>Net Grout Required (kg): {costInfos.netGroutRequiredKg.toFixed(4)}</p>
								<p>Grout Cost on Weight ($): {costInfos.groutCostOnWieght.toFixed(4)}</p>
								<p>Grout Cost on Bag ($): {costInfos.groutCostOnBag.toFixed(4)}</p>

								<h4>Adhensive Costs</h4>
								<p>Adhensive Required (kg): {costInfos.adhensiveRequiredKg.toFixed(4)}</p>
								<p>Adhensive Cost on Weight ($): {costInfos.adhensiveCostOnWeight.toFixed(4)}</p>
								<p>Adhensive Cost on Bag ($): {costInfos.adhensiveCostOnBag.toFixed(4)}</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default CostInfo;

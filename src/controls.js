import {
    Button,
    InputLabel,
    Slider,
    FormControl,
    Select,
    MenuItem,
    Typography,
    Box,
    TextField,
} from '@mui/material';
import { pattern } from './pattern';
import React, { useState } from 'react';
import { useStore } from 'zustand';
import { useEffect } from 'react';

const Controls = () => {

    // load controllers
    const {
        setSelectedWall,
        setPattern,
        setOffsetX,
        setOffsetY,
        reset,
        setOGroutWidth,
        minimumTileLength,
        setLayout,
        setOSurfaceVertices, // Add this function reference
    } = pattern.getState();

    const {
        patterns,
        selectedWall,
        walls,
        OGroutWidth
    } = useStore(pattern);

    // 使用 selectedWall 变量替代固定的 'east'
    const patternName = walls[selectedWall]['patternName'];
    const proportionIndex = walls[selectedWall]['proportionIndex'];
    const offsetX = walls[selectedWall]['offsetX'];
    const offsetY = walls[selectedWall]['offsetY'];
    const layout = walls[selectedWall]['layout'];
    
    // Get current wall vertices as string for display
    const currentVerticesStr = JSON.stringify(walls[selectedWall]?.OSurfaceVertices || []);
    
    // State for surface vertices input
    const [verticesInput, setVerticesInput] = useState(currentVerticesStr);
    const [verticesError, setVerticesError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Update vertices input when wall changes
    useEffect(() => {
        setVerticesInput(JSON.stringify(walls[selectedWall]?.OSurfaceVertices || []));
    }, [selectedWall, walls]);

    // Handle the vertices input submission
    const handleVerticesSubmit = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            
            try {
                // Parse the input as JSON
                const newVertices = JSON.parse(verticesInput);
                
                // Validate the format
                if (!Array.isArray(newVertices)) {
                    throw new Error('Vertices must be an array');
                }
                
                if (newVertices.length < 3) {
                    throw new Error('A surface needs at least 3 vertices');
                }
                
                // Check that each vertex is an array of two numbers
                for (const vertex of newVertices) {
                    if (!Array.isArray(vertex) || vertex.length !== 2 || 
                        typeof vertex[0] !== 'number' || typeof vertex[1] !== 'number') {
                        throw new Error('Each vertex must be an array of two numbers [x, y]');
                    }
                }
                
                // Update the vertices
                setOSurfaceVertices(newVertices, selectedWall);
                setVerticesError(false);
                setErrorMessage('');
                
            } catch (error) {
                setVerticesError(true);
                setErrorMessage(`Invalid format: ${error.message}`);
                console.error('Error parsing vertices:', error);
            }
        }
    };

    // load tile patterns
    const [tileProportions, setTileProportions] = useState([]);
    const [selectedBaseSize, setSelectedBaseSize] = useState([0, 0]);

    useEffect(() => {
        const patternFound = patterns.find((p) => p.name === patternName);
        if (patternFound) {
            setTileProportions(patternFound.tileProportion);
            setSelectedBaseSize([
                (patternFound.tileVertices[0][1][0] - patternFound.tileVertices[0][0][0]) * minimumTileLength, 
                (patternFound.tileVertices[0][2][1] - patternFound.tileVertices[0][1][1]) * minimumTileLength
            ]);
        }
    }, [selectedWall, patternName, patterns, minimumTileLength]);

    // update tileScales selection when patterns change
    const handlepatternChange = (e) => {
        const newPatternName = e.target.value;
        const patternFound = patterns.find((p) => p.name === newPatternName);
        if (patternFound) {
            // switch tile scales
            setTileProportions(patternFound.tileProportion);
            setPattern(newPatternName, 0, selectedWall);
            setSelectedBaseSize([
                (patternFound.tileVertices[0][1][0] - patternFound.tileVertices[0][0][0]) * minimumTileLength, 
                (patternFound.tileVertices[0][2][1] - patternFound.tileVertices[0][1][1]) * minimumTileLength
            ]);
        }
    };

    // update selected scale index
    const handleProportionChange = (e) => {
        const newProportionIndex = e.target.value;
        if (patternName !== '') {
            setPattern(patternName, newProportionIndex, selectedWall);
        }
    };

    // 墙面切换处理函数
    const handleWallChange = (e) => {
        setSelectedWall(e.target.value);
    };

    // output SVG file
    const exportSVG = () => {
        const svgElement = document.getElementById('tile_svg');
        if (!svgElement) {
            alert('SVG element not found');
            return;
        }
        // serialize SVG to XML
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        // detect missing namespace declarations
        if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }
        
        // add XML declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        // create a blob
        const blob = new Blob([source], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tileLayout.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
            <Box padding={2} sx={{ width: '100%', maxWidth: 600 }}>
                {/* 墙面选择菜单 */}
                <FormControl fullWidth sx={{ mb: 2, width: '300px' }}>
                    <InputLabel>Selected Surface</InputLabel>
                    <Select
                        value={selectedWall}
                        label="selected surface"
                        onChange={handleWallChange}
                    >
                        <MenuItem value="east">East</MenuItem>
                        <MenuItem value="west">West</MenuItem>
                        <MenuItem value="north">North</MenuItem>
                        <MenuItem value="south">South</MenuItem>
                        <MenuItem value="floor">Floor</MenuItem>
                    </Select>
                </FormControl>

                {/* Surface Vertices Input */}
                <Box sx={{ mb: 2, width: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Surface Vertices (Enter to submit)
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={verticesInput}
                        onChange={(e) => setVerticesInput(e.target.value)}
                        onKeyPress={handleVerticesSubmit}
                        error={verticesError}
                        helperText={verticesError ? errorMessage : "Format: [[x1,y1], [x2,y2], ...]"}
                        placeholder="[[0,0], [4500,0], [4500,3000], [0,3000]]"
                        sx={{ fontFamily: 'monospace' }}
                    />
                </Box>

                {/* Slider to control Grout Width */}
                <Typography id="grout-width-slider" gutterBottom> Grout Width {OGroutWidth} mm</Typography>
                <Slider
                    value={OGroutWidth}
                    step={5}
                    min={0}
                    max={40}
                    onChange={(e, value) => setOGroutWidth(value, selectedWall)}
                />

                {/* Slider to control Horizontal Offset */}
                <Typography id="horizontal-offset-slider" gutterBottom> Horizontal Offset {offsetX} mm </Typography>
                <Slider
                    value={offsetX}
                    step={5}
                    min={0}
                    max={500}
                    onChange={(e, value) => setOffsetX(value, selectedWall)}
                />

                {/* Slider to control Vertical Offset */}
                <Typography id="vertical-offset-slider" gutterBottom> Vertical Offset {offsetY} mm </Typography>
                <Slider
                    value={offsetY}
                    step={5}
                    min={0}
                    max={500}
                    onChange={(e, value) => setOffsetY(value, selectedWall)}  
                />
            </Box>       

            <Box padding={2} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 600 }}>
                <div style = {{ display: 'flex', flexDirection: 'row', gap: 10}}>
                    {/* Form to select tile patterns */}
                    <FormControl fullWidth sx={{ width: '300px' }}>
                        <InputLabel
                            sx={{
                                backgroundColor: 'white',
                                px: 1,                  
                            }}
                        >Tile Patterns</InputLabel>
                        <Select
                            value={patternName}
                            label="Tile Patterns"
                            onChange={handlepatternChange}
                        >
                            {patterns.map((pattern) => (
                                <MenuItem key={pattern.name} value={pattern.name}>
                                    {pattern.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Form to select tile proportions */}
                    {patternName  && (
                        <FormControl fullWidth sx={{ width: '300px' }}>
                            <InputLabel 
                                sx={{
                                    backgroundColor: 'white',
                                    px: 1,                  
                                }}
                            >Tile Width/Height</InputLabel>
                            <Select
                                value={proportionIndex}
                                label="Tile Scales"
                                onChange={handleProportionChange}
                            >
                                {tileProportions.map((proportion, index) => (
                                    <MenuItem key={index} value={index}>
                                        {`${(selectedBaseSize[0] * proportion[0] / proportion[1]).toFixed(0)} mm x ${(selectedBaseSize[1] * proportion[0] / proportion[1]).toFixed(0)} mm `}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                </div>
     
                {/* Form to select layout options */}
                <FormControl fullWidth sx={{ width: '300px' }}>
                    <InputLabel
                        sx={{
                            backgroundColor: 'white',
                            px: 1,                  
                        }}
                    >Layout Options</InputLabel>
                    <Select
                        value={layout}
                        label="Layout Options"
                        onChange={(e) => setLayout(e.target.value, selectedWall)}
                    >
                        <MenuItem value="TopLeft">TopLeft</MenuItem>
                        <MenuItem value="TopRight">TopRight</MenuItem>
                        <MenuItem value="BottomLeft">BottomLeft</MenuItem>
                        <MenuItem value="BottomRight">BottomRight</MenuItem>
                        <MenuItem value="LeftCenter">LeftCenter</MenuItem>
                        <MenuItem value="RightCenter">RightCenter</MenuItem>
                        <MenuItem value="TopCenter">TopCenter</MenuItem>
                        <MenuItem value="BottomCenter">BottomCenter</MenuItem>
                        <MenuItem value="Center">Center</MenuItem>
                    </Select>
                </FormControl> 
                <div>    
                    {/* Button to reset all values */}
                    <Button
                        variant="contained"
                        onClick={reset}
                        sx={{ mt: 1}}
                    >
                    Reset All setting
                    </Button>
                </div>

                <div>
                    {/* Export svg */}
                    <Button variant="contained" onClick={exportSVG}>
                        Export SVG
                    </Button>
                </div>

            </Box>

        </div>
    )
}

export default Controls;
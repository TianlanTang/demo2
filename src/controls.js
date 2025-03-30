import {
    Button,
    InputLabel,
    Slider,
    FormControl,
    Select,
    MenuItem,
    Typography,
    Box,
} from '@mui/material';
import { pattern } from './pattern';
import React, { useState } from 'react';
import {useStore} from 'zustand';


const Controls = () => {

    // load controllers
    const {
        setPattern,
        setOffsetX,
        setOffsetY,
        reset,
        setOGroutWidth,
        minimumTileLength,
        setLayout
    } = pattern.getState();

    const{
        patternName,
        proportionIndex,
        OGroutWidth,
        patterns,   
        offsetX,
        offsetY,
        layout,
    } = useStore(pattern);

    // load tile patterns
    const [tileProportions, setTileProportions] = useState([]);
    const [selectedBaseSize, setSelectedBaseSize] = useState([0, 0]);

    if (tileProportions.length === 0) {
        const pattern = patterns.find((p) => p.name === patternName);
        setTileProportions(pattern.tileProportion);
        setSelectedBaseSize([
            (pattern.tileVertices[0][1][0] - pattern.tileVertices[0][0][0]) * minimumTileLength, 
            (pattern.tileVertices[0][2][1] - pattern.tileVertices[0][1][1]) * minimumTileLength
        ]);
    }

    // update tileScales selection when patterns change
    const handlepatternChange = (e) => {
        const patternName = e.target.value;
        const pattern = patterns.find((p) => p.name === patternName);
        if (pattern) {
            
            // switch tile scales
            setTileProportions(pattern.tileProportion);
            setPattern(patternName, 0);
            setSelectedBaseSize([
                (pattern.tileVertices[0][1][0] - pattern.tileVertices[0][0][0]) * minimumTileLength, 
                (pattern.tileVertices[0][2][1] - pattern.tileVertices[0][1][1]) * minimumTileLength
            ]);
        }
    };

    // update selected scale index
    const handleProportionChange = (e) => {
        const proportionIndex = e.target.value;
        if (patternName !== '') {
            setPattern(patternName, proportionIndex);
        }
    }

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
        <div style = {{ display: 'flex', flexDirection: 'row'}}>
            <Box padding={2} width={600}>
        

                {/* Slider to control Grout Width */}
                <Typography id="grout-width-slider" gutterBottom> Grout Width {OGroutWidth} mm</Typography>
                <Slider
                    value={OGroutWidth}
                    step={5}
                    min={0}
                    max={40}
                    onChange={(e, value) => setOGroutWidth(value)}
                />

                {/* Slider to control Horizontal Offset */}
                <Typography id="horizontal-offset-slider" gutterBottom> Horizontal Offset {offsetX} mm </Typography>
                <Slider
                    value={offsetX}
                    step={5}
                    min={0}
                    max={500}
                    onChange={(e, value) => setOffsetX(value)}
                />
                {/* Slider to control Vertical Offset */}
                <Typography id="vertical-offset-slider" gutterBottom> Vertical Offset {offsetY} mm </Typography>
                <Slider
                    value={offsetY}
                    step={5}
                    min={0}
                    max={500}
                    onChange={(e, value) => setOffsetY(value)}  
                />
            </Box>       

            <Box padding= {2} sx={{display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                        {`${selectedBaseSize[0] * proportion[0] / proportion[1]} mm x ${selectedBaseSize[1] * proportion[0] / proportion[1]} mm `}
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
                        onChange={(e) => setLayout(e.target.value)}
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
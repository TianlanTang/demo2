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

import { LoadStore } from './loadStore';
import React, { useState, useEffect} from 'react';


const Controls = () => {

    // switch store
    const {setStore} = LoadStore.getState();
    const store = LoadStore.getState().activeStore();

    const {
        oSurfaceWidth,
        oSurfaceHeight,
        oGroutWidth,
        getTileWidth,
        getTileHeight,
        getScaleFactor,
        getGroutWidth,
        offsetX,
        offsetY,
        layoutOptions,
        hSpacing,
        vSpacing,
        setPattern,
        setSurfaceWidth,
        setSurfaceHeight,
        setGroutWidth,
        setOffsetX,
        setOffsetY,
        setLayoutOptions,
        setHSpacing,
        setVSpacing,
        reset,
    } = store;

    // load tile patterns
    const [patterns, setPatterns] = useState([]);
    const [selectedPattern, setSelectedPattern] = useState('');
    const [selectedBaseSize, setSelectedBaseSize] = useState([]);
    const [tileScales, setTileScales] = useState([]);
    const [selectedScaleIndex, setSelectedScaleIndex] = useState('');

    useEffect(() => {
        const loadPatterns = async () => {
            try {
                const response = await fetch("/oneTilePatterns.json");
                const data = await response.json();
                setPatterns(data.patterns);
            } catch (error) {
                console.error("Failed to load tile patterns", error);
            }
        };
        loadPatterns();
    }, []); 

    // update tileScales selection when patterns change
    const handlepatternChange = (e) => {
        const patternName = e.target.value;
        setSelectedPattern(patternName);
        const pattern = patterns.find((p) => p.name === patternName);
        if (pattern) {

            // switch store
            setStore(patternName);
            
            // switch tile scales
            setTileScales(pattern.tileScale);
            setSelectedScaleIndex('');
            setSelectedBaseSize([pattern.tiles[0].width, pattern.tiles[0].height]);
        }
    };

    // update selected scale index
    const handleScaleChange = (e) => {
        const scaleIndex = e.target.value;
        setSelectedScaleIndex(scaleIndex);
        if (selectedPattern !== '') {
            setPattern(selectedPattern, scaleIndex);
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
                {/*Slider to control Surface Width*/}
                {setSurfaceWidth && (
                    <div>
                        <Typography id="surface-width-slider" gutterBottom> Surface Width: {oSurfaceWidth} mm</Typography>
                            <Slider
                                value={oSurfaceWidth}
                                step={100}
                                min={1500}
                                max={4000}
                                onChange={(e, value) => setSurfaceWidth(value)} 
                            />
                    </div>
                )}
                {/* Slider to control Surface Height */}
                <Typography id="surface-height-slider" gutterBottom> Surface Height {oSurfaceHeight} mm</Typography>
                <Slider
                    value={oSurfaceHeight}
                    step={100}
                    min={1500}
                    max={4000}
                    onChange={(e, value) => setSurfaceHeight(value)}
                />  
                {/* Slider to control Grout Width */}
                <Typography id="grout-width-slider" gutterBottom> Grout Width {oGroutWidth} mm</Typography>
                <Slider
                    value={oGroutWidth}
                    step={5}
                    min={0}
                    max={40}
                    onChange={(e, value) => setGroutWidth(value)}
                />
                {/* Slider to control Horizontal Spacing */}
                {setHSpacing && (
                    <div>
                        <Typography id="horizontal-spacing-slider" gutterBottom> Horizontal Spacing {hSpacing / getScaleFactor()} mm </Typography>
                        <Slider
                            value={hSpacing}
                            step={getTileWidth() / 20}
                            min={0}
                            max={getTileWidth() / 2 + getGroutWidth()}
                            onChange={(e, value) => setHSpacing(value)}
                        />
                        {/* Slider to control Vertical Spacing */}
                        <Typography id="vertical-spacing-slider" gutterBottom> Vertical Spacing {vSpacing / getScaleFactor()} mm </Typography>
                        <Slider
                            value={vSpacing}
                            step={getTileHeight() / 20}
                            min={0}
                            max={getTileHeight() / 2 + getGroutWidth()}
                            onChange={(e, value) => setVSpacing(value)}
                        />
                    </div>
                )}

                {/* Slider to control Horizontal Offset */}
                <Typography id="horizontal-offset-slider" gutterBottom> Horizontal Offset {offsetX} mm </Typography>
                <Slider
                    value={offsetX}
                    step={5}
                    min={0}
                    max={getTileWidth() / 2 + getGroutWidth()}
                    onChange={(e, value) => setOffsetX(value)}
                />
                {/* Slider to control Vertical Offset */}
                <Typography id="vertical-offset-slider" gutterBottom> Vertical Offset {offsetY} mm </Typography>
                <Slider
                    value={offsetY}
                    step={5}
                    min={0}
                    max={getTileHeight() / 2 + getGroutWidth()}
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
                            value={selectedPattern}
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

                    {/* Form to select tile scales */}
                    {selectedPattern  && (
                        <FormControl fullWidth sx={{ width: '300px' }}>
                            <InputLabel 
                                sx={{
                                    backgroundColor: 'white',
                                    px: 1,                  
                                }}
                            >Tile Width/Height</InputLabel>
                            <Select
                                value={selectedScaleIndex}
                                label="Tile Scales"
                                onChange={handleScaleChange}
                            >
                                {tileScales.map((scale, index) => (
                                    <MenuItem key={index} value={index}>
                                        {`${selectedBaseSize[0] * scale[0] / scale[1]} mm x ${selectedBaseSize[1] * scale[0] / scale[1]} mm `}
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
                        value={layoutOptions}
                        label="Layout Options"
                        onChange={(e) => setLayoutOptions(e.target.value)}
                    >
                        <MenuItem value="leftTop">leftTop</MenuItem>
                        <MenuItem value="rightTop">rightTop</MenuItem>
                        <MenuItem value="leftBottom">leftBottom</MenuItem>
                        <MenuItem value="rightBottom">rightBottom</MenuItem>
                        <MenuItem value="leftCenter">leftCenter</MenuItem>
                        <MenuItem value="rightCenter">rightCenter</MenuItem>
                        <MenuItem value="topCenter">topCenter</MenuItem>
                        <MenuItem value="bottomCenter">bottomCenter</MenuItem>
                        <MenuItem value="center">center</MenuItem>
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
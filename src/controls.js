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
import { useStore } from './store';

const Controls = () => {
    const {
        oSurfaceWidth,
        oSurfaceHeight,
        oTileWidth,
        oTileHeight,
        oGroutWidth,
        getTileWidth,
        getTileHeight,
        getScaleFactor,
        offsetX,
        offsetY,
        layoutOptions,
        hSpacing,
        vSpacing,
        setTileWidth,
        setTileHeight,
        setSurfaceWidth,
        setSurfaceHeight,
        setGroutWidth,
        setOffsetX,
        setOffsetY,
        setLayoutOptions,
        setHSpacing,
        setVSpacing,
        reset,
    } = useStore();
    
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
                <Typography id="surface-width-slider" gutterBottom> Surface Width: {oSurfaceWidth} mm</Typography>
                <Slider
                    value={oSurfaceWidth}
                    step={100}
                    min={1500}
                    max={4000}
                    onChange={(e, value) => setSurfaceWidth(value)} 
                />
                {/* Slider to control Surface Height */}
                <Typography id="surface-height-slider" gutterBottom> Surface Height {oSurfaceHeight} mm</Typography>
                <Slider
                    value={oSurfaceHeight}
                    step={100}
                    min={1500}
                    max={4000}
                    onChange={(e, value) => setSurfaceHeight(value)}
                />  
                {/* Slider to control Tile Width */}
                <Typography id="tile-width-slider" gutterBottom> Tile Width {oTileWidth} mm</Typography>
                <Slider
                    value={oTileWidth}
                    step={10}
                    min={200}
                    max={800}
                    onChange={(e, value) => setTileWidth(value)}
                />
                {/* Slider to control Tile Height */}
                <Typography id="tile-height-slider" gutterBottom> Tile Height {oTileHeight} mm</Typography>
                <Slider
                    value={oTileHeight}
                    step={10}
                    min={200}
                    max={800}
                    onChange={(e, value) => setTileHeight(value)}
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
                <Typography id="horizontal-spacing-slider" gutterBottom> Horizontal Spacing {hSpacing / getScaleFactor()} mm </Typography>
                <Slider
                    value={hSpacing}
                    step={getTileWidth() / 20}
                    min={0}
                    max={getTileWidth() / 2}
                    onChange={(e, value) => setHSpacing(value)}
                />
                {/* Slider to control Vertical Spacing */}
                <Typography id="vertical-spacing-slider" gutterBottom> Vertical Spacing {vSpacing / getScaleFactor()} mm </Typography>
                <Slider
                    value={vSpacing}
                    step={getTileHeight() / 20}
                    min={0}
                    max={getTileHeight() / 2}
                    onChange={(e, value) => setVSpacing(value)}
                />  
            </Box>       

            <Box padding= {2} sx={{display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Form to select layout options */}
                <FormControl fullWidth sx={{ width: '300px' }}>
                    <InputLabel>Layout Options</InputLabel>
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
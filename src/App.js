import TileMap from './tileMap';
import Controls from './controls';
import { pattern } from './pattern';
import { useEffect } from 'react';

function App() {
    useEffect(() => {
        pattern.getState().init();
    }, []);
    
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'auto'
        }}>
            {/* Area for canvas */}
            <div style={{
                flex: '0 0 60vh', // set canvas area to 60% of viewport height
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#fff'
            }}>
                <TileMap />
            </div>

            {/* Area for controls */}
            <div style={{
                flex: '0 0 40vh', // set controls area to 40% of viewport height
                width: '100%',
                padding: '10px',
                boxSizing: 'border-box',
                backgroundColor: '#f9f9f9',
                overflowY: 'auto'
            }}>
                <Controls />
            </div>
        </div>
    );
}

export default App;

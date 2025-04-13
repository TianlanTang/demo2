import TileMap from './tileMap';
import Controls from './controls';
import { pattern } from './pattern';
import { useEffect } from 'react';
import CostInfo from './costInfo';
import TileHints from './tileHints';

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
            {/* Row container for CostInfo, Canvas and DictionaryDisplay */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 60vh'
            }}>
                {/* CostInfo on the left */}
                <div style={{ marginRight: '20px' }}>
                    <CostInfo />
                </div>
                {/* Canvas area */}
                <div style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#fff'
                }}>
                    <TileMap />
                </div>
                {/* tileHints on the right */}
                <div style={{ marginLeft: '20px' }}>
                    <TileHints />
                </div>
            </div>
            
            {/* Area for controls */}
            <div style={{
                flex: '0 0 40vh',
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

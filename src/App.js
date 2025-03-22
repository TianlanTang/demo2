import TileMap from './tileMap';
import Controls from './controls';
import { useEffect } from 'react';
import { useStore } from './store';

function App() {
  useEffect(() => {
    // initialize layout, generate initial tile array
    useStore.getState().init();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',  // Change direction to column
      height: '100vh',
      overflow: 'hidden'
    }}>

      {/* Area for canvas */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',  // Center the TileMap view
        alignItems: 'center',
        backgroundColor: '#fff'
      }}>
        <TileMap />
      </div>

      {/* Area for controls */}
      <div style={{
        width: '100%',  // Ensure it takes full width
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

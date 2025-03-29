import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { pattern } from './pattern';

await pattern.getState().preloadData();
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);



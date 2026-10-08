import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/* Global styles — order matters: tokens first, then globals, then components */
import './styles/tokens.css';
import './styles/globals.css';
import './styles/components.css';

/* Spin keyframe used by Button loading state */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from './runtime.js';
import App from './IronLog.jsx';

globalThis.ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(App)
);

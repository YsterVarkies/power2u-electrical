import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/jost';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import 'lenis/dist/lenis.css';
import './styles/global.css';

import App from './App.jsx';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

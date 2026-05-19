import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import 'flag-icons/css/flag-icons.min.css';
import App from './App.tsx';
import { useAuth } from './store/useAuth';
import { initSync } from './lib/sync';

void useAuth.getState().initialize();
void initSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

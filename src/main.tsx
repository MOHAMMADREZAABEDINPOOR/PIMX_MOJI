import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PimxMojiAdmin } from './admin/PimxMojiAdmin.tsx';
import './index.css';

const path = window.location.pathname.replace(/\/+$/, '');
const isAdminRoute = path === '/pimxmojiadmin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <PimxMojiAdmin /> : <App />}
  </StrictMode>,
);

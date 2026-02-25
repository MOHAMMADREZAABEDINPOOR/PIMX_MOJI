import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PimxMojiAdmin } from './admin/PimxMojiAdmin.tsx';
import './index.css';

const path = window.location.pathname.replace(/\/+$/, '');
const isAdminRoute = path === '/pimxmojiadmin';

const upsertMeta = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
};

if (isAdminRoute) {
  document.title = 'PIMXMOJI Admin Panel';
  upsertMeta('robots', 'noindex, nofollow, noarchive');
} else {
  upsertMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <PimxMojiAdmin /> : <App />}
  </StrictMode>,
);

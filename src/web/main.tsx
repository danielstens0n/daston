import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GOOGLE_FONTS_STYLESHEET_HREF } from './lib/fonts.ts';
import { routeTree } from './routeTree.gen.ts';
import './tokens.css';

if (!document.getElementById('daston-google-fonts')) {
  const fontsLink = document.createElement('link');
  fontsLink.id = 'daston-google-fonts';
  fontsLink.rel = 'stylesheet';
  fontsLink.href = GOOGLE_FONTS_STYLESHEET_HREF;
  document.head.appendChild(fontsLink);
}

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

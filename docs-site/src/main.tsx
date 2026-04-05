import React from 'react';
import { createRoot } from 'react-dom/client';
import Prism from 'prismjs';
// Prism must be on the window object for the components to register themselves correctly
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import './styles/global.css';
import { App } from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);

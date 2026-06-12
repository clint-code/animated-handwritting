import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
//import HandwritingExportPage from './HandwritingExportPage.tsx';
//import SignatureAnimationPage from './SignatureAnimationPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* <HandwritingExportPage /> */}
  </StrictMode>
);

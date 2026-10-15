import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './styles.css';

// StrictMode izstrādes laikā komponentes un efektus izpilda papildu reizi, lai atklātu kļūdas
// (netīras komponentes, trūkstošu sakopšanu). Gatavajā versijā tas neko nemaina.
// ErrorBoundary notver kļūdas renderēšanas laikā, lai nepaliktu tukša lapa.
const container = document.getElementById('root');
if (!container) throw new Error('Nav elementa #root (skat. index.html)');

createRoot(container).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>,
);

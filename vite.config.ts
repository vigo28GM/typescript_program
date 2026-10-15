import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Ports 5501, lai šo versiju varētu palaist vienlaikus ar JavaScript versiju (5500).
export default defineConfig({
    plugins: [react()],
    server: { host: '127.0.0.1', port: 5501, strictPort: true },
    preview: { host: '127.0.0.1', port: 5501, strictPort: true },
});

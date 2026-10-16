import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Pēc katra testa noņem renderēto komponenti un notīra saglabātos datus
afterEach(() => {
    cleanup();
    localStorage.clear();
});

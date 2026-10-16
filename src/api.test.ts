import { describe, expect, it } from 'vitest';
import { ApiError, isAbortError } from './api.ts';

describe('isAbortError', () => {
    it('recognises an aborted request', () => {
        expect(isAbortError(new DOMException('cancelled', 'AbortError'))).toBe(true);
    });

    it('ignores other errors and values', () => {
        expect(isAbortError(new Error('boom'))).toBe(false);
        expect(isAbortError(null)).toBe(false);
        expect(isAbortError('AbortError')).toBe(false);
    });
});

describe('ApiError', () => {
    it('keeps the status and the server data', () => {
        const error = new ApiError('Nav atrasts', 404, { message: 'x' });
        expect(error).toBeInstanceOf(Error);
        expect(error.status).toBe(404);
        expect(error.data).toEqual({ message: 'x' });
        expect(error.message).toBe('Nav atrasts');
    });
});

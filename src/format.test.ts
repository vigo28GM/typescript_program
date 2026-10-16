import { describe, expect, it } from 'vitest';
import { formatDate, hidePasswords, statusName } from './format.ts';

describe('statusName', () => {
    it('returns the name of a known status', () => {
        expect(statusName(1)).toBe('public');
        expect(statusName(2)).toBe('private');
    });

    it('falls back to #id for an unknown status', () => {
        expect(statusName(99)).toBe('#99');
    });
});

describe('formatDate', () => {
    it('returns an empty string when there is no date', () => {
        expect(formatDate(null)).toBe('');
        expect(formatDate(undefined)).toBe('');
        expect(formatDate('')).toBe('');
    });

    it('formats an ISO date as text', () => {
        expect(formatDate('2026-09-29T05:54:16.000000Z')).toMatch(/2026/);
    });
});

describe('hidePasswords', () => {
    it('masks every field that starts with "password"', () => {
        const result = hidePasswords({ email: 'a@a.lv', password: 'secret', password_confirmation: 'secret' });
        expect(result).toEqual({ email: 'a@a.lv', password: '••••••', password_confirmation: '••••••' });
    });

    it('does not change the original object', () => {
        const body = { password: 'secret' };
        hidePasswords(body);
        expect(body.password).toBe('secret');
    });

    it('passes non-objects through', () => {
        expect(hidePasswords(null)).toBeNull();
        expect(hidePasswords('text')).toBe('text');
    });
});

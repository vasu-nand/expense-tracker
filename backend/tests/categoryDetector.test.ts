import { test } from 'node:test';
import assert from 'node:assert';
import { detectCategory } from '../src/utils/categoryDetector';

test('Category Detector Unit Tests', async (t) => {
    await t.test('should match Transport for ola/uber taxi rides', () => {
        const result = detectCategory('Ola Cab Ride to office', 'dummy-account-id');
        assert.strictEqual(result, 'Transport');
    });

    await t.test('should match Rent for house rent payments', () => {
        const result = detectCategory('Flat rent for July', 'dummy-account-id');
        assert.strictEqual(result, 'Rent');
    });

    await t.test('should match Groceries for Blinkit orders', () => {
        const result = detectCategory('Blinkit order #10837', 'dummy-account-id');
        assert.strictEqual(result, 'Groceries');
    });

    await t.test('should return Others for unknown transaction reasons', () => {
        const result = detectCategory('Random item description here', 'dummy-account-id');
        assert.strictEqual(result, 'Others');
    });
});

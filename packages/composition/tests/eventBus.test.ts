import { describe, it, expect, vi } from 'vitest';

describe('eventBus', () => {
  it('is grabbed from globalThis.eventBus', async () => {
    const fake = { on: vi.fn(() => () => {}) };
    (globalThis as { eventBus?: unknown }).eventBus = fake;

    const { eventBus } = await import('../src/index');

    expect(eventBus).toBe(fake);
  });
});

/** Private, device-local navigation history; stores only public vehicle identifiers. */
const KEY = 'jarcar:recent:v1';
const MAX_ITEMS = 8;
export const recentChangeEvent = 'jarcar:recent-change';
const ID = /^[a-z0-9][a-z0-9-]{1,90}$/;
export function readRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? [...new Set(value.filter((x): x is string => typeof x === 'string' && ID.test(x)))].slice(0, MAX_ITEMS) : [];
  } catch { return []; }
}
export function rememberVehicle(id: string): void {
  if (!ID.test(id) || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([id, ...readRecent().filter(x => x !== id)].slice(0, MAX_ITEMS)));
    window.dispatchEvent(new Event(recentChangeEvent));
  } catch { /* Disabled storage should not affect navigation. */ }
}
export function clearRecent(): void {
  try { window.localStorage.removeItem(KEY); window.dispatchEvent(new Event(recentChangeEvent)); } catch { /* Browsers may block storage. */ }
}

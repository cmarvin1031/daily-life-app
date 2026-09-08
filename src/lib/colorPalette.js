// Matches the app's core design tokens (see index.css) so assigned colors
// (habits, notebooks, ...) stay within the established palette rather than
// introducing arbitrary hues.
export const PALETTE_COLORS = [
  { key: 'green', value: 'var(--accent)' },
  { key: 'blue', value: 'var(--chip-blue)' },
  { key: 'orange', value: 'var(--chip-orange)' },
  { key: 'purple', value: 'var(--chip-purple)' },
  { key: 'teal', value: 'var(--chip-teal)' },
];

export function paletteColorValue(key) {
  return PALETTE_COLORS.find((c) => c.key === key)?.value ?? PALETTE_COLORS[0].value;
}

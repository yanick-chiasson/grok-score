// Two tones per color: bright for dark theme, deeper for light theme (readable on cream).
const PALETTE = [
  ['#e8c84a', '#8a6a00'],
  ['#e8604a', '#b0301e'],
  ['#4a9ee0', '#1c5f96'],
  ['#4cc07c', '#1a7a3e'],
  ['#b07ae0', '#6e3aa0'],
  ['#f0943a', '#a85410'],
  ['#e06aa8', '#a02a68'],
  ['#3cc4bc', '#137a74'],
];

export const PALETTE_SIZE = PALETTE.length;

export function color(idx, theme) {
  const c = PALETTE[((idx % PALETTE.length) + PALETTE.length) % PALETTE.length];
  return theme === 'light' ? c[1] : c[0];
}

// ─── Échelle typographique TUNNEL GMAO ──────────────────────────────────────
// Stack : System font (SF Pro iOS / Roboto Android / system-ui web)
// Base : 14px — jamais < 16px sur les inputs (évite le zoom iOS)

export const fontFamily = {
  sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
}

export const fontSize = {
  h1:    { size: '24px', lineHeight: '32px', weight: '600' },
  h2:    { size: '20px', lineHeight: '28px', weight: '600' },
  h3:    { size: '17.6px', lineHeight: '24px', weight: '600' },
  body:  { size: '14px', lineHeight: '20px', weight: '400' },
  small: { size: '12px', lineHeight: '16px', weight: '400' },
  badge: { size: '12px', lineHeight: '16px', weight: '500' },
  input: { size: '16px', lineHeight: '24px', weight: '400' }, // min iOS no-zoom
}

// Tailwind utility classes correspondantes
export const textClasses = {
  h1:    'text-2xl font-semibold leading-8',
  h2:    'text-xl font-semibold leading-7',
  h3:    'text-[17.6px] font-semibold leading-6',
  body:  'text-sm font-normal leading-5',
  small: 'text-xs font-normal leading-4',
  badge: 'text-xs font-medium leading-4',
  input: 'text-base font-normal leading-6',
}

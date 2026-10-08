/**
 * Avatar — initials-based avatar with color derived from name hash.
 * Falls back gracefully if name is empty.
 *
 * Props:
 *   name   — full name string
 *   size   — 'sm' (28px) | 'md' (40px) | 'lg' (56px) | 'xl' (80px)
 *   src    — optional image URL
 */

const PALETTE = [
  ['#FFD23F', '#14131A'],   /* yellow  / dark */
  ['#2B4BFF', '#FFFFFF'],   /* blue    / white */
  ['#FF6B5E', '#FFFFFF'],   /* coral   / white */
  ['#8B5CFF', '#FFFFFF'],   /* violet  / white */
  ['#10B981', '#FFFFFF'],   /* green   / white */
  ['#F59E0B', '#14131A'],   /* amber   / dark  */
];

const SIZES = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
};

function hashName(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % PALETTE.length;
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name = '', size = 'md', src, style = {}, ...props }) {
  const px = SIZES[size] ?? SIZES.md;
  const [bg, fg] = PALETTE[hashName(name)];
  const fontSize = px < 36 ? `${px * 0.38}px` : `${px * 0.36}px`;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={px}
        height={px}
        style={{
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style,
        }}
        {...props}
      />
    );
  }

  return (
    <div
      aria-label={name}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 'var(--weight-bold)',
        fontFamily: 'var(--font-heading)',
        flexShrink: 0,
        userSelect: 'none',
        ...style,
      }}
      {...props}
    >
      {getInitials(name)}
    </div>
  );
}

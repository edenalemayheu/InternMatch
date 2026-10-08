/**
 * SVG illustrations for the landing page.
 * These match the figures from internmatch-v4.html — student with laptop,
 * recruiter with clipboard, city buildings.
 */

export function StudentFigure({ width = 110, style = {} }) {
  return (
    <svg viewBox="0 0 110 160" width={width} fill="none" aria-hidden="true" style={{ display: 'block', ...style }}>
      {/* Shadow */}
      <ellipse cx="55" cy="150" rx="28" ry="8" fill="#2B4BFF" opacity="0.10" />
      {/* Legs */}
      <rect x="41" y="118" width="12" height="26" rx="6" fill="#1a1a2e" />
      <rect x="57" y="118" width="12" height="26" rx="6" fill="#1a1a2e" />
      {/* Shoes */}
      <ellipse cx="47" cy="145" rx="9" ry="5" fill="#14131A" />
      <ellipse cx="63" cy="145" rx="9" ry="5" fill="#14131A" />
      {/* Torso */}
      <rect x="36" y="72" width="38" height="50" rx="14" fill="#2B4BFF" />
      {/* Collar */}
      <path d="M48 72 L55 84 L62 72" stroke="white" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      {/* Arms */}
      <path d="M36 80 Q22 86 24 100" stroke="#F5C89A" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M74 80 Q88 86 86 100" stroke="#F5C89A" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* Laptop */}
      <rect x="18" y="97" width="32" height="22" rx="3" fill="#E0E7FF" stroke="#2B4BFF" strokeWidth="1.5" />
      <rect x="20" y="99" width="28" height="15" rx="2" fill="#2B4BFF" opacity="0.25" />
      {/* Laptop screen glow */}
      <rect x="22" y="101" width="12" height="2" rx="1" fill="#2B4BFF" opacity="0.6" />
      <rect x="22" y="105" width="18" height="2" rx="1" fill="#2B4BFF" opacity="0.4" />
      <rect x="22" y="109" width="10" height="2" rx="1" fill="#2B4BFF" opacity="0.4" />
      <rect x="16" y="119" width="36" height="3" rx="1.5" fill="#2B4BFF" opacity="0.3" />
      {/* Neck */}
      <rect x="49" y="62" width="12" height="14" rx="6" fill="#F5C89A" />
      {/* Head */}
      <circle cx="55" cy="48" r="22" fill="#F5C89A" />
      {/* Hair */}
      <path d="M33 44 Q34 22 55 20 Q76 22 77 44" fill="#2D1B00" />
      <path d="M33 44 Q30 50 34 56" fill="#2D1B00" />
      {/* Eyes */}
      <ellipse cx="48" cy="47" rx="3.5" ry="4" fill="white" />
      <ellipse cx="62" cy="47" rx="3.5" ry="4" fill="white" />
      <circle cx="49" cy="48" r="2.2" fill="#14131A" />
      <circle cx="63" cy="48" r="2.2" fill="#14131A" />
      <circle cx="49.8" cy="47" r="0.7" fill="white" />
      <circle cx="63.8" cy="47" r="0.7" fill="white" />
      {/* Smile */}
      <path d="M48 57 Q55 63 62 57" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Graduation cap */}
      <rect x="34" y="30" width="42" height="8" rx="3" fill="#14131A" />
      <rect x="47" y="22" width="16" height="12" rx="3" fill="#14131A" />
      {/* Tassel */}
      <line x1="74" y1="34" x2="82" y2="50" stroke="#FFD23F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="82" cy="53" r="3.5" fill="#FFD23F" />
    </svg>
  );
}

export function RecruiterFigure({ width = 110, style = {} }) {
  return (
    <svg viewBox="0 0 110 160" width={width} fill="none" aria-hidden="true" style={{ display: 'block', ...style }}>
      <ellipse cx="55" cy="150" rx="28" ry="8" fill="#8B5CFF" opacity="0.10" />
      {/* Legs */}
      <rect x="41" y="118" width="12" height="26" rx="6" fill="#0d0d1a" />
      <rect x="57" y="118" width="12" height="26" rx="6" fill="#0d0d1a" />
      <ellipse cx="47" cy="145" rx="9" ry="5" fill="#14131A" />
      <ellipse cx="63" cy="145" rx="9" ry="5" fill="#14131A" />
      {/* Suit trousers */}
      <rect x="36" y="98" width="38" height="24" rx="8" fill="#1a1a2e" />
      {/* Suit jacket */}
      <rect x="34" y="68" width="42" height="38" rx="14" fill="#14131A" />
      {/* Lapels */}
      <path d="M44 68 L55 82 L66 68" stroke="#2a2a3a" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      {/* White shirt */}
      <rect x="51" y="68" width="8" height="22" rx="2" fill="white" opacity="0.9" />
      {/* Tie */}
      <polygon points="55,70 58,85 55,92 52,85" fill="#FF6B5E" />
      {/* Arms */}
      <path d="M34 76 Q20 84 22 100" stroke="#C68642" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M76 76 Q90 84 88 100" stroke="#C68642" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* Clipboard */}
      <rect x="85" y="86" width="24" height="32" rx="3" fill="white" stroke="#8B5CFF" strokeWidth="1.5" />
      <rect x="91" y="80" width="12" height="8" rx="3" fill="#8B5CFF" opacity="0.8" />
      <rect x="88" y="92" width="18" height="2" rx="1" fill="#8B5CFF" opacity="0.5" />
      <rect x="88" y="97" width="18" height="2" rx="1" fill="#8B5CFF" opacity="0.5" />
      <rect x="88" y="102" width="12" height="2" rx="1" fill="#8B5CFF" opacity="0.4" />
      <rect x="88" y="107" width="15" height="2" rx="1" fill="#8B5CFF" opacity="0.3" />
      {/* Neck */}
      <rect x="49" y="60" width="12" height="14" rx="6" fill="#C68642" />
      {/* Head */}
      <circle cx="55" cy="46" r="22" fill="#C68642" />
      {/* Hair */}
      <path d="M33 40 Q35 20 55 18 Q75 20 77 40 L77 44 Q72 30 55 28 Q38 30 33 44 Z" fill="#3D1C02" />
      {/* Eyes */}
      <ellipse cx="48" cy="45" rx="3.5" ry="4" fill="white" />
      <ellipse cx="62" cy="45" rx="3.5" ry="4" fill="white" />
      <circle cx="49" cy="46" r="2.2" fill="#14131A" />
      <circle cx="63" cy="46" r="2.2" fill="#14131A" />
      <circle cx="49.8" cy="45" r="0.7" fill="white" />
      <circle cx="63.8" cy="45" r="0.7" fill="white" />
      {/* Smile — professional, slight */}
      <path d="M49 55 Q55 60 61 55" stroke="#7A4520" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BuildingsFigure({ width = 200, style = {} }) {
  return (
    <svg viewBox="0 0 200 120" width={width} fill="none" aria-hidden="true" style={{ display: 'block', ...style }}>
      <rect x="0" y="108" width="200" height="12" rx="6" fill="#E0E7FF" opacity="0.4" />
      {/* Tall building */}
      <rect x="18" y="28" width="42" height="80" rx="4" fill="#2B4BFF" opacity="0.68" />
      {[38,54,70,86].map(y => [28,38,48].map(x => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fill="white" opacity={x===48&&y===54?"0.9":"0.75"} />
      )))}
      <rect x="33" y="92" width="12" height="16" rx="2" fill="#14131A" opacity="0.4" />
      {/* Mid building */}
      <rect x="74" y="56" width="54" height="52" rx="4" fill="#8B5CFF" opacity="0.60" />
      {[66,82,98].map(y => [84,98,112].map(x => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fill="white" opacity={x===112&&y===66?"0.9":"0.72"} />
      )))}
      <rect x="92" y="92" width="14" height="16" rx="2" fill="#14131A" opacity="0.4" />
      {/* Right building */}
      <rect x="142" y="42" width="46" height="66" rx="4" fill="#FF6B5E" opacity="0.55" />
      {[52,68,84,100].map(y => [152,166].map(x => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fill="white" opacity={x===152&&y===68?"0.9":"0.70"} />
      )))}
      <rect x="153" y="92" width="12" height="16" rx="2" fill="#14131A" opacity="0.4" />
      {/* Stars */}
      <circle cx="100" cy="12" r="2.2" fill="#FFD23F" opacity="0.85" />
      <circle cx="48"  cy="8"  r="1.5" fill="#FFD23F" opacity="0.65" />
      <circle cx="162" cy="16" r="1.5" fill="#FFD23F" opacity="0.75" />
      <circle cx="130" cy="6"  r="1"   fill="white"   opacity="0.85" />
      <circle cx="68"  cy="20" r="1"   fill="white"   opacity="0.85" />
    </svg>
  );
}

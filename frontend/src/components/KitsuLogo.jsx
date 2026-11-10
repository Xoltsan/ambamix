import React from 'react';

export default function KitsuLogo({ size = 36, className = '', glow = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="KitsuMix Kitsune Logo"
    >
      <defs>
        <linearGradient id="kitsuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E7FF" />
          <stop offset="50%" stopColor="#00A4FF" />
          <stop offset="100%" stopColor="#0052FF" />
        </linearGradient>
        {glow && (
          <filter id="kitsuGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#00E7FF" floodOpacity="0.55" />
          </filter>
        )}
      </defs>
      <g filter={glow ? 'url(#kitsuGlow)' : undefined}>
        {/* Ears Outer */}
        <path d="M50 36 L20 12 L28 44 Z" fill="url(#kitsuGrad)" />
        <path d="M50 36 L80 12 L72 44 Z" fill="url(#kitsuGrad)" />

        {/* Inner Ears */}
        <path d="M28 22 L27 38 L40 37 Z" fill="#FFFFFF" opacity="0.9" />
        <path d="M72 22 L73 38 L60 37 Z" fill="#FFFFFF" opacity="0.9" />

        {/* Kitsune Mask Face Base */}
        <path d="M50 38 L28 44 L16 64 L50 94 L84 64 L72 44 Z" fill="url(#kitsuGrad)" />

        {/* Cheeks Facets */}
        <path d="M50 45 L28 44 L16 64 L50 78 Z" fill="#04044A" opacity="0.35" />
        <path d="M50 45 L72 44 L84 64 L50 78 Z" fill="#000675" opacity="0.45" />

        {/* Sacred Forehead Emblem */}
        <path d="M50 25 L43 37 L50 46 L57 37 Z" fill="#FFFFFF" />

        {/* Kitsune Slanted Eyes */}
        <path d="M28 58 C35 59 41 64 44 68 C38 67 32 64 28 58 Z" fill="#FFFFFF" />
        <path d="M72 58 C65 59 59 64 56 68 C62 67 68 64 72 58 Z" fill="#FFFFFF" />

        {/* Japanese Cheek Markings */}
        <path d="M19 68 L32 70 L24 74 Z" fill="#00E7FF" />
        <path d="M81 68 L68 70 L76 74 Z" fill="#00E7FF" />

        {/* Nose Tip */}
        <path d="M47 87 L53 87 L50 90 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

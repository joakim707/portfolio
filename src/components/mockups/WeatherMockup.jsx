export default function WeatherMockup() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width="280" height="180" fill="#0d0d1a" />

      {/* Top gradient sky */}
      <rect width="280" height="90" fill="#0a0a1e" />

      {/* Location bar */}
      <rect x="8" y="8" width="10" height="12" fill="#ff3c6e" opacity="0.7" />
      <rect x="10" y="10" width="6" height="6" rx="3" fill="#ff3c6e" />
      <rect x="11" y="14" width="4" height="6" fill="#ff3c6e" />
      <rect x="24" y="10" width="40" height="4" fill="#e0e0f0" opacity="0.8" />
      <rect x="24" y="17" width="24" height="3" fill="#6a6a8a" />
      {/* Time */}
      <rect x="220" y="10" width="52" height="4" fill="#e0e0f0" opacity="0.5" />

      {/* Sun/cloud icon */}
      {/* Sun core */}
      <rect x="106" y="24" width="28" height="28" rx="14" fill="#ffd700" opacity="0.9" />
      {/* Sun rays */}
      <rect x="118" y="18" width="4" height="6" fill="#ffd700" />
      <rect x="118" y="52" width="4" height="6" fill="#ffd700" />
      <rect x="96" y="34" width="6" height="4" fill="#ffd700" />
      <rect x="138" y="34" width="6" height="4" fill="#ffd700" />
      <rect x="100" y="22" width="4" height="4" fill="#ffd700" opacity="0.5" />
      <rect x="136" y="22" width="4" height="4" fill="#ffd700" opacity="0.5" />
      {/* Cloud over sun */}
      <rect x="118" y="36" width="52" height="22" rx="6" fill="#2a2a40" />
      <rect x="128" y="30" width="32" height="14" rx="7" fill="#2a2a40" />
      <rect x="136" y="26" width="20" height="12" rx="6" fill="#2a2a40" />

      {/* Temperature */}
      <rect x="60" y="64" width="6" height="4" fill="#e0e0f0" opacity="0.3" />
      <rect x="88" y="58" width="4" height="20" fill="#e0e0f0" />
      <rect x="88" y="58" width="14" height="4" fill="#e0e0f0" />
      <rect x="88" y="66" width="12" height="4" fill="#e0e0f0" />
      <rect x="98" y="70" width="4" height="8" fill="#e0e0f0" />
      {/* ° */}
      <rect x="108" y="58" width="8" height="4" rx="2" fill="#e0e0f0" opacity="0.6" />
      {/* C */}
      <rect x="120" y="58" width="12" height="4" fill="#e0e0f0" />
      <rect x="120" y="58" width="4" height="20" fill="#e0e0f0" />
      <rect x="120" y="74" width="12" height="4" fill="#e0e0f0" />

      {/* Condition text */}
      <rect x="80" y="85" width="120" height="3" fill="#6a6a8a" />

      {/* Divider */}
      <rect x="16" y="96" width="248" height="1" fill="#2a2a40" />

      {/* Recommendations */}
      <rect x="8" y="104" width="264" height="20" fill="#12121a" />
      <rect x="12" y="110" width="6" height="6" fill="#00ff88" />
      <rect x="22" y="112" width="140" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="22" y="117" width="80" height="3" fill="#6a6a8a" />

      <rect x="8" y="128" width="264" height="20" fill="#12121a" />
      <rect x="12" y="134" width="6" height="6" fill="#00ff88" />
      <rect x="22" y="136" width="120" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="22" y="141" width="96" height="3" fill="#6a6a8a" />

      <rect x="8" y="152" width="264" height="20" fill="#12121a" />
      <rect x="12" y="158" width="6" height="6" fill="#ff3c6e" opacity="0.8" />
      <rect x="22" y="160" width="104" height="3" fill="#e0e0f0" opacity="0.5" />
      <rect x="22" y="165" width="128" height="3" fill="#6a6a8a" />
    </svg>
  )
}

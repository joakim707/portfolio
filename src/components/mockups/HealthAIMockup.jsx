export default function HealthAIMockup() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width="280" height="180" fill="#0d0d1a" />
      {/* Browser chrome */}
      <rect width="280" height="18" fill="#1a1a2e" />
      <rect x="4" y="6" width="4" height="4" fill="#ff3c6e" />
      <rect x="11" y="6" width="4" height="4" fill="#ffd700" />
      <rect x="18" y="6" width="4" height="4" fill="#00ff88" />
      <rect x="28" y="5" width="160" height="6" fill="#0a0a0f" />

      {/* Metric cards */}
      <rect x="4" y="22" width="60" height="26" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="68" y="22" width="60" height="26" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="132" y="22" width="60" height="26" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="196" y="22" width="80" height="26" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      {/* Card accent lines */}
      <rect x="4" y="22" width="60" height="2" fill="#ff3c6e" />
      <rect x="68" y="22" width="60" height="2" fill="#ffd700" />
      <rect x="132" y="22" width="60" height="2" fill="#7c6cff" />
      <rect x="196" y="22" width="80" height="2" fill="#00ff88" />
      {/* Card values */}
      <rect x="8" y="28" width="24" height="4" fill="#ff3c6e" opacity="0.3" />
      <rect x="8" y="35" width="40" height="3" fill="#6a6a8a" />
      <rect x="72" y="28" width="24" height="4" fill="#ffd700" opacity="0.3" />
      <rect x="72" y="35" width="44" height="3" fill="#6a6a8a" />
      <rect x="136" y="28" width="24" height="4" fill="#7c6cff" opacity="0.3" />
      <rect x="136" y="35" width="32" height="3" fill="#6a6a8a" />
      <rect x="200" y="28" width="24" height="4" fill="#00ff88" opacity="0.3" />
      <rect x="200" y="35" width="52" height="3" fill="#6a6a8a" />

      {/* Bar chart area */}
      <rect x="4" y="52" width="128" height="124" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="8" y="56" width="40" height="3" fill="#6a6a8a" />
      {/* Bars */}
      <rect x="18" y="120" width="12" height="48" fill="#00ff88" />
      <rect x="36" y="105" width="12" height="63" fill="#7c6cff" />
      <rect x="54" y="112" width="12" height="56" fill="#00ff88" opacity="0.5" />
      <rect x="72" y="98" width="12" height="70" fill="#ff3c6e" />
      <rect x="90" y="108" width="12" height="60" fill="#ffd700" />
      <rect x="108" y="102" width="12" height="66" fill="#7c6cff" opacity="0.6" />
      {/* x-axis */}
      <rect x="14" y="168" width="112" height="1" fill="#2a2a40" />

      {/* Line chart area */}
      <rect x="136" y="52" width="140" height="124" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="140" y="56" width="36" height="3" fill="#6a6a8a" />
      {/* Grid */}
      <rect x="140" y="90" width="130" height="1" fill="#1a1a28" />
      <rect x="140" y="110" width="130" height="1" fill="#1a1a28" />
      <rect x="140" y="130" width="130" height="1" fill="#1a1a28" />
      <rect x="140" y="150" width="130" height="1" fill="#1a1a28" />
      {/* Area under line */}
      <polygon
        points="140,162 162,142 184,150 206,122 228,134 250,108 272,118 272,162"
        fill="#00ff88"
        opacity="0.08"
      />
      {/* Line */}
      <polyline
        points="140,162 162,142 184,150 206,122 228,134 250,108 272,118"
        fill="none"
        stroke="#00ff88"
        strokeWidth="2"
      />
      {/* Dots */}
      <rect x="160" y="140" width="4" height="4" fill="#00ff88" />
      <rect x="204" y="120" width="4" height="4" fill="#00ff88" />
      <rect x="248" y="106" width="4" height="4" fill="#00ff88" />
    </svg>
  )
}

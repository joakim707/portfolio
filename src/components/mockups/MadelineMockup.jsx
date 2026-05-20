export default function MadelineMockup() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width="280" height="180" fill="#0d0d1a" />

      {/* Header */}
      <rect width="280" height="28" fill="#1a1a2e" />
      {/* Avatar */}
      <rect x="8" y="6" width="16" height="16" rx="2" fill="#7c6cff" />
      <rect x="12" y="10" width="4" height="2" fill="#00ff88" />
      <rect x="18" y="10" width="4" height="2" fill="#00ff88" />
      <rect x="13" y="14" width="6" height="2" fill="#e0e0f0" />
      {/* Title */}
      <rect x="30" y="9" width="48" height="4" fill="#e0e0f0" />
      <rect x="30" y="16" width="28" height="3" fill="#00ff88" opacity="0.7" />
      {/* Online dot */}
      <rect x="260" y="11" width="6" height="6" rx="3" fill="#00ff88" />
      <rect x="258" y="9" width="10" height="10" rx="5" fill="none" stroke="#00ff88" strokeWidth="1" opacity="0.3" />

      {/* AI bubble 1 */}
      <rect x="8" y="34" width="16" height="16" rx="2" fill="#7c6cff" opacity="0.5" />
      <rect x="28" y="32" width="152" height="24" rx="3" fill="#1a1a2e" stroke="#2a2a40" strokeWidth="1" />
      <rect x="34" y="38" width="100" height="3" fill="#e0e0f0" opacity="0.6" />
      <rect x="34" y="44" width="76" height="3" fill="#e0e0f0" opacity="0.4" />
      <rect x="28" y="56" width="6" height="3" fill="#1a1a2e" />

      {/* User bubble */}
      <rect x="120" y="64" width="152" height="20" rx="3" fill="#7c6cff" opacity="0.3" />
      <rect x="124" y="70" width="88" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="272" y="64" width="6" height="3" fill="#7c6cff" opacity="0" />

      {/* AI bubble 2 */}
      <rect x="8" y="90" width="16" height="16" rx="2" fill="#7c6cff" opacity="0.5" />
      <rect x="28" y="88" width="200" height="40" rx="3" fill="#1a1a2e" stroke="#2a2a40" strokeWidth="1" />
      {/* Code block inside bubble */}
      <rect x="34" y="94" width="88" height="3" fill="#e0e0f0" opacity="0.6" />
      <rect x="34" y="100" width="148" height="20" rx="2" fill="#0a0a0f" />
      <rect x="38" y="104" width="60" height="2" fill="#7c6cff" opacity="0.7" />
      <rect x="38" y="109" width="80" height="2" fill="#00ff88" opacity="0.7" />
      <rect x="38" y="114" width="48" height="2" fill="#ffd700" opacity="0.7" />

      {/* User bubble 2 */}
      <rect x="164" y="136" width="108" height="20" rx="3" fill="#7c6cff" opacity="0.3" />
      <rect x="168" y="142" width="72" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="168" y="148" width="48" height="3" fill="#e0e0f0" opacity="0.4" />

      {/* Input area */}
      <rect x="0" y="160" width="280" height="20" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="8" y="164" width="220" height="12" rx="6" fill="#1a1a28" />
      <rect x="14" y="168" width="60" height="3" fill="#6a6a8a" />
      <rect x="240" y="163" width="32" height="14" rx="3" fill="#7c6cff" />
      <rect x="250" y="168" width="4" height="4" fill="#e0e0f0" />
      <rect x="252" y="166" width="2" height="8" fill="#e0e0f0" opacity="0.5" />
    </svg>
  )
}

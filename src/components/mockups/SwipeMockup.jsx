export default function SwipeMockup() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width="280" height="180" fill="#0d0d1a" />

      {/* Background pattern */}
      <rect x="0" y="0" width="70" height="180" fill="#0a0a14" />
      <rect x="210" y="0" width="70" height="180" fill="#0a0a14" />

      {/* Phone frame */}
      <rect x="88" y="8" width="104" height="164" rx="8" fill="#1a1a2e" stroke="#2a2a40" strokeWidth="2" />
      {/* Phone notch */}
      <rect x="118" y="12" width="44" height="6" rx="3" fill="#0a0a0f" />
      {/* Status bar */}
      <rect x="94" y="20" width="20" height="3" fill="#2a2a40" />
      <rect x="162" y="20" width="24" height="3" fill="#2a2a40" />

      {/* Product card */}
      <rect x="94" y="28" width="92" height="90" fill="#12121a" />
      {/* Product image placeholder */}
      <rect x="94" y="28" width="92" height="60" fill="#1a1a28" />
      <rect x="118" y="43" width="44" height="4" fill="#2a2a40" />
      <rect x="126" y="50" width="28" height="4" fill="#2a2a40" />
      {/* Product info */}
      <rect x="98" y="92" width="60" height="4" fill="#e0e0f0" opacity="0.6" />
      <rect x="98" y="100" width="36" height="5" fill="#00ff88" opacity="0.8" />
      {/* Swipe indicator */}
      <rect x="110" y="112" width="4" height="4" fill="#7c6cff" opacity="0.4" />
      <rect x="118" y="112" width="4" height="4" fill="#7c6cff" />
      <rect x="126" y="112" width="4" height="4" fill="#7c6cff" opacity="0.4" />
      <rect x="134" y="112" width="4" height="4" fill="#7c6cff" opacity="0.2" />
      {/* Swipe arrow hint */}
      <rect x="98" y="114" width="6" height="2" fill="#6a6a8a" />
      <rect x="176" y="114" width="6" height="2" fill="#6a6a8a" />

      {/* Action buttons */}
      <rect x="96" y="122" width="26" height="26" rx="13" fill="#1a0010" stroke="#ff3c6e" strokeWidth="1" />
      <rect x="109" y="133" width="2" height="4" fill="#ff3c6e" />
      <rect x="107" y="135" width="6" height="2" fill="#ff3c6e" />

      <rect x="127" y="122" width="26" height="26" rx="13" fill="#001a0a" stroke="#00ff88" strokeWidth="2" />
      <rect x="140" y="131" width="2" height="6" fill="#00ff88" />
      <rect x="137" y="134" width="8" height="2" fill="#00ff88" />

      <rect x="158" y="122" width="26" height="26" rx="13" fill="#1a1a0a" stroke="#ffd700" strokeWidth="1" />
      <rect x="165" y="133" width="12" height="2" fill="#ffd700" />
      <rect x="168" y="130" width="2" height="8" fill="#ffd700" />

      {/* Bottom nav */}
      <rect x="94" y="152" width="92" height="14" fill="#12121a" />
      <rect x="104" y="156" width="14" height="6" fill="#2a2a40" />
      <rect x="126" y="156" width="14" height="6" fill="#7c6cff" />
      <rect x="148" y="156" width="14" height="6" fill="#2a2a40" />
      <rect x="170" y="156" width="10" height="6" fill="#2a2a40" />

      {/* Side cards peek */}
      <rect x="16" y="40" width="68" height="100" rx="4" fill="#12121a" stroke="#2a2a40" strokeWidth="1" opacity="0.5" />
      <rect x="196" y="40" width="68" height="100" rx="4" fill="#12121a" stroke="#2a2a40" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

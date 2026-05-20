export default function CorrigeMockup() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width="280" height="180" fill="#0d0d1a" />

      {/* Top bar */}
      <rect width="280" height="20" fill="#1a1a2e" />
      <rect x="4" y="7" width="4" height="4" fill="#ff3c6e" />
      <rect x="11" y="7" width="4" height="4" fill="#ffd700" />
      <rect x="18" y="7" width="4" height="4" fill="#00ff88" />
      {/* Subject label */}
      <rect x="34" y="7" width="48" height="6" rx="2" fill="#7c6cff" opacity="0.5" />
      <rect x="38" y="9" width="40" height="3" fill="#7c6cff" />
      {/* Progress bar */}
      <rect x="100" y="9" width="100" height="4" fill="#2a2a40" />
      <rect x="100" y="9" width="62" height="4" fill="#00ff88" />
      <rect x="204" y="8" width="20" height="5" fill="none" />
      <rect x="210" y="9" width="24" height="3" fill="#e0e0f0" opacity="0.5" />

      {/* Question card */}
      <rect x="8" y="26" width="264" height="52" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="8" y="26" width="4" height="52" fill="#ffd700" />
      <rect x="16" y="30" width="44" height="3" fill="#ffd700" opacity="0.7" />
      <rect x="16" y="37" width="220" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="16" y="44" width="180" height="3" fill="#e0e0f0" opacity="0.5" />
      {/* Math formula */}
      <rect x="16" y="53" width="60" height="6" rx="2" fill="#1a1a28" />
      <rect x="20" y="55" width="52" height="3" fill="#7c6cff" opacity="0.8" />
      <rect x="82" y="55" width="40" height="3" fill="#e0e0f0" opacity="0.4" />
      <rect x="128" y="53" width="60" height="6" rx="2" fill="#1a1a28" />
      <rect x="132" y="55" width="52" height="3" fill="#7c6cff" opacity="0.8" />
      <rect x="196" y="55" width="48" height="3" fill="#e0e0f0" opacity="0.4" />
      <rect x="250" y="53" width="16" height="6" rx="2" fill="#1a1a28" />
      <rect x="254" y="55" width="8" height="3" fill="#7c6cff" opacity="0.8" />

      {/* AI answer card */}
      <rect x="8" y="84" width="264" height="72" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="8" y="84" width="4" height="72" fill="#7c6cff" />
      {/* AI label */}
      <rect x="16" y="88" width="14" height="14" rx="2" fill="#7c6cff" opacity="0.3" />
      <rect x="18" y="91" width="6" height="2" fill="#7c6cff" />
      <rect x="18" y="95" width="6" height="2" fill="#7c6cff" />
      <rect x="34" y="90" width="44" height="3" fill="#7c6cff" opacity="0.7" />

      {/* Answer lines */}
      <rect x="16" y="106" width="240" height="3" fill="#e0e0f0" opacity="0.6" />
      <rect x="16" y="113" width="200" height="3" fill="#e0e0f0" opacity="0.5" />
      <rect x="16" y="120" width="220" height="3" fill="#e0e0f0" opacity="0.4" />
      {/* Inline formula */}
      <rect x="16" y="127" width="80" height="6" rx="2" fill="#1a1a28" />
      <rect x="20" y="129" width="72" height="3" fill="#00ff88" opacity="0.7" />
      <rect x="102" y="129" width="120" height="3" fill="#e0e0f0" opacity="0.4" />

      {/* Score badge */}
      <rect x="220" y="140" width="44" height="12" rx="2" fill="#00ff88" opacity="0.15" />
      <rect x="224" y="143" width="6" height="6" fill="#00ff88" />
      <rect x="234" y="144" width="24" height="4" fill="#00ff88" opacity="0.7" />

      {/* Navigation buttons */}
      <rect x="8" y="162" width="80" height="14" rx="2" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="12" y="166" width="40" height="3" fill="#6a6a8a" />
      <rect x="100" y="162" width="80" height="14" rx="2" fill="#12121a" stroke="#7c6cff" strokeWidth="1" />
      <rect x="104" y="166" width="48" height="3" fill="#7c6cff" opacity="0.7" />
      <rect x="192" y="162" width="80" height="14" rx="2" fill="#00ff88" opacity="0.15" />
      <rect x="196" y="166" width="36" height="3" fill="#00ff88" opacity="0.7" />
    </svg>
  )
}

export default function GestionnaireIAMockup() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width="280" height="180" fill="#0d0d1a" />

      {/* Top bar */}
      <rect width="280" height="20" fill="#1a1a2e" />
      <rect x="4" y="7" width="4" height="4" fill="#ff3c6e" />
      <rect x="11" y="7" width="4" height="4" fill="#ffd700" />
      <rect x="18" y="7" width="4" height="4" fill="#00ff88" />
      <rect x="30" y="6" width="160" height="6" fill="#0a0a0f" />
      {/* Search icon in bar */}
      <rect x="198" y="7" width="10" height="4" rx="2" fill="#2a2a40" />
      <rect x="214" y="7" width="4" height="4" fill="#2a2a40" />

      {/* Left sidebar - folder tree */}
      <rect x="0" y="20" width="90" height="160" fill="#12121a" />
      <rect x="90" y="20" width="1" height="160" fill="#2a2a40" />

      {/* Folder items */}
      {/* Root */}
      <rect x="6" y="28" width="8" height="8" fill="#ffd700" opacity="0.8" />
      <rect x="18" y="30" width="56" height="3" fill="#e0e0f0" opacity="0.7" />

      {/* Sub-folder 1 (selected) */}
      <rect x="0" y="40" width="90" height="14" fill="#7c6cff" opacity="0.15" />
      <rect x="14" y="44" width="8" height="8" fill="#7c6cff" opacity="0.8" />
      <rect x="26" y="46" width="48" height="3" fill="#7c6cff" />

      {/* Sub-folder 2 */}
      <rect x="14" y="60" width="8" height="8" fill="#ffd700" opacity="0.6" />
      <rect x="26" y="62" width="44" height="3" fill="#e0e0f0" opacity="0.5" />

      {/* Sub-folder 3 */}
      <rect x="14" y="76" width="8" height="8" fill="#ffd700" opacity="0.6" />
      <rect x="26" y="78" width="52" height="3" fill="#e0e0f0" opacity="0.5" />

      {/* Files in tree */}
      <rect x="24" y="92" width="6" height="8" fill="#6a6a8a" />
      <rect x="34" y="94" width="42" height="3" fill="#6a6a8a" />
      <rect x="24" y="104" width="6" height="8" fill="#6a6a8a" />
      <rect x="34" y="106" width="36" height="3" fill="#6a6a8a" />

      {/* Right panel - file list */}
      <rect x="91" y="20" width="189" height="160" fill="#0d0d1a" />

      {/* Panel header */}
      <rect x="95" y="24" width="60" height="3" fill="#e0e0f0" opacity="0.5" />
      <rect x="95" y="30" width="30" height="3" fill="#6a6a8a" />

      {/* File rows */}
      {/* File 1 */}
      <rect x="95" y="42" width="180" height="18" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="98" y="47" width="10" height="8" fill="#ff3c6e" opacity="0.7" />
      <rect x="112" y="48" width="68" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="112" y="53" width="40" height="2" fill="#6a6a8a" />
      <rect x="222" y="46" width="44" height="10" rx="2" fill="#7c6cff" opacity="0.3" />
      <rect x="226" y="49" width="36" height="3" fill="#7c6cff" />

      {/* File 2 */}
      <rect x="95" y="64" width="180" height="18" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="98" y="69" width="10" height="8" fill="#ff3c6e" opacity="0.7" />
      <rect x="112" y="70" width="80" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="112" y="75" width="52" height="2" fill="#6a6a8a" />
      <rect x="222" y="68" width="44" height="10" rx="2" fill="#00ff88" opacity="0.2" />
      <rect x="226" y="71" width="36" height="3" fill="#00ff88" opacity="0.8" />

      {/* File 3 */}
      <rect x="95" y="86" width="180" height="18" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="98" y="91" width="10" height="8" fill="#ffd700" opacity="0.7" />
      <rect x="112" y="92" width="60" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="112" y="97" width="36" height="2" fill="#6a6a8a" />
      <rect x="222" y="90" width="44" height="10" rx="2" fill="#ffd700" opacity="0.2" />
      <rect x="226" y="93" width="36" height="3" fill="#ffd700" opacity="0.8" />

      {/* File 4 */}
      <rect x="95" y="108" width="180" height="18" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="98" y="113" width="10" height="8" fill="#7c6cff" opacity="0.7" />
      <rect x="112" y="114" width="72" height="3" fill="#e0e0f0" opacity="0.7" />
      <rect x="112" y="119" width="44" height="2" fill="#6a6a8a" />
      <rect x="222" y="112" width="44" height="10" rx="2" fill="#ff3c6e" opacity="0.2" />
      <rect x="226" y="115" width="36" height="3" fill="#ff3c6e" opacity="0.8" />

      {/* File 5 */}
      <rect x="95" y="130" width="180" height="18" fill="#12121a" stroke="#2a2a40" strokeWidth="1" />
      <rect x="98" y="135" width="10" height="8" fill="#ff3c6e" opacity="0.7" />
      <rect x="112" y="136" width="88" height="3" fill="#e0e0f0" opacity="0.5" />
      <rect x="112" y="141" width="56" height="2" fill="#6a6a8a" />
      <rect x="222" y="134" width="44" height="10" rx="2" fill="#6a6a8a" opacity="0.2" />
      <rect x="226" y="137" width="28" height="3" fill="#6a6a8a" />

      {/* Status bar bottom */}
      <rect x="91" y="162" width="189" height="18" fill="#1a1a2e" />
      <rect x="95" y="167" width="80" height="3" fill="#6a6a8a" />
      <rect x="220" y="165" width="52" height="8" rx="2" fill="#00ff88" opacity="0.2" />
      <rect x="224" y="168" width="44" height="3" fill="#00ff88" opacity="0.7" />
    </svg>
  )
}

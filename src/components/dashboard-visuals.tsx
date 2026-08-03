type DashboardIconName =
  | 'arrow-down'
  | 'arrow-up'
  | 'calendar'
  | 'coins'
  | 'hand-coins'
  | 'receipt'
  | 'scale'
  | 'shield'
  | 'sparkles'
  | 'target'
  | 'trend'
  | 'wallet';

export function DashboardIcon({ name }: { name: DashboardIconName }) {
  const paths: Record<DashboardIconName, React.ReactNode> = {
    'arrow-down': (
      <>
        <path d="M12 4v16" />
        <path d="m18 14-6 6-6-6" />
      </>
    ),
    'arrow-up': (
      <>
        <path d="M12 20V4" />
        <path d="m6 10 6-6 6 6" />
      </>
    ),
    calendar: (
      <>
        <path d="M7 2v4M17 2v4M3 9h18" />
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 13h3M8 17h7" />
      </>
    ),
    coins: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      </>
    ),
    'hand-coins': (
      <>
        <path d="M3 15.5 8.2 18a5 5 0 0 0 4.2.1l7.3-3.6a2 2 0 0 0-1.7-3.6l-4.1 1.8" />
        <path d="M3 12h4.2a3 3 0 0 1 2.1.9l1.2 1.2h3a2 2 0 0 1 0 4H10" />
        <circle cx="15.5" cy="6" r="3.5" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    scale: (
      <>
        <path d="M12 3v18M5 6h14M7 6l-4 7h8ZM17 6l-4 7h8ZM8 21h8" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5.2-3.4 8.7-8 10-4.6-1.3-8-4.8-8-10V6Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z" />
        <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7ZM5 14l.5 1.5L7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5Z" />
      </>
    ),
    target: (
      <>
        <circle cx="11" cy="13" r="8" />
        <circle cx="11" cy="13" r="4" />
        <path d="m14 10 7-7M16 3h5v5" />
      </>
    ),
    trend: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 4-4 3 2 6-7" />
        <path d="M16 6h4v4" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2Z" />
        <path d="M4 8h16M15 12h7v5h-7a2.5 2.5 0 0 1 0-5Z" />
        <path d="M17.5 14.5h.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="dashboard-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function DashboardIllustration() {
  return (
    <svg aria-hidden="true" className="dashboard-illustration" viewBox="0 0 360 220" fill="none">
      <defs>
        <linearGradient id="wallet-body" x1="82" y1="59" x2="277" y2="190">
          <stop stopColor="#7669F4" />
          <stop offset="1" stopColor="#A067EE" />
        </linearGradient>
        <linearGradient id="wallet-card" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#DFF9EE" />
          <stop offset="1" stopColor="#B7F0D7" />
        </linearGradient>
        <filter id="wallet-shadow" x="45" y="43" width="282" height="177">
          <feDropShadow dx="0" dy="15" stdDeviation="13" floodColor="#423594" floodOpacity=".2" />
        </filter>
      </defs>
      <circle cx="300" cy="42" r="22" fill="#FFF" fillOpacity=".33" />
      <circle cx="43" cy="169" r="11" fill="#FFF" fillOpacity=".25" />
      <path
        d="M64 46c26-20 63-27 95-10"
        stroke="#FFF"
        strokeOpacity=".32"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g filter="url(#wallet-shadow)">
        <rect x="77" y="64" width="219" height="126" rx="31" fill="url(#wallet-body)" />
        <path d="M77 94h219" stroke="#EAE6FF" strokeOpacity=".52" strokeWidth="2" />
        <rect x="202" y="113" width="111" height="49" rx="17" fill="#5548C8" />
        <circle cx="226" cy="137.5" r="7" fill="#C9C2FF" />
      </g>
      <g transform="rotate(-9 137 76)">
        <rect x="91" y="36" width="112" height="75" rx="20" fill="url(#wallet-card)" />
        <path
          d="M111 82c15-19 30-12 42-29 8 15 17 18 30 18"
          stroke="#1AA879"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="112" cy="60" r="7" fill="#FFF" />
      </g>
      <g>
        <circle cx="290" cy="75" r="27" fill="#FFD781" />
        <circle cx="290" cy="75" r="20" stroke="#F2A92B" strokeWidth="2" />
        <path
          d="M290 62v26M297 67c-2-2-4.4-3-7-3-3.7 0-6 1.8-6 4.5 0 7 13 3.5 13 10.5 0 3-2.8 5-7 5-3.1 0-5.9-1.2-8-3.4"
          stroke="#C77A12"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
      <path d="m46 92 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#FFF" fillOpacity=".72" />
      <path
        d="m326 154 2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5Z"
        fill="#FFF"
        fillOpacity=".62"
      />
    </svg>
  );
}

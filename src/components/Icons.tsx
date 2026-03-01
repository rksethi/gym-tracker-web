import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const defaults = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

// ── Navigation ──────────────────────────────────────────────
export function IconHome({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v9a1 1 0 001 1h3v-5a1 1 0 011-1h4a1 1 0 011 1v5h3a1 1 0 001-1v-9" />
    </svg>
  );
}

export function IconLibrary({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h5" />
    </svg>
  );
}

export function IconHistory({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconSettings({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// ── Brand ───────────────────────────────────────────────────
export function IconDumbbell({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M6.5 6.5a2 2 0 013 0L17 14a2 2 0 01-3 3L6.5 9.5a2 2 0 010-3z" strokeWidth="0" fill="currentColor" />
      <path d="M6 12L2.5 8.5a2.12 2.12 0 013-3L9 9" />
      <path d="M18 12l3.5 3.5a2.12 2.12 0 01-3 3L15 15" />
      <path d="M3 21l2.5-2.5" />
      <path d="M18.5 5.5L21 3" />
    </svg>
  );
}

// ── Actions ─────────────────────────────────────────────────
export function IconPlus({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconPlay({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTrash({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p} strokeWidth={1.5}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function IconCheck({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconCheckCircle({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" opacity={0.15} />
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 9 10.5 15 8 12.5" />
    </svg>
  );
}

export function IconCircle({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ── Info / Stats ────────────────────────────────────────────
export function IconTimer({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3L2 6" />
      <path d="M22 6l-3-3" />
      <line x1="12" y1="1" x2="12" y2="3" />
    </svg>
  );
}

export function IconBarChart({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function IconClipboard({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

export function IconCalendar({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconScale({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M12 3v17" />
      <path d="M5 8l7-5 7 5" />
      <path d="M3 14l2-6h0l3 6" />
      <path d="M16 14l2-6h0l3 6" />
      <circle cx="5" cy="14" r="2" />
      <circle cx="19" cy="14" r="2" />
      <path d="M8 20h8" />
    </svg>
  );
}

export function IconHeart({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export function IconSignOut({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Exercise categories ─────────────────────────────────────
export function IconArrowUp({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export function IconArrowDown({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

export function IconLeg({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p} strokeWidth={1.8}>
      <path d="M15 4c0 0-1 3-1 6s2 5 2 8c0 2-1 4-3 4" />
      <path d="M9 4c0 0 1 3 1 6s-2 5-2 8c0 2 1 4 3 4" />
    </svg>
  );
}

export function IconShoulder({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <path d="M12 8a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M20 21v-2a4 4 0 00-3-3.87" />
      <path d="M4 21v-2a4 4 0 013-3.87" />
      <path d="M12 14v7" />
    </svg>
  );
}

export function IconBicep({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p} strokeWidth={1.8}>
      <path d="M7 14c0-3 2-5 5-5s5 2 5 5" />
      <path d="M7 14v4a3 3 0 003 3h4a3 3 0 003-3v-4" />
      <path d="M12 9V4" />
      <path d="M9 6l3-2 3 2" />
    </svg>
  );
}

export function IconTarget({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function IconZap({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFilter({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconSearch({ size, ...p }: P) {
  return (
    <svg {...defaults(size)} {...p}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

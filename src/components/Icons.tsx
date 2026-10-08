import type { ReactNode } from "react";

/**
 * Outline icons in the style guide's manner: 24×24 grid, 2px round strokes, no fill,
 * coloured by context. Tinted boxes follow the guide's "project icon" pattern.
 */
const PATHS = {
  budget: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9.2c-.5-.9-1.6-1.4-3-1.4-1.7 0-3 .8-3 2 0 1.3 1.3 1.7 3 2.1s3 .9 3 2.2c0 1.2-1.3 2-3 2-1.5 0-2.6-.6-3.1-1.6M12 6v1.8M12 16.2V18" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5z" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-5-5-9 10" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5" />,
  layers: <path d="M12 3 2 8l10 5 10-5-10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5" />,
  dot: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  flame: (
    <path d="M12 22c4 0 7-2.8 7-7 0-3.5-2.2-5.7-4-7.5-.4 2-1.4 3-2.5 3.5C12.8 8 12 5 9 2c0 4-4 6.5-4 11.5C5 18.5 8 22 12 22z" />
  ),
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  check: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  pen: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M2 20h20" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;
export type Tint = "green" | "blue" | "red" | "amber" | "purple" | "muted";

export function Icon({ name, className = "icon" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/** A coloured outline icon inside a soft tinted square. */
export function IconBox({ name, tint, className = "" }: { name: IconName; tint: Tint; className?: string }) {
  return (
    <span className={`icon-box tint-${tint} ${className}`}>
      <Icon name={name} />
    </span>
  );
}

/** Heading text with a small coloured icon in front. */
export function Titled({ icon, tint, children }: { icon: IconName; tint: Tint; children: ReactNode }) {
  return (
    <span className={`titled ink-${tint}`}>
      <Icon name={icon} className="section-icon" />
      {children}
    </span>
  );
}

const KIND_ICONS: Record<string, { icon: IconName; tint: Tint }> = {
  Budget: { icon: "budget", tint: "green" },
  "Bid / target CPI": { icon: "target", tint: "blue" },
  Launched: { icon: "zap", tint: "purple" },
  Paused: { icon: "pause", tint: "amber" },
  Resumed: { icon: "play", tint: "green" },
  "New creative": { icon: "image", tint: "purple" },
  "Creative removed": { icon: "trash", tint: "red" },
  "Targeting / geo": { icon: "globe", tint: "blue" },
  Audience: { icon: "users", tint: "blue" },
  "Optimization event": { icon: "flag", tint: "amber" },
  Structure: { icon: "layers", tint: "muted" },
  Other: { icon: "dot", tint: "muted" },
};

export function kindIcon(kind: string) {
  return KIND_ICONS[kind] ?? KIND_ICONS.Other;
}

// Small pieces shared by the two mock lecture layouts.

import type { ReactNode } from "react";
import type { AnswerPart, Citation, MockLecture } from "@/lib/mock/lectures";

export const focusRing = "outline-offset-2 outline-accent focus-visible:outline-2";

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatRange(citation: Citation) {
  return `${formatTime(citation.start)}–${formatTime(citation.end)}`;
}

/** Position of a timestamp along the recording, as a CSS percentage. */
export function position(seconds: number, lecture: MockLecture) {
  return `${(seconds / lecture.durationSeconds) * 100}%`;
}

export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-background"
      >
        EL
      </span>
      <span className="text-lg font-semibold">Easy Lecture</span>
    </span>
  );
}

export function DemoPill() {
  return (
    <span className="rounded-full border border-accent px-3 py-1 text-sm font-medium text-accent">
      Demo · sample data
    </span>
  );
}

function badgeClasses(active: boolean) {
  return `inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
    active ? "bg-accent text-background" : "bg-accent/20 text-accent"
  }`;
}

/** Clickable citation number, used inline in answers and on timelines. */
export function CitationBadge({
  citation,
  active,
  onSelect,
  className = "",
}: {
  citation: Citation;
  active: boolean;
  onSelect: (id: number) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(citation.id)}
      aria-pressed={active}
      aria-label={`Citation ${citation.id}, ${formatRange(citation)}`}
      className={`${badgeClasses(active)} ${focusRing} ${className}`}
    >
      {citation.id}
    </button>
  );
}

/** A cited transcript excerpt. The whole card selects the citation. */
export function CitationCard({
  citation,
  active,
  onSelect,
  layout,
}: {
  citation: Citation;
  active: boolean;
  onSelect: (id: number) => void;
  layout: "row" | "stacked";
}) {
  const badge = (
    <span aria-hidden="true" className={badgeClasses(active)}>
      {citation.id}
    </span>
  );
  const range = (
    <span className="text-sm text-foreground/60">
      <span className="sr-only">Citation {citation.id}, </span>
      {formatRange(citation)}
    </span>
  );
  const quote = <span className="leading-relaxed">{citation.quote}</span>;

  return (
    <button
      type="button"
      onClick={() => onSelect(citation.id)}
      aria-pressed={active}
      className={`w-full rounded-xl border p-4 text-left ${focusRing} ${
        active
          ? "border-foreground/20 bg-foreground/10"
          : "border-foreground/10 hover:bg-foreground/5"
      } ${layout === "row" ? "flex items-start gap-3" : "flex flex-col gap-3"}`}
    >
      {layout === "row" ? (
        <>
          {badge}
          <span className="flex flex-col gap-1">
            {range}
            {quote}
          </span>
        </>
      ) : (
        <>
          <span className="flex items-center gap-3">
            {badge}
            {range}
          </span>
          {quote}
        </>
      )}
    </button>
  );
}

/** Renders answer text with its inline code and citation markers. */
export function AnswerText({
  parts,
  citations,
  activeId,
  onSelect,
}: {
  parts: AnswerPart[];
  citations: Citation[];
  activeId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === "string") return <span key={index}>{part}</span>;
        if ("code" in part) {
          return (
            <code key={index} className="font-mono text-[0.9em]">
              {part.code}
            </code>
          );
        }
        const citation = citations.find((c) => c.id === part.cite);
        if (!citation) return null;
        return (
          <CitationBadge
            key={index}
            citation={citation}
            active={citation.id === activeId}
            onSelect={onSelect}
            className="align-middle"
          />
        );
      })}
    </>
  );
}

/**
 * A control that is part of the design but has nothing behind it yet
 * (playback, upload, asking a question). It stays focusable and tells
 * assistive tech and hover users that it is not available.
 */
export function MockControl({
  label,
  className = "",
  children,
}: {
  /** Accessible name, for icon-only controls. */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={label}
      title="Not available in the demo yet"
      className={`cursor-not-allowed ${focusRing} ${className}`}
    >
      {children}
    </button>
  );
}

export function Avatar({ initial }: { initial: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold"
    >
      {initial}
    </span>
  );
}

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PlayIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CaptionsIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10.5 10.5a2 2 0 1 0 0 3M16.5 10.5a2 2 0 1 0 0 3" />
    </svg>
  );
}

export function FullscreenIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" />
    </svg>
  );
}

export function SkipIcon({
  direction,
  className = "size-5",
}: {
  direction: "back" | "forward";
  className?: string;
}) {
  return (
    <svg
      {...iconProps}
      className={`${className} ${direction === "forward" ? "-scale-x-100" : ""}`}
    >
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4v4h4" />
    </svg>
  );
}

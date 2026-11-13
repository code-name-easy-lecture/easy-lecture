"use client";

import { useState } from "react";
import Link from "next/link";
import type { MockLecture } from "@/lib/mock/lectures";
import { COURSES_ROUTE } from "@/lib/routes";
import {
  AnswerText,
  Avatar,
  CaptionsIcon,
  ChevronDownIcon,
  CitationCard,
  DemoPill,
  FullscreenIcon,
  Logo,
  MockControl,
  PlayIcon,
  PlusIcon,
  focusRing,
  formatRange,
  formatTime,
  position,
} from "./lecture-ui";

/** Mock lecture page with a video player in the middle and a course sidebar. */
export function VideoLecture({ lecture }: { lecture: MockLecture }) {
  const [activeId, setActiveId] = useState(lecture.citations[0].id);
  const active =
    lecture.citations.find((c) => c.id === activeId) ?? lecture.citations[0];
  const duration = formatTime(lecture.durationSeconds);

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b border-foreground/10 p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-72 lg:self-start lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Link
          href={COURSES_ROUTE}
          className={`self-start rounded-lg p-2 ${focusRing}`}
        >
          <Logo />
        </Link>

        <Link
          href={COURSES_ROUTE}
          className={`flex items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 ${focusRing}`}
        >
          <span className="flex flex-col">
            <span className="font-semibold">
              {lecture.courseCode} · {lecture.term}
            </span>
            <span className="text-sm text-foreground/70">
              {lecture.courseName}
            </span>
            <span className="sr-only">Change course</span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-foreground/60" />
        </Link>

        <nav aria-label="Lectures" className="flex flex-col gap-3">
          <p className="px-4 text-sm text-foreground/60">Lectures</p>
          <ul>
            <li>
              <Link
                href={lecture.href}
                aria-current="page"
                className={`flex items-center justify-between gap-3 rounded-lg bg-foreground/10 px-4 py-3 font-medium ${focusRing}`}
              >
                {lecture.title}
                <span className="text-sm font-normal text-foreground/70">
                  {duration}
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        <MockControl className="flex items-center justify-center gap-2 rounded-xl border border-foreground/20 px-4 py-3 font-medium">
          <PlusIcon />
          Upload lecture
        </MockControl>

        <div className="mt-auto flex items-center gap-3 px-2 pt-2">
          <Avatar initial="J" />
          <span className="text-foreground/70">Juan</span>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-12">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {lecture.title}
          </h1>
          <DemoPill />
        </div>
        <p className="mt-2 text-foreground/60">{duration} video</p>

        <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section aria-label="Lecture video" className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
              {lecture.slide && (
                <div className="flex aspect-video flex-col justify-center gap-6 px-6 py-8 sm:px-16">
                  <p className="text-xl font-medium sm:text-2xl">
                    {lecture.slide.title}
                  </p>
                  <div className="overflow-x-auto rounded-lg bg-foreground/5 p-6 font-mono text-base leading-8 whitespace-pre sm:text-lg">
                    {lecture.slide.lines.map((line, lineIndex) => (
                      <div key={lineIndex}>
                        {line.map((part, partIndex) =>
                          typeof part === "string" ? (
                            <span key={partIndex}>{part || " "}</span>
                          ) : (
                            <span
                              key={partIndex}
                              className="rounded bg-accent/20 px-1.5 py-0.5 text-accent"
                            >
                              {part.highlight}
                            </span>
                          ),
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-foreground/60">
                    {lecture.slide.position}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 border-t border-foreground/10 px-5 py-4">
                <MockControl
                  label="Play"
                  className="flex size-12 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <PlayIcon />
                </MockControl>
                <p>
                  <span className="font-medium">
                    {formatTime(active.start)}
                  </span>{" "}
                  <span className="text-foreground/60">/ {duration}</span>
                </p>
                <div className="ml-auto flex items-center gap-2 text-foreground/70">
                  <MockControl
                    label="Playback speed, 1×"
                    className="rounded-md px-2 py-1 text-sm"
                  >
                    1×
                  </MockControl>
                  <MockControl label="Captions" className="rounded-md p-2">
                    <CaptionsIcon />
                  </MockControl>
                  <MockControl label="Full screen" className="rounded-md p-2">
                    <FullscreenIcon />
                  </MockControl>
                </div>
              </div>
            </div>

            {/* Timeline: grey is what has played, green is what the answer cites. */}
            <div className="relative mt-14 h-1 rounded-full bg-foreground/15">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-foreground/60"
                style={{ width: position(active.start, lecture) }}
              />
              {lecture.citations.map((citation) => (
                <button
                  key={citation.id}
                  type="button"
                  onClick={() => setActiveId(citation.id)}
                  aria-pressed={citation.id === activeId}
                  aria-label={`Citation ${citation.id}, ${formatRange(citation)}`}
                  style={{
                    left: position(citation.start, lecture),
                    width: position(citation.end - citation.start, lecture),
                  }}
                  className={`absolute bottom-[-4px] flex min-w-3 flex-col items-center gap-1 rounded-sm text-xs font-semibold text-accent ${focusRing}`}
                >
                  {citation.id}
                  <span
                    className={`h-3 w-full rounded-sm ${
                      citation.id === activeId ? "bg-accent" : "bg-accent/50"
                    }`}
                  />
                </button>
              ))}
              <span
                aria-hidden="true"
                style={{ left: position(active.start, lecture) }}
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              />
            </div>
            <div className="mt-4 flex items-start justify-between gap-4 text-sm text-foreground/60">
              <span>0:00</span>
              <span className="text-center">
                Green marks are the parts of the lecture this answer cites
              </span>
              <span>{duration}</span>
            </div>

            <div className="mt-6 rounded-2xl bg-foreground/5 p-6 sm:p-8">
              <p className="flex items-center gap-3 text-foreground/60">
                <span
                  aria-hidden="true"
                  className="inline-flex size-7 items-center justify-center rounded-md bg-accent text-sm font-semibold text-background"
                >
                  {active.id}
                </span>
                <span className="sr-only">Citation {active.id}, </span>
                {formatRange(active)}
              </p>
              <p className="mt-4 text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">
                {active.quote}
              </p>
            </div>
          </section>

          <section aria-labelledby="questions-heading" className="min-w-0">
            <h2 id="questions-heading" className="text-xl font-semibold">
              Questions
            </h2>

            {[...lecture.earlierQuestions].reverse().map((earlier) => (
              <article
                key={earlier.question}
                className="mt-4 border-t border-foreground/10 pt-6"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-medium">{earlier.question}</h3>
                  <span className="shrink-0 text-sm text-foreground/60">
                    {earlier.askedAt}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-foreground/70">
                  {earlier.answer}{" "}
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-foreground/10 align-middle text-xs font-semibold">
                    <span className="sr-only">Cites </span>
                    {earlier.citationCount}
                  </span>
                </p>
              </article>
            ))}

            <article className="mt-6 border-t border-foreground/10 pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-medium">{lecture.question}</h3>
                <span className="shrink-0 text-sm text-foreground/60">
                  {lecture.askedAt}
                </span>
              </div>
              <p className="mt-3 text-lg leading-loose">
                <AnswerText
                  parts={lecture.answer}
                  citations={lecture.citations}
                  activeId={activeId}
                  onSelect={setActiveId}
                />
              </p>

              <h4 className="mt-6 text-foreground/60">From the lecture</h4>
              <ul className="mt-3 flex flex-col gap-2">
                {lecture.citations.map((citation) => (
                  <li key={citation.id}>
                    <CitationCard
                      citation={citation}
                      active={citation.id === activeId}
                      onSelect={setActiveId}
                      layout="row"
                    />
                  </li>
                ))}
              </ul>
            </article>

            <div className="mt-8 border-t border-foreground/10 pt-6">
              <h3 id="ask-heading" className="text-foreground/70">
                Ask about this lecture
              </h3>
              <div className="mt-3 flex items-end gap-3 rounded-xl border border-foreground/20 p-3">
                <textarea
                  aria-labelledby="ask-heading"
                  rows={2}
                  placeholder={lecture.askPlaceholder}
                  className={`min-w-0 flex-1 resize-none rounded-md bg-transparent p-2 placeholder:text-foreground/60 ${focusRing}`}
                />
                <MockControl className="rounded-lg bg-accent px-5 py-3 font-semibold text-background">
                  Ask
                </MockControl>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

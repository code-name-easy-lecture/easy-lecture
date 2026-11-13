"use client";

import { useState } from "react";
import Link from "next/link";
import type { MockLecture } from "@/lib/mock/lectures";
import { COURSES_ROUTE } from "@/lib/routes";
import {
  AnswerText,
  Avatar,
  ChevronDownIcon,
  CitationBadge,
  CitationCard,
  DemoPill,
  Logo,
  MockControl,
  PlayIcon,
  PlusIcon,
  SkipIcon,
  focusRing,
  formatRange,
  formatTime,
  position,
} from "./lecture-ui";

const BAR_COUNT = 120;

// Placeholder waveform: an integer hash of the bar index, so the heights look
// irregular but the server and the browser always agree on them. Values are
// percentages from 40 to 100.
const BAR_HEIGHTS = Array.from(
  { length: BAR_COUNT },
  (_, i) => 40 + ((((i + 1) * 2654435761) >>> 16) % 61),
);

/** Mock lecture page with an audio waveform and a top navigation bar. */
export function AudioLecture({ lecture }: { lecture: MockLecture }) {
  const [activeId, setActiveId] = useState(lecture.citations[0].id);
  const active =
    lecture.citations.find((c) => c.id === activeId) ?? lecture.citations[0];
  const duration = formatTime(lecture.durationSeconds);
  const questionCount = lecture.earlierQuestions.length + 1;

  function barClass(index: number) {
    const time = (index / BAR_COUNT) * lecture.durationSeconds;
    const cited = lecture.citations.find(
      (c) => time >= c.start && time < c.end,
    );
    if (cited) return cited.id === activeId ? "bg-accent" : "bg-accent/50";
    return time < active.start ? "bg-foreground/60" : "bg-foreground/20";
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-foreground/10 px-6 py-4 lg:px-12">
        <Link href={COURSES_ROUTE} className={`rounded-lg ${focusRing}`}>
          <Logo />
        </Link>
        <span aria-hidden="true" className="hidden h-8 w-px bg-foreground/15 sm:block" />
        <Link
          href={COURSES_ROUTE}
          className={`flex items-center gap-3 rounded-lg py-1 ${focusRing}`}
        >
          <span className="font-semibold">{lecture.courseCode}</span>
          <span className="text-foreground/70">
            {lecture.courseName} · {lecture.term}
          </span>
          <span className="sr-only">Change course</span>
          <ChevronDownIcon className="size-4 text-foreground/60" />
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <MockControl className="flex items-center gap-2 rounded-xl border border-foreground/20 px-4 py-2 font-medium">
            <PlusIcon />
            Upload lecture
          </MockControl>
          <Avatar initial="J" />
          <span className="sr-only">Signed in as Juan</span>
        </div>
      </header>

      <nav
        aria-label="Lectures"
        className="border-b border-foreground/10 px-6 py-3 lg:px-12"
      >
        <ul className="flex gap-2 overflow-x-auto">
          <li>
            <Link
              href={lecture.href}
              aria-current="page"
              className={`flex flex-col rounded-lg bg-foreground/10 px-4 py-2 ${focusRing}`}
            >
              <span className="text-sm text-foreground/70">
                Audio · {duration}
              </span>
              <span className="font-medium">{lecture.title}</span>
            </Link>
          </li>
        </ul>
      </nav>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {lecture.title}
            </h1>
            <DemoPill />
          </div>
          <p className="text-foreground/60">{duration} audio recording</p>
        </div>

        <section
          aria-label="Lecture audio"
          className="mt-6 rounded-2xl bg-foreground/5 p-6 sm:p-8"
        >
          <div className="relative">
            <div className="relative h-9">
              {lecture.citations.map((citation) => (
                <span
                  key={citation.id}
                  className={`absolute top-0 ${
                    citation.id === activeId ? "z-10" : ""
                  }`}
                  style={{ left: position(citation.start, lecture) }}
                >
                  <CitationBadge
                    citation={citation}
                    active={citation.id === activeId}
                    onSelect={setActiveId}
                  />
                </span>
              ))}
            </div>
            <div aria-hidden="true" className="flex h-36 items-center gap-px md:gap-[3px]">
              {BAR_HEIGHTS.map((height, index) => (
                <span
                  key={index}
                  className={`min-w-px flex-1 rounded-full ${barClass(index)}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <span
              aria-hidden="true"
              style={{ left: position(active.start, lecture) }}
              className="absolute bottom-0 h-36 w-0.5 bg-foreground"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <MockControl
              label="Back 10 seconds"
              className="rounded-md p-2 text-foreground/70"
            >
              <SkipIcon direction="back" />
            </MockControl>
            <MockControl
              label="Play"
              className="flex size-14 items-center justify-center rounded-full bg-foreground text-background"
            >
              <PlayIcon className="size-6" />
            </MockControl>
            <MockControl
              label="Forward 10 seconds"
              className="rounded-md p-2 text-foreground/70"
            >
              <SkipIcon direction="forward" />
            </MockControl>
            <p>
              <span className="text-lg font-medium">
                {formatTime(active.start)}
              </span>{" "}
              <span className="text-foreground/60">/ {duration}</span>
            </p>
            <p className="ml-auto text-foreground/70">
              Playing citation {active.id} · {formatRange(active)}
            </p>
            <MockControl
              label="Playback speed, 1×"
              className="rounded-md px-2 py-1 text-sm text-foreground/70"
            >
              1×
            </MockControl>
          </div>
        </section>

        <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <section aria-labelledby="question-heading" className="min-w-0">
            <p className="text-sm text-foreground/60">
              You asked at {lecture.askedAt}
            </p>
            <h2 id="question-heading" className="mt-2 text-2xl font-semibold">
              {lecture.question}
            </h2>
            <p className="mt-5 text-lg leading-loose">
              <AnswerText
                parts={lecture.answer}
                citations={lecture.citations}
                activeId={activeId}
                onSelect={setActiveId}
              />
            </p>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {lecture.citations.map((citation) => (
                <li key={citation.id} className="flex">
                  <CitationCard
                    citation={citation}
                    active={citation.id === activeId}
                    onSelect={setActiveId}
                    layout="stacked"
                  />
                </li>
              ))}
            </ul>
          </section>

          <aside className="min-w-0">
            <h2 id="ask-heading" className="text-xl font-semibold">
              Ask about this lecture
            </h2>
            <div className="mt-3 rounded-xl border border-foreground/20 p-3">
              <textarea
                aria-labelledby="ask-heading"
                rows={3}
                placeholder={lecture.askPlaceholder}
                className={`w-full resize-none rounded-md bg-transparent p-2 placeholder:text-foreground/60 ${focusRing}`}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="px-2 text-sm text-foreground/60">
                  Answers cite this recording only
                </p>
                <MockControl className="rounded-lg bg-accent px-5 py-3 font-semibold text-background">
                  Ask
                </MockControl>
              </div>
            </div>

            <h2 className="mt-8 text-xl font-semibold">
              Your questions{" "}
              <span className="font-normal text-foreground/60">
                {questionCount}
              </span>
            </h2>
            <ul className="mt-3 flex flex-col gap-1">
              <li
                aria-current="true"
                className="rounded-xl bg-foreground/10 px-4 py-3"
              >
                <QuestionRow
                  question={lecture.question}
                  askedAt={lecture.askedAt}
                  citationCount={lecture.citations.length}
                />
              </li>
              {lecture.earlierQuestions.map((earlier) => (
                <li key={earlier.question} className="px-4 py-3">
                  <QuestionRow
                    question={earlier.question}
                    askedAt={earlier.askedAt}
                    citationCount={earlier.citationCount}
                  />
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}

function QuestionRow({
  question,
  askedAt,
  citationCount,
}: {
  question: string;
  askedAt: string;
  citationCount: number;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium">{question}</span>
        <span className="shrink-0 text-sm text-foreground/60">{askedAt}</span>
      </div>
      <p className="text-sm text-foreground/60">
        {citationCount} {citationCount === 1 ? "citation" : "citations"}
      </p>
    </>
  );
}

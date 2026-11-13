import type { Metadata } from "next";
import Link from "next/link";
import { mockLectures } from "@/lib/mock/lectures";
import { DemoPill, focusRing, formatTime } from "./_components/lecture-ui";

export const metadata: Metadata = {
  title: "Your courses · Easy Lecture",
};

export default function CoursesPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <DemoPill />
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your courses
          </h1>
          <p className="text-lg leading-relaxed">
            Pick a course to open its lecture.
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          {mockLectures.map((lecture) => (
            <li key={lecture.courseCode}>
              <Link
                href={lecture.href}
                className={`flex flex-col gap-3 rounded-2xl border border-foreground/15 bg-foreground/5 p-6 hover:border-accent ${focusRing}`}
              >
                <span className="flex flex-col">
                  <span className="text-2xl font-semibold">
                    {lecture.courseCode}
                  </span>
                  <span className="text-foreground/70">
                    {lecture.courseName} · {lecture.term}
                  </span>
                </span>
                <span className="flex items-baseline justify-between gap-4 border-t border-foreground/10 pt-3">
                  <span className="font-medium">{lecture.title}</span>
                  <span className="shrink-0 text-sm text-foreground/60">
                    {lecture.media === "video" ? "Video" : "Audio"} ·{" "}
                    {formatTime(lecture.durationSeconds)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { tripleIntegrals } from "@/lib/mock/lectures";
import { AudioLecture } from "../../_components/audio-lecture";

export const metadata: Metadata = {
  title: `${tripleIntegrals.title} · ${tripleIntegrals.courseCode} · Easy Lecture`,
};

export default function TripleIntegralsPage() {
  return <AudioLecture lecture={tripleIntegrals} />;
}

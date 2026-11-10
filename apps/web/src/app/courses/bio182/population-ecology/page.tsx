import type { Metadata } from "next";
import { populationEcology } from "@/lib/mock/lectures";
import { VideoLecture } from "../../_components/video-lecture";

export const metadata: Metadata = {
  title: `${populationEcology.title} · ${populationEcology.courseCode} · Easy Lecture`,
};

export default function PopulationEcologyPage() {
  return <VideoLecture lecture={populationEcology} />;
}

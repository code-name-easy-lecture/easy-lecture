// TODO: Demo-only data. The titles, lengths and source files describe the real
// sample recordings, but the questions, answers, transcript quotes, citation
// times and slide are invented so the lecture pages can be shown before the
// real pipeline exists. Replace it all with data from the Postgres database
// and the RAG service (via AWS Lambda) once those are set up.

import { COURSES_ROUTE } from "@/lib/routes";

/** A span of the recording that an answer cites. Times are in seconds. */
export type Citation = {
  id: number;
  start: number;
  end: number;
  quote: string;
};

/** Answer text, with inline code and citation markers mixed in. */
export type AnswerPart = string | { code: string } | { cite: number };

export type SlideLine = (string | { highlight: string })[];

export type EarlierQuestion = {
  question: string;
  askedAt: string;
  answer: string;
  citationCount: number;
};

export type MockLecture = {
  href: string;
  courseCode: string;
  courseName: string;
  term: string;
  title: string;
  durationSeconds: number;
  media: "video" | "audio";
  /**
   * The sample recording this mock stands in for. The file is not in this
   * repo and nothing loads it yet.
   */
  sourceFile: string;
  /** Stand-in for the video frame. Only the video layout uses it. */
  slide?: { title: string; lines: SlideLine[]; position: string };
  askPlaceholder: string;
  question: string;
  askedAt: string;
  answer: AnswerPart[];
  citations: Citation[];
  /** Newest first. */
  earlierQuestions: EarlierQuestion[];
};

const at = (minutes: number, seconds: number) => minutes * 60 + seconds;

export const populationEcology: MockLecture = {
  href: `${COURSES_ROUTE}/bio182/population-ecology`,
  courseCode: "BIO182",
  courseName: "General Biology II",
  term: "Fall 2026",
  title: "Population Ecology (12-1 & 12-2)",
  durationSeconds: at(28, 10),
  media: "video",
  // 1280×720
  sourceFile: "lecture_videos/Bio_audios/bio182-sample.mp4",
  slide: {
    title: "Logistic growth",
    lines: [
      ["dN/dt = rN ", { highlight: "(1 − N/K)" }],
      [""],
      ["N   population size"],
      ["r   per-capita growth rate"],
      ["K   carrying capacity"],
    ],
    position: "Slide 14 of 31",
  },
  askPlaceholder: "e.g. What happens if N starts above K?",
  question: "Why does growth slow down near carrying capacity?",
  askedAt: "7:42 PM",
  answer: [
    "Growth slows because the ",
    { code: "(1 − N/K)" },
    " term shrinks as the population approaches K. While N is small that term is close to 1, so growth is nearly exponential ",
    { cite: 1 },
    ". As N climbs, there is less food and space per individual, so the per-capita growth rate drops ",
    { cite: 2 },
    ". On the yeast curve the professor pointed out that growth is fastest around ",
    { code: "K/2" },
    " and falls to zero at K ",
    { cite: 3 },
    ".",
  ],
  citations: [
    {
      id: 1,
      start: at(14, 5),
      end: at(14, 50),
      quote:
        "Start with the logistic equation. When N is tiny compared to K, the part in parentheses is basically one, and you get plain exponential growth.",
    },
    {
      id: 2,
      start: at(15, 30),
      end: at(16, 15),
      quote:
        "As N climbs toward K, there is less food and less space for each individual, so the per-capita growth rate drops.",
    },
    {
      id: 3,
      start: at(18, 45),
      end: at(20, 15),
      quote:
        "Look at the yeast curve. It's steepest about halfway up, around K over two, then it flattens out. At K the growth rate is zero.",
    },
  ],
  earlierQuestions: [
    {
      question: "Why can't a population grow exponentially forever?",
      askedAt: "7:38 PM",
      answer:
        "Because exponential growth assumes unlimited resources. Real populations run into limits on food, space and mates, so the growth rate falls as the habitat gets crowded",
      citationCount: 1,
    },
  ],
};

export const tripleIntegrals: MockLecture = {
  href: `${COURSES_ROUTE}/calc3/triple-integrals`,
  courseCode: "CALC3",
  courseName: "Calculus III",
  term: "Fall 2026",
  // Placeholder title: the source clips don't name a topic.
  title: "Triple Integrals",
  durationSeconds: at(49, 27),
  media: "audio",
  sourceFile: "lecture_videos/Calc_3_audios/calc3-sample.m4a",
  askPlaceholder: "e.g. When should I switch to cylindrical coordinates?",
  question: "How do I choose the order of integration?",
  askedAt: "7:42 PM",
  answer: [
    "Pick the order that makes the limits simplest. Start by sketching the region and its shadow on the xy-plane ",
    { cite: 1 },
    ". The inner limits can depend on both outer variables, the middle limits on only the outermost one, and the outer limits have to be constants ",
    { cite: 2 },
    ". For the tetrahedron under ",
    { code: "x + y + z = 1" },
    " the professor integrated z from 0 to ",
    { code: "1 − x − y" },
    ", then y from 0 to ",
    { code: "1 − x" },
    ", then x from 0 to 1, which gives a volume of 1/6 ",
    { cite: 3 },
    ".",
  ],
  citations: [
    {
      id: 1,
      start: at(14, 5),
      end: at(14, 50),
      quote:
        "Before you write a single integral sign, draw the region. Then look at its shadow in the xy-plane. That shadow gives you the outer two integrals.",
    },
    {
      id: 2,
      start: at(15, 30),
      end: at(16, 15),
      quote:
        "Inner limits can have x and y in them. Middle limits can only have x. The outside limits are just numbers.",
    },
    {
      id: 3,
      start: at(18, 45),
      end: at(20, 15),
      quote:
        "So z goes from zero up to one minus x minus y, y goes from zero to one minus x, and x goes from zero to one. Work it through and you get one sixth.",
    },
  ],
  earlierQuestions: [
    {
      question: "Why do the inner limits have variables in them?",
      askedAt: "7:38 PM",
      answer:
        "Because the height of the region changes from point to point, so the inner limits describe the surfaces above and below each point of the shadow",
      citationCount: 1,
    },
    {
      question: "Is a triple integral always a volume?",
      askedAt: "7:35 PM",
      answer:
        "Only when the integrand is 1. With a density function inside, the same integral gives you mass instead",
      citationCount: 1,
    },
  ],
};

/** One mock lecture per course for now. */
export const mockLectures: MockLecture[] = [populationEcology, tripleIntegrals];

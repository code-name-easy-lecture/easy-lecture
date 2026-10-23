export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <span className="rounded-full border border-accent px-3 py-1 text-sm font-medium text-accent">
          Coming soon
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Easy Lecture
        </h1>
        <p className="text-lg leading-relaxed sm:text-xl">
          An AI lecture assistant that transcribes your lectures and answers
          your questions with timestamp-cited answers.
        </p>
        <p className="text-base font-light">
          We&apos;re building it now. Check back soon.
        </p>
      </div>
    </main>
  );
}

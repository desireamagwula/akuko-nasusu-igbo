/** Skeleton placeholders, never spinners. Mirrors the shape of the front page. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1240px] px-5 md:px-8" aria-busy="true" aria-label="Loading">
      <div className="grid gap-8 pt-8 md:pt-12 lg:grid-cols-12 lg:gap-14">
        <div className="skeleton aspect-[3/2] lg:col-span-7" />
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton mt-3 h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>
      <div className="mt-20 grid gap-9 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="skeleton aspect-[3/2]" />
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-6 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

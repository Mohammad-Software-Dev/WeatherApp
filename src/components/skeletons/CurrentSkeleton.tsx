import Card from "../cards/Card";
import { Skeleton } from "../ui/skeleton";

export default function CurrentSkeleton() {
  return (
    <Card
      title="Current Weather"
      className="h-full"
      childrenClassName="flex flex-col gap-4 sm:gap-5 min-h-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-12 w-30" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="rounded-lg border border-border/70 bg-background/30 p-2 sm:p-3 shrink-0">
          <Skeleton className="size-12 sm:size-14 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`rounded-lg border border-border/70 bg-background/25 p-2.5 sm:p-3 flex flex-col gap-1 ${index === 4 ? "col-span-2" : ""}`}
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

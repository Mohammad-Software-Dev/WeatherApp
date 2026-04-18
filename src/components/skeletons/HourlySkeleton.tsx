import Card from "../cards/Card";
import { Skeleton } from "../ui/skeleton";

export default function HourlySkeleton() {
  return (
    <Card title="Hourly Forecast" childrenClassName="flex flex-col gap-5 min-h-0 lg:overflow-y-auto lg:pr-1">
      {Array.from({ length: 3 }).map((_, dayIndex) => (
        <div key={dayIndex} className="flex flex-col gap-3">
          <div className="border-b border-border/70 pb-2">
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 pr-1">
            {Array.from({ length: 8 }).map((_, hourIndex) => (
              <div
                key={hourIndex}
                className="flex flex-col gap-2 items-center p-2 min-w-16 rounded-lg border border-border/30"
              >
                <Skeleton className="w-14 h-5" />
                <Skeleton className="size-8 2xl:size-10 rounded-full" />
                <Skeleton className="w-10 h-5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}

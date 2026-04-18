import Card from "../cards/Card";
import { Skeleton } from "../ui/skeleton";

export default function AdditionalInfoSkeleton() {
  return (
    <Card title="Today at a Glance" childrenClassName="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border/70 px-3 py-2.5 flex flex-col justify-between min-h-24 gap-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-52" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border/70 p-3 flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-6 w-28" />
            </div>
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-14" />
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

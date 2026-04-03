export function Skeleton({ className = "", variant = "default" }: { className?: string; variant?: "default" | "circle" }) {
  const baseStyles = "animate-pulse bg-zinc-800";
  const variantStyles = variant === "circle" ? "rounded-full" : "rounded";
  
  return <div className={`${baseStyles} ${variantStyles} ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton variant="circle" className="h-8 w-8" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

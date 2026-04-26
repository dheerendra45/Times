import React from "react";

export function Skeleton({ className = "", variant = "rect" }) {
  const baseClasses = "skeleton";

  if (variant === "circle") {
    return <div className={`${baseClasses} rounded-full ${className}`} />;
  }

  if (variant === "text") {
    return <div className={`${baseClasses} h-4 rounded ${className}`} />;
  }

  return <div className={`${baseClasses} ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-9 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton variant="rect" className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <Skeleton className="h-44 rounded-t-2xl rounded-b-none" />
      <div className="p-5">
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChatBubbleSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
      <div className="flex-1 max-w-[80%]">
        <Skeleton className="h-4 w-full mb-2 rounded" />
        <Skeleton className="h-4 w-3/4 mb-2 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

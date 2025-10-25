import { cn } from "@/lib/utils";
import React from "react";

export default function IconContainer({
  className,
  ...props
}: React.HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "size-10 rounded-full bg-zinc-200/80 flex items-center justify-center [&_svg]:size-[1.1rem] [&_svg]:text-black/90",
        className
      )}
      {...props}
    />
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle outline-none transition-[border-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-accent/40",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

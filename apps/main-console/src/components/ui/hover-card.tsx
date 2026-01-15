import * as React from "react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type HoverCardContextValue = {
  openDelay: number;
  closeDelay: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  scheduleOpen: () => void;
  scheduleClose: () => void;
};

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null);

function useHoverCardContext() {
  const ctx = React.useContext(HoverCardContext);
  if (!ctx) throw new Error("HoverCard components must be used within <HoverCard />");
  return ctx;
}

type HoverCardProps = React.ComponentPropsWithoutRef<typeof Popover> & {
  openDelay?: number;
  closeDelay?: number;
};

const HoverCard = ({ openDelay = 150, closeDelay = 75, children, ...props }: HoverCardProps) => {
  const [open, setOpen] = React.useState(false);
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  const clearTimers = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  React.useEffect(() => clearTimers, []);

  const scheduleOpen = () => {
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), openDelay);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), closeDelay);
  };

  return (
    <HoverCardContext.Provider
      value={{
        openDelay,
        closeDelay,
        open,
        setOpen,
        scheduleOpen,
        scheduleClose,
      }}
    >
      <Popover open={open} onOpenChange={setOpen} {...props}>
        {children}
      </Popover>
    </HoverCardContext.Provider>
  );
};

const HoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
  React.ComponentPropsWithoutRef<typeof PopoverTrigger>
>(({ onMouseEnter, onMouseLeave, ...props }, ref) => {
  const ctx = useHoverCardContext();

  return (
    <PopoverTrigger
      ref={ref}
      {...props}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        ctx.scheduleOpen();
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        ctx.scheduleClose();
      }}
    />
  );
});
HoverCardTrigger.displayName = "HoverCardTrigger";

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof PopoverContent>,
  React.ComponentPropsWithoutRef<typeof PopoverContent>
>(({ className, onMouseEnter, onMouseLeave, align = "center", sideOffset = 4, ...props }, ref) => {
  const ctx = useHoverCardContext();

  return (
    <PopoverContent
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn("w-64", className)}
      onMouseEnter={(e) => {
        onMouseEnter?.(e);
        ctx.scheduleOpen();
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        ctx.scheduleClose();
      }}
      {...props}
    />
  );
});
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };

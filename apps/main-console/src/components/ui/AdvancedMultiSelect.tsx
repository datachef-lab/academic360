import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon,  ChevronDown,  WandSparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
// import { ÷Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

/**
 * Animation types and configurations
 */
interface AnimationConfig {
  badgeAnimation?: "bounce" | "pulse" | "wiggle" | "fade" | "slide" | "none";
  popoverAnimation?: "scale" | "slide" | "fade" | "flip" | "none";
  optionHoverAnimation?: "highlight" | "scale" | "glow" | "none";
  duration?: number;
  delay?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const multiSelectVariants = cva("m-1 transition-all duration-300 ease-in-out", {
  variants: {
    variant: {
      default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
      secondary: "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      inverted: "inverted",
    },
    badgeAnimation: {
      bounce: "hover:-translate-y-1 hover:scale-110",
      pulse: "hover:animate-pulse",
      wiggle: "hover:animate-wiggle",
      fade: "hover:opacity-80",
      slide: "hover:translate-x-1",
      none: "",
    },
  },
  defaultVariants: {
    variant: "default",
    badgeAnimation: "bounce",
  },
});

interface MultiSelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  style?: {
    badgeColor?: string;
    iconColor?: string;
    gradient?: string;
  };
}

interface MultiSelectGroup {
  heading: string;
  options: MultiSelectOption[];
}

interface MultiSelectProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "animationConfig">,
    VariantProps<typeof multiSelectVariants> {
  options: MultiSelectOption[] | MultiSelectGroup[];
  onValueChange: (value: string[]) => void;
  defaultValue?: string[];
  placeholder?: string;
  animation?: number;
  animationConfig?: AnimationConfig;
  maxCount?: number;
  modalPopover?: boolean;
  asChild?: boolean;
  className?: string;
  hideSelectAll?: boolean;
  searchable?: boolean;
  emptyIndicator?: React.ReactNode;
  autoSize?: boolean;
  singleLine?: boolean;
  popoverClassName?: string;
  disabled?: boolean;
  responsive?:
    | boolean
    | {
        mobile?: {
          maxCount?: number;
          hideIcons?: boolean;
          compactMode?: boolean;
        };
        tablet?: {
          maxCount?: number;
          hideIcons?: boolean;
          compactMode?: boolean;
        };
        desktop?: {
          maxCount?: number;
          hideIcons?: boolean;
          compactMode?: boolean;
        };
      };
  minWidth?: string;
  maxWidth?: string;
  deduplicateOptions?: boolean;
  resetOnDefaultValueChange?: boolean;
  closeOnSelect?: boolean;
}

export interface MultiSelectRef {
  reset: () => void;
  getSelectedValues: () => string[];
  setSelectedValues: (values: string[]) => void;
  clear: () => void;
  focus: () => void;
}

export const MultiSelect = React.forwardRef<MultiSelectRef, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
    //   variant,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      animationConfig,
      maxCount = 3,
      modalPopover = false,
      // asChild = false,
      className,
      hideSelectAll = false,
      searchable = true,
      emptyIndicator,
      autoSize = true,
    //   singleLine = false,
      popoverClassName,
      disabled = false,
      responsive,
      minWidth,
      maxWidth,
      deduplicateOptions = false,
      resetOnDefaultValueChange = true,
      closeOnSelect = false,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const prevDefaultValueRef = React.useRef<string[]>(defaultValue);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const arraysEqual = React.useCallback((a: string[], b: string[]): boolean => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    }, []);

    const resetToDefault = React.useCallback(() => {
      setSelectedValues(defaultValue);
      setIsPopoverOpen(false);
      setSearchValue("");
      onValueChange(defaultValue);
    }, [defaultValue, onValueChange]);

    React.useImperativeHandle(
      ref,
      () => ({
        reset: resetToDefault,
        getSelectedValues: () => selectedValues,
        setSelectedValues: (values: string[]) => {
          setSelectedValues(values);
          onValueChange(values);
        },
        clear: () => {
          setSelectedValues([]);
          onValueChange([]);
        },
        focus: () => {
          if (buttonRef.current) {
            buttonRef.current.focus();
            const originalOutline = buttonRef.current.style.outline;
            const originalOutlineOffset = buttonRef.current.style.outlineOffset;
            buttonRef.current.style.outline = "2px solid hsl(var(--ring))";
            buttonRef.current.style.outlineOffset = "2px";
            setTimeout(() => {
              if (buttonRef.current) {
                buttonRef.current.style.outline = originalOutline;
                buttonRef.current.style.outlineOffset = originalOutlineOffset;
              }
            }, 1000);
          }
        },
      }),
      [resetToDefault, selectedValues, onValueChange],
    );

    const [screenSize, setScreenSize] = React.useState<"mobile" | "tablet" | "desktop">("desktop");
    React.useEffect(() => {
      if (typeof window === "undefined") return;
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setScreenSize("mobile");
        } else if (width < 1024) {
          setScreenSize("tablet");
        } else {
          setScreenSize("desktop");
        }
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("resize", handleResize);
        }
      };
    }, []);

    // React.useEffect(() => {
    //   console.log(selectedValues);
    // }, [selectedValues]);

    const getResponsiveSettings = () => {
      if (!responsive) {
        return { maxCount, hideIcons: false, compactMode: false };
      }
      if (responsive === true) {
        const defaultResponsive = {
          mobile: { maxCount: 2, hideIcons: false, compactMode: true },
          tablet: { maxCount: 4, hideIcons: false, compactMode: false },
          desktop: { maxCount: 6, hideIcons: false, compactMode: false },
        };
        const currentSettings = defaultResponsive[screenSize];
        return {
          maxCount: currentSettings?.maxCount ?? maxCount,
          hideIcons: currentSettings?.hideIcons ?? false,
          compactMode: currentSettings?.compactMode ?? false,
        };
      }
      const currentSettings = responsive[screenSize];
      return {
        maxCount: currentSettings?.maxCount ?? maxCount,
        hideIcons: currentSettings?.hideIcons ?? false,
        compactMode: currentSettings?.compactMode ?? false,
      };
    };
    const responsiveSettings = getResponsiveSettings();

    // const getBadgeAnimationClass = () => {
    //   if (animationConfig?.badgeAnimation) {
    //     switch (animationConfig.badgeAnimation) {
    //       case "bounce":
    //         return isAnimating ? "animate-bounce" : "hover:-translate-y-1 hover:scale-110";
    //       case "pulse":
    //         return "hover:animate-pulse";
    //       case "wiggle":
    //         return "hover:animate-wiggle";
    //       case "fade":
    //         return "hover:opacity-80";
    //       case "slide":
    //         return "hover:translate-x-1";
    //       case "none":
    //         return "";
    //       default:
    //         return "";
    //     }
    //   }
    //   return isAnimating ? "animate-bounce" : "";
    // };

    const getPopoverAnimationClass = () => {
      if (animationConfig?.popoverAnimation) {
        switch (animationConfig.popoverAnimation) {
          case "scale":
            return "animate-scaleIn";
          case "slide":
            return "animate-slideInDown";
          case "fade":
            return "animate-fadeIn";
          case "flip":
            return "animate-flipIn";
          case "none":
            return "";
          default:
            return "";
        }
      }
      return "";
    };

    const getAllOptions = React.useCallback((): MultiSelectOption[] => {
      if (options.length === 0) return [];
      let allOptions: MultiSelectOption[];
      if ("heading" in options[0]) {
        allOptions = (options as MultiSelectGroup[]).flatMap((group) => group.options);
      } else {
        allOptions = options as MultiSelectOption[];
      }
      const valueSet = new Set<string>();
      const duplicates: string[] = [];
      const uniqueOptions: MultiSelectOption[] = [];
      allOptions.forEach((option) => {
        if (valueSet.has(option.value)) {
          duplicates.push(option.value);
          if (!deduplicateOptions) {
            uniqueOptions.push(option);
          }
        } else {
          valueSet.add(option.value);
          uniqueOptions.push(option);
        }
      });
      if (process.env.NODE_ENV === "development" && duplicates.length > 0) {
        const action = deduplicateOptions ? "automatically removed" : "detected";
        console.warn(
          `MultiSelect: Duplicate option values ${action}: ${duplicates.join(", ")}. ` +
            `${deduplicateOptions ? "Duplicates have been removed automatically." : "This may cause unexpected behavior. Consider setting 'deduplicateOptions={true}' or ensure all option values are unique."}`,
        );
      }
      return deduplicateOptions ? uniqueOptions : allOptions;
    }, [options, deduplicateOptions]);

    const getOptionByValue = React.useCallback(
      (value: string): MultiSelectOption | undefined => {
        const option = getAllOptions().find((option) => option.value === value);
        if (!option && process.env.NODE_ENV === "development") {
          console.warn(`MultiSelect: Option with value "${value}" not found in options list`);
        }
        return option;
      },
      [getAllOptions],
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchValue) return options;
      if (options.length === 0) return [];
      if ("heading" in options[0]) {
        const groups = options as MultiSelectGroup[];
        return groups
          .map((group) => ({
            ...group,
            options: group.options.filter(
              (option) =>
                option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
                option.value.toLowerCase().includes(searchValue.toLowerCase()),
            ),
          }))
          .filter((group) => group.options.length > 0);
      }
      const simpleOptions = options as MultiSelectOption[];
      return simpleOptions.filter(
        (option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          option.value.toLowerCase().includes(searchValue.toLowerCase()),
      );
    }, [options, searchValue, searchable]);

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (optionValue: string) => {
      if (disabled) return;
      const option = getOptionByValue(optionValue);
      if (option?.disabled) return;
      const newSelectedValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((value) => value !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    const handleClear = () => {
      if (disabled) return;
      setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      if (disabled) return;
      setIsPopoverOpen((prev) => !prev);
    };

    // const clearExtraOptions = () => {
    //   if (disabled) return;
    //   const newSelectedValues = selectedValues.slice(0, responsiveSettings.maxCount);
    //   setSelectedValues(newSelectedValues);
    //   onValueChange(newSelectedValues);
    // };

    const toggleAll = () => {
      if (disabled) return;
      const allOptions = getAllOptions().filter((option) => !option.disabled);
      if (selectedValues.length === allOptions.length) {
        handleClear();
      } else {
        const allValues = allOptions.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }
      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    React.useEffect(() => {
      if (!resetOnDefaultValueChange) return;
      const prevDefaultValue = prevDefaultValueRef.current;
      if (!arraysEqual(prevDefaultValue, defaultValue)) {
        if (!arraysEqual(selectedValues, defaultValue)) {
          setSelectedValues(defaultValue);
        }
        prevDefaultValueRef.current = [...defaultValue];
      }
    }, [defaultValue, selectedValues, arraysEqual, resetOnDefaultValueChange]);

    const getWidthConstraints = () => {
      const defaultMinWidth = screenSize === "mobile" ? "250px" : "300px";
      const effectiveMinWidth = minWidth || defaultMinWidth;
      const effectiveMaxWidth = maxWidth || "100%";
      return {
        minWidth: effectiveMinWidth,
        maxWidth: effectiveMaxWidth,
        width: autoSize ? "auto" : "100%",
      };
    };
    const widthConstraints = getWidthConstraints();

    React.useEffect(() => {
      if (!isPopoverOpen) {
        setSearchValue("");
      }
    }, [isPopoverOpen]);

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
        <PopoverTrigger asChild>
          <Button

            ref={buttonRef}
            {...props}
            variant={"default"}
            onClick={handleTogglePopover}
            disabled={disabled}
            className={cn(
              "flex p-1 rounded-md w-full border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
              //   autoSize ? "w-auto" : "w-full",
              responsiveSettings.compactMode && "min-h-8 text-sm",
              screenSize === "mobile" && "min-h-12 text-base",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
            style={
              {
                //   ...widthConstraints,
                //   maxWidth: `min(${widthConstraints.maxWidth}, 100%)`,
              }
            }
          >
            <div className="flex items-center justify-between text-center">
              <span className="text-[12px] text-muted-foreground ">{placeholder}</span>
              <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
            </div>

            {/* {selectedValues.length > 0 ? (
              <div className="flex flex-col items-center w-full">
                <div
                  className={cn(
                    "flex items-center gap-1",
                    singleLine
                      ? "overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      : "flex-wrap",
                    responsiveSettings.compactMode && "gap-0.5",
                  )}
                  style={singleLine ? { msOverflowStyle: "none", scrollbarWidth: "none" } : {}}
                >
                  {selectedValues
                    .slice(0, responsiveSettings.maxCount)
                    .map((value) => {
                      const option = getOptionByValue(value);
                      const IconComponent = option?.icon;
                      const customStyle = option?.style;
                      if (!option) {
                        return null;
                      }
                      const badgeStyle: React.CSSProperties = {
                        animationDuration: `${animation}s`,
                        ...(customStyle?.badgeColor && {
                          backgroundColor: customStyle.badgeColor,
                        }),
                        ...(customStyle?.gradient && {
                          background: customStyle.gradient,
                          color: "white",
                        }),
                      };
                      return (
                        <Badge
                          key={value}
                          className={cn(
                            getBadgeAnimationClass(),
                            multiSelectVariants({ variant }),
                            customStyle?.gradient && "text-white border-transparent",
                            responsiveSettings.compactMode && "text-xs px-1.5 py-0.5",
                            screenSize === "mobile" && "max-w-[120px] truncate",
                            singleLine && "flex-shrink-0 whitespace-nowrap",
                            "[&>svg]:pointer-events-auto",
                          )}
                          style={{
                            ...badgeStyle,
                            animationDuration: `${animationConfig?.duration || animation}s`,
                            animationDelay: `${animationConfig?.delay || 0}s`,
                          }}
                        >
                          {IconComponent && !responsiveSettings.hideIcons && (
                            <IconComponent
                              className={cn(
                                "h-4 w-4 mr-2",
                                responsiveSettings.compactMode && "h-3 w-3 mr-1",
                                customStyle?.iconColor && "text-current",
                              )}
                              {...(customStyle?.iconColor && {
                                style: { color: customStyle.iconColor },
                              })}
                            />
                          )}
                          <span className={cn(screenSize === "mobile" && "truncate")}>{option.label}</span>
                          <XCircle
                            className={cn(
                              "ml-2 h-4 w-4 cursor-pointer",
                              responsiveSettings.compactMode && "ml-1 h-3 w-3",
                            )}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleOption(value);
                            }}
                          />
                        </Badge>
                      );
                    })
                    .filter(Boolean)}
                  {selectedValues.length > responsiveSettings.maxCount && (
                    <Badge
                      className={cn(
                        "bg-transparent text-foreground border-foreground/1 hover:bg-transparent",
                        getBadgeAnimationClass(),
                        multiSelectVariants({ variant }),
                        responsiveSettings.compactMode && "text-xs px-1.5 py-0.5",
                        singleLine && "flex-shrink-0 whitespace-nowrap",
                        "[&>svg]:pointer-events-auto",
                      )}
                      style={{
                        animationDuration: `${animationConfig?.duration || animation}s`,
                        animationDelay: `${animationConfig?.delay || 0}s`,
                      }}
                    >
                      {`+ ${selectedValues.length - responsiveSettings.maxCount} more`}
                      <XCircle
                        className={cn("ml-2 h-4 w-4 cursor-pointer", responsiveSettings.compactMode && "ml-1 h-3 w-3")}
                        onClick={(event) => {
                          event.stopPropagation();
                          clearExtraOptions();
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <XIcon
                    className="h-4 mx-2 cursor-pointer text-muted-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClear();
                    }}
                  />
                  <Separator orientation="vertical" className="flex min-h-6 h-full" />
                  <ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full mx-auto">
                <span className="text-sm text-muted-foreground mx-3">{placeholder}</span>
                <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
              </div>
            )} */}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-auto p-0",
            getPopoverAnimationClass(),
            screenSize === "mobile" && "w-[90vw] max-w-sm",
            screenSize === "tablet" && "w-[70vw] max-w-md",
            screenSize === "desktop" && "min-w-[300px]",
            popoverClassName,
          )}
          style={{
            animationDuration: `${animationConfig?.duration || animation}s`,
            animationDelay: `${animationConfig?.delay || 0}s`,
            maxWidth: `min(${widthConstraints.maxWidth}, 90vw)`,
            maxHeight: screenSize === "mobile" ? "70vh" : "60vh",
            touchAction: "manipulation",
          }}
          align="start"
          onEscapeKeyDown={() => setIsPopoverOpen(false)}
        >
          <Command>
            {searchable && (
              <CommandInput
                placeholder="Search..."
                onKeyDown={handleInputKeyDown}
                value={searchValue}
                onValueChange={setSearchValue}
              />
            )}
                          <CommandList
                className={cn(
                  "max-h-[35vh] overflow-y-auto multiselect-scrollbar",
                  screenSize === "mobile" && "max-h-[45vh]",
                  "overscroll-behavior-y-contain",
                )}
            >
              <CommandEmpty>{emptyIndicator || "No results found."}</CommandEmpty>{" "}
              {!hideSelectAll && !searchValue && (
                <CommandGroup>
                  <CommandItem key="all" onSelect={toggleAll} className="cursor-pointer">
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        selectedValues.length === getAllOptions().filter((opt) => !opt.disabled).length
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <span>
                      (Select All
                      {getAllOptions().length > 20 ? ` - ${getAllOptions().length} options` : ""})
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
              {/* Render options or groups */}
              {filteredOptions.length > 0 && "heading" in filteredOptions[0] ? (
                (filteredOptions as MultiSelectGroup[]).map((group) => (
                  <CommandGroup key={group.heading} heading={group.heading}>
                    {group.options.map((option) => {
                      const isSelected = selectedValues.includes(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => toggleOption(option.value)}
                          className={cn("cursor-pointer", option.disabled && "opacity-50 cursor-not-allowed")}
                          disabled={option.disabled}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))
              ) : (
                <CommandGroup>
                  {(filteredOptions as MultiSelectOption[]).map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggleOption(option.value)}
                        className={cn("cursor-pointer", option.disabled && "opacity-50 cursor-not-allowed")}
                        disabled={option.disabled}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </div>
                        {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <div className="flex items-center justify-between">
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem onSelect={handleClear} className="flex-1 justify-center cursor-pointer">
                        Clear
                      </CommandItem>
                      <Separator orientation="vertical" className="flex min-h-6 h-full" />
                    </>
                  )}
                  <CommandItem
                    onSelect={() => setIsPopoverOpen(false)}
                    className="flex-1 justify-center cursor-pointer max-w-full"
                  >
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        {animation > 0 && selectedValues.length > 0 && (
          <WandSparkles
            className={cn(
              "cursor-pointer my-2 text-foreground bg-background w-3 h-3",
              isAnimating ? "" : "text-muted-foreground",
            )}
            onClick={() => setIsAnimating(!isAnimating)}
          />
        )}
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";

export type { MultiSelectOption, MultiSelectGroup, MultiSelectProps };

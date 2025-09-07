import * as React from "react";

// Alert Dialog
declare module "@radix-ui/react-alert-dialog" {
    interface AlertDialogTriggerProps {
        children?: React.ReactNode;
        asChild?: boolean;
    }

    interface AlertDialogTitleProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AlertDialogDescriptionProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AlertDialogActionProps {
        children?: React.ReactNode;
        className?: string;
        onClick?: () => void | Promise<void>;
    }

    interface AlertDialogCancelProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AlertDialogOverlayProps {
        className?: string;
    }
}

// Accordion
declare module "@radix-ui/react-accordion" {
    interface AccordionHeaderProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AccordionTriggerProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AccordionContentProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AccordionItemProps {
        children?: React.ReactNode;
        className?: string;
        value: string;
    }
}

// Avatar
declare module "@radix-ui/react-avatar" {
    interface AvatarProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AvatarFallbackProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface AvatarImageProps {
        className?: string;
        src?: string;
        alt?: string;
    }
}

// Checkbox
declare module "@radix-ui/react-checkbox" {
    interface CheckboxIndicatorProps {
        children?: React.ReactNode;
        className?: string;
    }
}

// Collapsible
declare module "@radix-ui/react-collapsible" {
    interface CollapsibleProps {
        children?: React.ReactNode;
        className?: string;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
        style?: React.CSSProperties;
    }

    interface CollapsibleTriggerProps {
        children?: React.ReactNode;
        className?: string;
        asChild?: boolean;
    }

    interface CollapsibleContentProps {
        children?: React.ReactNode;
        className?: string;
    }
}

// Context Menu
declare module "@radix-ui/react-context-menu" {
    interface ContextMenuSubTriggerProps {
        children?: React.ReactNode;
        className?: string;
        inset?: boolean;
    }

    interface ContextMenuSubContentProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface ContextMenuItemProps {
        children?: React.ReactNode;
        className?: string;
        inset?: boolean;
    }

    interface ContextMenuCheckboxItemProps {
        children?: React.ReactNode;
        className?: string;
        checked?: boolean;
    }

    interface ContextMenuRadioItemProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface ContextMenuLabelProps {
        children?: React.ReactNode;
        className?: string;
        inset?: boolean;
    }

    interface ContextMenuSeparatorProps {
        className?: string;
    }
}

// Dialog
declare module "@radix-ui/react-dialog" {
    interface DialogTitleProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DialogDescriptionProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DialogContentProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DialogHeaderProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DialogFooterProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DialogOverlayProps {
        className?: string;
        forceMount?: boolean;
    }

    interface DialogCloseProps {
        children?: React.ReactNode;
        className?: string;
    }
}

// Dropdown Menu
declare module "@radix-ui/react-dropdown-menu" {
    interface DropdownMenuTriggerProps {
        children?: React.ReactNode;
        className?: string;
        asChild?: boolean;
    }

    interface DropdownMenuContentProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DropdownMenuItemProps {
        children?: React.ReactNode;
        className?: string;
        onClick?: () => void;
    }

    interface DropdownMenuLabelProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DropdownMenuSubTriggerProps {
        children?: React.ReactNode;
        className?: string;
        inset?: boolean;
    }

    interface DropdownMenuSubContentProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DropdownMenuCheckboxItemProps {
        children?: React.ReactNode;
        className?: string;
        checked?: boolean;
    }

    interface DropdownMenuRadioItemProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface DropdownMenuSeparatorProps {
        className?: string;
    }
}

// Hover Card
declare module "@radix-ui/react-hover-card" {
    interface HoverCardTriggerProps {
        children?: React.ReactNode;
        className?: string;
        asChild?: boolean;
    }

    interface HoverCardContentProps {
        children?: React.ReactNode;
        className?: string;
    }
}

// Label
declare module "@radix-ui/react-label" {
    interface LabelProps {
        children?: React.ReactNode;
        className?: string;
    }
}

// Menubar
declare module "@radix-ui/react-menubar" {
    interface MenubarProps {
        children?: React.ReactNode;
        className?: string;
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
        loop?: boolean;
        dir?: "ltr" | "rtl";
    }

    interface MenubarTriggerProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface MenubarSubTriggerProps {
        children?: React.ReactNode;
        className?: string;
        inset?: boolean;
    }

    interface MenubarSubContentProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface MenubarItemProps {
        children?: React.ReactNode;
        className?: string;
        inset?: boolean;
    }

    interface MenubarCheckboxItemProps {
        children?: React.ReactNode;
        className?: string;
        checked?: boolean;
    }

    interface MenubarRadioItemProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface MenubarLabelProps {
        children?: React.ReactNode;
        className?: string;
        inset?: boolean;
    }

    interface MenubarSeparatorProps {
        className?: string;
    }
}

// Navigation Menu
declare module "@radix-ui/react-navigation-menu" {
    interface NavigationMenuProps {
        children?: React.ReactNode;
        className?: string;
        orientation?: "horizontal" | "vertical";
        dir?: "ltr" | "rtl";
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
        delayDuration?: number;
        skipDelayDuration?: number;
    }

    interface NavigationMenuListProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface NavigationMenuTriggerProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface NavigationMenuViewportProps {
        className?: string;
        forceMount?: boolean;
    }

    interface NavigationMenuIndicatorProps {
        children?: React.ReactNode;
        className?: string;
        forceMount?: boolean;
    }
}

// Popover
declare module "@radix-ui/react-popover" {
    interface PopoverTriggerProps {
        children?: React.ReactNode;
        className?: string;
        asChild?: boolean;
    }

    interface PopoverContentProps {
        children?: React.ReactNode;
        className?: string;
    }
}

// Progress
declare module "@radix-ui/react-progress" {
    interface ProgressProps {
        children?: React.ReactNode;
        className?: string;
        value?: number;
        max?: number;
    }

    interface ProgressIndicatorProps {
        className?: string;
        style?: React.CSSProperties;
    }
}

// Radio Group
declare module "@radix-ui/react-radio-group" {
    interface RadioGroupProps {
        children?: React.ReactNode;
        className?: string;
        name?: string;
        required?: boolean;
        disabled?: boolean;
        dir?: "ltr" | "rtl";
        orientation?: "horizontal" | "vertical";
        loop?: boolean;
        defaultValue?: string;
        value?: string;
        onValueChange?: (value: string) => void;
    }

    interface RadioGroupItemProps {
        children?: React.ReactNode;
        className?: string;
        value: string;
        required?: boolean;
        checked?: boolean;
    }

    interface RadioGroupIndicatorProps {
        children?: React.ReactNode;
        className?: string;
    }
}

// Scroll Area
declare module "@radix-ui/react-scroll-area" {
    interface ScrollAreaProps {
        children?: React.ReactNode;
        className?: string;
        type?: "auto" | "always" | "scroll" | "hover";
        dir?: "ltr" | "rtl";
        scrollHideDelay?: number;
    }

    interface ScrollAreaViewportProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface ScrollAreaThumbProps {
        className?: string;
    }
}

// Select
declare module "@radix-ui/react-select" {
    interface SelectTriggerProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface SelectContentProps {
        children?: React.ReactNode;
        className?: string;
        side?: "top" | "right" | "bottom" | "left";
        align?: "start" | "center" | "end";
        sideOffset?: number;
        alignOffset?: number;
    }

    interface SelectItemProps {
        children?: React.ReactNode;
        className?: string;
        value: string;
    }

    interface SelectValueProps {
        className?: string;
        placeholder?: string;
    }

    interface SelectIconProps {
        children?: React.ReactNode;
        asChild?: boolean;
    }

    interface SelectScrollUpButtonProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface SelectScrollDownButtonProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface SelectViewportProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface SelectLabelProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface SelectSeparatorProps {
        className?: string;
    }
}

// Separator
declare module "@radix-ui/react-separator" {
    interface SeparatorProps {
        className?: string;
        decorative?: boolean;
        orientation?: "horizontal" | "vertical";
    }
}

// Slider
declare module "@radix-ui/react-slider" {
    interface SliderProps {
        children?: React.ReactNode;
        className?: string;
        value?: number[];
        defaultValue?: number[];
        onValueChange?: (value: number[]) => void;
        min?: number;
        max?: number;
        step?: number;
        disabled?: boolean;
        orientation?: "horizontal" | "vertical";
        dir?: "ltr" | "rtl";
        inverted?: boolean;
    }

    interface SliderTrackProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface SliderRangeProps {
        className?: string;
    }

    interface SliderThumbProps {
        className?: string;
    }
}

// Switch
declare module "@radix-ui/react-switch" {
    interface SwitchProps {
        children?: React.ReactNode;
        className?: string;
        checked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
        disabled?: boolean;
        required?: boolean;
        name?: string;
        value?: string;
    }

    interface SwitchThumbProps {
        className?: string;
    }
}

// Tabs
declare module "@radix-ui/react-tabs" {
    interface TabsProps {
        children?: React.ReactNode;
        className?: string;
        value?: string;
        onValueChange?: (value: string) => void;
        defaultValue?: string;
        orientation?: "horizontal" | "vertical";
        dir?: "ltr" | "rtl";
        activationMode?: "automatic" | "manual";
    }

    interface TabsListProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface TabsTriggerProps {
        children?: React.ReactNode;
        className?: string;
        value: string;
        disabled?: boolean;
    }

    interface TabsContentProps {
        children?: React.ReactNode;
        className?: string;
        value: string;
        forceMount?: boolean;
    }
}

// Toast
declare module "@radix-ui/react-toast" {
    interface ToastProps {
        children?: React.ReactNode;
        className?: string;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
        duration?: number;
    }

    interface ToastTitleProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface ToastDescriptionProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface ToastActionProps {
        children?: React.ReactNode;
        className?: string;
        altText: string;
    }

    interface ToastCloseProps {
        children?: React.ReactNode;
        className?: string;
        onClick?: () => void;
    }

    interface ToastViewportProps {
        className?: string;
    }
}

// Toggle
declare module "@radix-ui/react-toggle" {
    interface ToggleProps {
        children?: React.ReactNode;
        className?: string;
        pressed?: boolean;
        onPressedChange?: (pressed: boolean) => void;
        disabled?: boolean;
        size?: "default" | "sm" | "lg";
        variant?: "default" | "outline";
    }
}

// Toggle Group
declare module "@radix-ui/react-toggle-group" {
    interface ToggleGroupProps {
        children?: React.ReactNode;
        className?: string;
        type?: "single" | "multiple";
        value?: string | string[];
        onValueChange?: (value: string | string[]) => void;
        defaultValue?: string | string[];
        disabled?: boolean;
        orientation?: "horizontal" | "vertical";
        dir?: "ltr" | "rtl";
        loop?: boolean;
    }

    interface ToggleGroupSingleProps {
        children?: React.ReactNode;
        className?: string;
        value?: string;
        onValueChange?: (value: string) => void;
        defaultValue?: string;
        disabled?: boolean;
        orientation?: "horizontal" | "vertical";
        dir?: "ltr" | "rtl";
        loop?: boolean;
    }

    interface ToggleGroupMultipleProps {
        children?: React.ReactNode;
        className?: string;
        value?: string[];
        onValueChange?: (value: string[]) => void;
        defaultValue?: string[];
        disabled?: boolean;
        orientation?: "horizontal" | "vertical";
        dir?: "ltr" | "rtl";
        loop?: boolean;
    }

    interface ToggleGroupItemProps {
        children?: React.ReactNode;
        className?: string;
        value: string;
        disabled?: boolean;
    }
}

// Tooltip
declare module "@radix-ui/react-tooltip" {
    interface TooltipTriggerProps {
        children?: React.ReactNode;
        className?: string;
        asChild?: boolean;
    }

    interface TooltipContentProps {
        children?: React.ReactNode;
        className?: string;
    }

    interface TooltipProviderProps {
        children?: React.ReactNode;
    }
}

// Aspect Ratio
declare module "@radix-ui/react-aspect-ratio" {
    interface AspectRatioProps {
        children?: React.ReactNode;
        className?: string;
        ratio?: number;
    }
}

// Slot
declare module "@radix-ui/react-slot" {
    interface SlotProps {
        children?: React.ReactNode;
        className?: string;
    }
}
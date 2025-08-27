"use client";

import { useEffect, useState } from "react";
import { type LucideIcon, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  className,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  className?: string;
}) {
  
  // No state needed for hover, just use empty functions
  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {};

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Initialize expanded items based on active state
  useEffect(() => {
    setExpandedItems(
      items.filter((item) => item.isActive).map((item) => item.title)
    );
  }, [items]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <SidebarGroup
      className={cn(
        "transition-all duration-300 border-transparent",
        className
      )}
    >
      <SidebarMenu className="space-y-1.5 border-transparent">
        {items.map((item) => {
          const isExpanded = expandedItems.includes(item.title);

          return (
            <div key={item.title} className="relative">
              <Collapsible
                open={isExpanded}
                onOpenChange={() => {
                  if (!item.items?.length) return;
                  toggleExpanded(item.title);
                }}
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  item.isActive && "bg-[#eff1f7] rounded-l-lg"
                )}
                style={{
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: item.isActive ? "none" : undefined,
                  boxShadow: "none",
                  border: item.isActive ? "none" : undefined,
                }}
              >
                <SidebarMenuItem
                  className={cn(
                    "transition-all duration-200",
                    item.isActive && "bg-[#eff1f7]"
                  )}
                  style={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    border: "none",
                  }}
                >
                  <Link href={item.url} passHref>
                    <SidebarMenuButton
                      size="lg"
                      data-active={item.isActive}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      className={cn(
                        "relative group border-transparent flex items-center px-3 py-2.5 rounded-md transition-all duration-200",
                        item.isActive
                          ? "bg-[#eff1f7] text-purple-800 font-bold"
                          : "hover:text-white"
                      )}
                      style={{
                        backgroundColor: item.isActive
                          ? "#eff1f7"
                          : "transparent",
                      }}
                    >
                      {item.icon && (
                        <motion.div
                          className={cn(
                            "mr-3 transition-colors group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:z-20",
                            item.isActive
                              ? "text-purple-800 dark:text-purple-800"
                              : "text-white/80 group-data-[collapsible=icon]:text-white"
                          )}
                          whileHover={{
                            rotate: 5,
                            scale: 1.1,
                            transition: {
                              type: "spring",
                              stiffness: 400,
                              damping: 10,
                            },
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>
                      )}

                      <span
                        className={cn(
                          "flex-1 truncate font-medium group-data-[collapsible=icon]:hidden",
                          item.isActive && "text-purple-800 font-bold"
                        )}
                      >
                        {item.title}
                      </span>

                      {(item.items?.length ?? 0) > 0 && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "ml-auto group-data-[collapsible=icon]:hidden",
                            item.isActive ? "text-purple-800" : "opacity-60"
                          )}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      )}
                    </SidebarMenuButton>
                  </Link>

                  <AnimatePresence initial={false}>
                    {(item.items?.length ?? 0) > 0 && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                        }}
                        className="pl-10 overflow-hidden"
                      >
                        <SidebarMenuSub>
                          <div className="relative pl-4 border-l border-purple-300 mt-1 mb-1 space-y-1">
                            {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  className="relative px-3 py-1.5 text-sm rounded-md transition-all duration-200 hover:text-white group"
                                >
                                  <Link href={subItem.url}>
                                    <span className="relative z-10">
                                      {subItem.title}
                                    </span>
                                    <motion.span
                                      className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{
                                        backgroundColor:
                                          "rgba(255, 255, 255, 0.2)",
                                      }}
                                      initial={false}
                                      whileHover={{
                                        opacity: 1,
                                        transition: { duration: 0.2 },
                                      }}
                                      whileTap={{ scale: 0.98 }}
                                    />
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </div>
                        </SidebarMenuSub>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SidebarMenuItem>
              </Collapsible>
            </div>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

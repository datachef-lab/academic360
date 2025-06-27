import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
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
}) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const subMenuItemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  return (
    <SidebarGroup className="px-0 pl-[0.5px]">
      <SidebarMenu>
        {items.map((item, index) => {
          if (!item.title || !item.url) return null;

          const hasSubItems = Array.isArray(item.items) && item.items.length > 0;

          return (
            <motion.div
              custom={index}
              initial="hidden"
              animate="visible"
              variants={menuItemVariants}
              key={item.title}
              className="group/menu-item"
            >
              <SidebarMenuItem className="my-1">
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link
                    to={item.url}
                    className={`
                      relative flex items-center gap-3 rounded-md px-3 py-2.5 font-semibold text-lg
                      text-sidebar-foreground transition-all duration-300 ease-in-out
                      overflow-hidden
                      group-hover/menu-item:text-white hover:text-white
                    `}
                  >
                    {/* Animated left border on hover */}
                    <span
                      className="absolute left-0 top-0 h-full w-1 
                       bg-gradient-to-b from-pink-600 to-violet-500
                        scale-y-0 group-hover/menu-item:scale-y-100 
                        origin-top transition-transform duration-300"
                    ></span>

                    {/* Gradient background on hover */}
                    <span
                      className="absolute inset-0 
                        bg-gradient-to-r from-blue-500/70  to-blue-600/70
                        opacity-0 group-hover/menu-item:opacity-100 
                        transition-opacity duration-300 rounded-md"
                    ></span>

                    {item.icon && (
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 6 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="shrink-0 relative z-10"
                      >
                        <item.icon className="h-5 w-5" />
                      </motion.div>
                    )}

                    <motion.span
                      className="relative z-10"
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {item.title}
                    </motion.span>
                  </Link>
                </SidebarMenuButton>

                {hasSubItems && (
                  <SidebarMenuSub className="ml-8 mt-1">
                    {item.items?.map((subItem, subIndex) => {
                      if (!subItem.title || !subItem.url) return null;

                      return (
                        <motion.div
                          custom={subIndex}
                          initial="hidden"
                          animate="visible"
                          variants={subMenuItemVariants}
                          key={subItem.title}
                          className="my-1"
                        >
                          <SidebarMenuSubButton asChild>
                            <Link
                              to={subItem.url}
                              className="group/subitem relative flex items-center rounded-md px-3 py-2 text-sm 
                                text-sidebar-foreground/80 hover:text-white active:text-white transition-all duration-50"
                            >
                              <span
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-blue-500/80 opacity-0
                                group-hover/subitem:opacity-100 transition-opacity duration-300 rounded-md"
                              ></span>
                              <span className="relative z-10">{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </motion.div>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </motion.div>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

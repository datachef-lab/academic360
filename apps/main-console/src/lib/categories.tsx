import { Heart } from "lucide-react";

// Define the types
export interface TabItem {
  label: string;
  icon: JSX.Element;
}

export interface CategoryItem {
  category: string;
  icon: JSX.Element;
  tabs: TabItem[];
}

// Data for the Accordion
export const categories: CategoryItem[] = [
  {
    category: "Personal Details",
    icon: <Heart size={20} />,
    tabs: [
      { label: "Health Detail", icon: <Heart size={18} /> },
      { label: "Contact Details", icon: <Heart size={18} /> },
      { label: "Parent Details", icon: <Heart size={18} /> },
      { label: "Academic Details", icon: <Heart size={18} /> },
    ],
  },
];

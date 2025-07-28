import { useState } from "react";
import { motion } from "framer-motion";
import {
  Frame,
  School,
  Building,
  Layers,
  GraduationCap,
  BookOpen,
  FileText,
  Globe,
  Flag,
  MapPin,
  IndianRupee,
  Boxes,
} from "lucide-react";
import SettingsContent from "@/components/settings/SettingsContent";
import ResourceSidebar from "@/components/settings/ResourceSidebar";

const settingsCategories = [
  {
    category: "Resources",
    icon: <Frame size={16} />,
    tabs: [
      { label: "Board Universities", icon: <School size={16} />, endpoint: "/board-universities" },
      { label: "Institutions", icon: <Building size={16} />, endpoint: "/institutions" },
      { label: "Categories", icon: <Layers size={16} />, endpoint: "/categories" },
      { label: "Degree", icon: <GraduationCap size={16} />, endpoint: "/degree" },
      { label: "Religion", icon: <BookOpen size={16} />, endpoint: "/religions" },
      { label: "Language Medium", icon: <BookOpen size={16} />, endpoint: "/languages" },
      { label: "Documents", icon: <FileText size={16} />, endpoint: "/documents" },
      { label: "Blood Groups", icon: <FileText size={16} />, endpoint: "/blood-groups" },
      { label: "Occupation", icon: <BookOpen size={16} />, endpoint: "/occupations" },
      { label: "Qualifications", icon: <GraduationCap size={16} />, endpoint: "/qualifications" },
      { label: "Nationality", icon: <Globe size={16} />, endpoint: "/nationalities" },
      { label: "Country", icon: <Flag size={16} />, endpoint: "/countries" },
      { label: "State", icon: <MapPin size={16} />, endpoint: "/states" },
      { label: "City", icon: <MapPin size={16} />, endpoint: "/cities" },
      { label: "Annual Income", icon: <IndianRupee size={16} />, endpoint: "/annual-incomes" },
    ],
  },
];

export default function Settings() {
  const [activeSetting, setActiveSetting] = useState(settingsCategories[0].tabs[0]);
  const [activeResourceSection, setActiveResourceSection] = useState("");

  const handleResourceSectionChange = (section: string) => {
    const foundTab = settingsCategories[0].tabs.find(tab => tab.label === section);
    if (foundTab) {
      setActiveSetting(foundTab);
      setActiveResourceSection(section);
    } else {
      setActiveResourceSection(section);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white items-center justify-center px-2 py-3 sm:px-2 lg:px-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4"
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
          >
            <Boxes className="h-8 w-8 drop-shadow-xl text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Resources</h2>
            <p className="text-sm text-purple-600 font-medium">
              Manage your Resources and configurations here
            </p>
          </div>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 bg-gradient-to-r mt-2 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
        />
      </motion.div>

      {/* content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full">
        {/* Left Section */}
        <div className="lg:col-span-3 bg-white/30 shadow-lg rounded-lg border border-gray-200/70 grid grid-rows-[auto_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4 bg-purple-500 rounded-t-lg"
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-white/20 to-white/10 p-3 rounded-xl shadow-xl"
              >
                <Boxes className="h-8 w-8 drop-shadow-xl text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  [ {activeSetting.label} ]
                </h2>
                <p className="text-sm text-white/80 font-medium">
                  Customize your preferences and manage configurations effortlessly.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-gradient-to-r mt-2 from-white/40 via-white/60 to-white/40 rounded-full origin-left col-span-full"
            />
          </motion.div>
          <div className="overflow-auto">
            <SettingsContent activeSetting={activeSetting} />
          </div>
        </div>

        {/* Right Section: Replace with ResourceNavigationSidebar */}
        <div className="flex flex-col items-stretch">
          <ResourceSidebar
            activeSection={activeResourceSection}
            onSectionChange={handleResourceSectionChange}
          />
        </div>
      </div>
    </div>
  );
}

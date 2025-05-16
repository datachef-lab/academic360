import { useState } from "react";
import { motion } from "framer-motion";
import {
  Frame,
  UsersRound,
  UserPlus,
  Users,
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
  Settings2,
} from "lucide-react";
import SettingsPanel from "@/components/settings/SettingsPanel";
import SettingsContent from "@/components/settings/SettingsContent";

const settingsCategories = [
  {
    category: "Users",
    icon: <UsersRound size={16} />,
    tabs: [
      { label: "All Users", icon: <Users size={16} />, endpoint: "/users" },
      { label: "Create a new user", icon: <UserPlus size={16} />, endpoint: "/users" },
    ],
  },
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

  return (
    <div className="w-full h-full grid grid-rows-[auto_1fr] bg-gradient-to-br from-purple-50 to-white gap-5 p-5 drop-shadow-xl">
  {/* Header Section */}
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 p-6 rounded-lg shadow-lg text-white"
  >
    <div className="grid grid-cols-[auto_1fr] items-center gap-4">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-white p-3 rounded-full shadow-xl"
      >
        <Settings2 className="h-8 w-8 drop-shadow-xl text-purple-600" />
      </motion.div>
      <div>
        <h1 className="text-3xl font-bold"> Settings</h1>
        <p className="text-sm font-medium">Manage your preferences and configurations here.</p>
      </div>
    </div>
  </motion.div>

  {/* Main Content */}
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full">
    {/* Left Section */}
    <div className="lg:col-span-3 bg-white/30 shadow-lg rounded-lg border border-gray-200/70 grid grid-rows-[auto_1fr]">
      <div className="bg-gradient-to-r rounded-t-lg from-indigo-500 to-indigo-500 p-5  text-white">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
           [ {activeSetting.label} ]
        </h2>
        <p className="text-sm mt-2">
          Customize your preferences and manage configurations effortlessly.
        </p>
      </div>
      <div className=" overflow-auto">
        <SettingsContent activeSetting={activeSetting} />
      </div>
    </div>

    {/* Right Section */}
    <div className="bg-white grid-cols-1 shadow-lg border border-gray-200/70 overflow-auto  rounded-lg p-6">
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 grid grid-cols-[auto_1fr] items-center gap-2">
        <span className="bg-purple-500 text-white p-2 rounded-full shadow-md">
          <Settings2 className="h-5 w-5" />
        </span>
        <span>Categories</span>
      </h3>
      <SettingsPanel
        settingsCategories={settingsCategories}
        activeSetting={activeSetting}
        setActiveSetting={setActiveSetting}
      />
    </div>
  </div>
</div>
  );
}

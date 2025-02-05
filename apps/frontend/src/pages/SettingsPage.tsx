import { useState } from "react";
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
  //   Bus,
  IndianRupee,
} from "lucide-react";
import SettingsPanel from "@/components/settings/SettingsPanel";
import SettingsContent from "@/components/settings/SettingsContent";

const settingsCategories = [
  {
    category: "Users",
    icon: <UsersRound size={16} />,
    tabs: [
      { label: "All Users", icon: <Users size={14} />, endpoint: "/users" },
      { label: "Create a new user", icon: <UserPlus size={14} />, endpoint: "/users" },
    ],
  },
  {
    category: "Resources",
    icon: <Frame size={16} />,
    tabs: [
      { label: "Board Universities", icon: <School size={14} />, endpoint: "/board-universities" },
      { label: "Institutions", icon: <Building size={14} />, endpoint: "/institutions" },
      { label: "Categories", icon: <Layers size={14} />, endpoint: "/categories" },
      { label: "Degree", icon: <GraduationCap size={14} />, endpoint: "/degree" },
      { label: "Religion", icon: <BookOpen size={14} />, endpoint: "/religions" },
      { label: "Language Medium", icon: <BookOpen size={14} />, endpoint: "/languages" },
      { label: "Documents", icon: <FileText size={14} />, endpoint: "/documents" },
      { label: "Blood Groups", icon: <FileText size={14} />, endpoint: "/blood-groups" },
      { label: "Occupation", icon: <BookOpen size={14} />, endpoint: "/occupations" },
      { label: "Qualifications", icon: <GraduationCap size={14} />, endpoint: "/qualifications" },
      { label: "Nationality", icon: <Globe size={14} />, endpoint: "/nationalities" },
      { label: "Country", icon: <Flag size={14} />, endpoint: "/countries" },
      { label: "State", icon: <MapPin size={14} />, endpoint: "/states" },
      { label: "City", icon: <MapPin size={14} />, endpoint: "/cities" },
      //   { label: "Transport", icon: <Bus size={14} />, endpoint: "/transports" },
      //   { label: "Pickup-Point", icon: <MapPin size={14} />, endpoint: "/pickup-points" },
      { label: "Annual Income", icon: <IndianRupee size={14} />, endpoint: "/annual-incomes" },
    ],
  },
];

export default function Settings() {
  const [activeSetting, setActiveSetting] = useState(settingsCategories[0].tabs[0]);

  return (
    <div className="w-full h-full flex gap-5">
      <div className="w-[80%] h-full">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Settings - [ {activeSetting.label} ]
        </h2>
        <SettingsContent activeSetting={activeSetting} />
      </div>
      <div className="w-[20%] h-full">
        <SettingsPanel
          settingsCategories={settingsCategories}
          activeSetting={activeSetting}
          setActiveSetting={setActiveSetting}
        />
      </div>
    </div>
  );
}

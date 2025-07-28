import { FC } from "react";
import { Book, University, Building2, Tag, Award, Globe, FileText, Droplet, Briefcase, GraduationCap, Flag, Map, MapPin, DollarSign } from "lucide-react";

const resourceSections = [
  { label: "Board Universities", icon: University },
  { label: "Institutions", icon: Building2 },
  { label: "Categories", icon: Tag },
  { label: "Degree", icon: Award },
  { label: "Religion", icon: Globe },
  { label: "Language Medium", icon: Book },
  { label: "Documents", icon: FileText },
  { label: "Blood Groups", icon: Droplet },
  { label: "Occupation", icon: Briefcase },
  { label: "Qualifications", icon: GraduationCap },
  { label: "Nationality", icon: Flag },
  { label: "Country", icon: Globe },
  { label: "State", icon: Map },
  { label: "City", icon: MapPin },
  { label: "Annual Income", icon: DollarSign },
];

interface Props {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const ResourceSidebar: FC<Props> = ({ activeSection, onSectionChange }) => (
  <aside className="w-72 bg-white rounded-lg shadow p-4 sticky top-0 h-screen flex flex-col">
    <div className="mb-4">
      <h2 className="text-lg font-bold text-purple-700">Navigation</h2>
      <p className="text-xs text-gray-500">Quick access menu</p>
    </div>
    <nav className="flex-1 overflow-y-auto pr-1">
      <ul className="space-y-1">
        {resourceSections.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-lg transition
                ${activeSection === label
                  ? "bg-purple-100 border-l-4 border-purple-600 text-purple-800 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => onSectionChange(label)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  </aside>
);

export default ResourceSidebar; 
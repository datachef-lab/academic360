import React from "react";
import { Outlet, NavLink } from "react-router-dom";

const FeesModule: React.FC = () => {
  const navItems = [
    { name: "Fees Structure", path: "" },
    { name: "Academic Year", path: "academic-year" },
    { name: "Fees Slab", path: "fees-slab" },
    { name: "Receipt Type", path: "fees-receipttype" },
    { name: "Addon", path: "addon" },
    { name: "Student Fees", path: "student-fees" },
  ];

  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 p-4">
      {/* Left: resource view */}
      <div className="rounded-lg p-4 overflow-auto">
        <Outlet />
      </div>

      {/* Right: navigation bar */}
      <aside className="w-56 border-l rounded-lg p-4 overflow-hidden flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === ""}
            className={({ isActive }) =>
              [
                "px-3 py-2 rounded-md text-sm font-medium text-left transition-colors",
                isActive
                  ? "bg-purple-600 text-white shadow"
                  : "text-purple-700 hover:bg-purple-100",
              ].join(" ")
            }
          >
            {item.name}
          </NavLink>
        ))}
      </aside>
    </div>
  );
};

export default FeesModule;

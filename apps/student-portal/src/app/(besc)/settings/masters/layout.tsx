"use client";

import Link from 'next/link';
import React from 'react'
import { usePathname } from 'next/navigation';

const mastersLinks = [
    { label: "Nationalities", href: "/settings/masters/nationalities" },
    { label: "Religion", href: "/settings/masters/religions" },
    { label: "Categories", href: "/settings/masters/categories" },
    { label: "Blood Group", href: "/settings/masters/blood-group" },
    { label: "Annual Income", href: "/settings/masters/annual-incomes" },
    { label: "Board / universities", href: "/settings/masters/board-universities" },
    { label: "Degrees", href: "/settings/masters/degrees" },
    { label: "Courses", href: "/settings/masters" },
    { label: "Institutions", href: "/settings/masters/institutions" },
    { label: "Colleges", href: "/settings/masters/colleges" },
    { label: "Language Medium", href: "/settings/masters/language-medium" },
    { label: "Sports Category", href: "/settings/masters/sports-categories" },
];
export default function MastersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='flex justify-between w-full h-full'>
        <div className='w-[80%]'>
            {children}
        </div>
        <div className="flex flex-col p-4 border-l border-gray-200 w-[20%]">
            <h2 className="text-lg font-semibold mb-4">Masters</h2>
            <ul>
                {mastersLinks.map((link) => (
                    <li key={link.href} className="mb-1 last:mb-0">
                        <Link 
                          href={link.href} 
                          className={`block px-2 py-1.5 text-sm font-medium rounded-md ${pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  )
}

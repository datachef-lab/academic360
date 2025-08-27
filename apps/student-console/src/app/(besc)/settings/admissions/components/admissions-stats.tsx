
import { Calendar, CheckCircle, FileText, IndianRupee, Users } from 'lucide-react'
import React from 'react'
import { Stats } from '../page'

export default function AdmissionsStats({ stats}: { stats: Stats}) {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-5 rounded-lg shadow border border-blue-200 hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-2">Total Years</div>
                <div className="text-4xl font-bold text-blue-900">
                  {stats.admissionYearCount}
                </div>
              </div>
              <Calendar className="w-12 h-12 text-blue-500 opacity-60" />
            </div>
            <div className="bg-green-50 p-5 rounded-lg shadow border border-green-200 hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-2">
                  Total Applications
                </div>
                <div className="text-4xl font-bold text-green-900">
                  {stats.totalApplications.toLocaleString()}
                </div>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-60" />
            </div>
            <div className="bg-purple-50 p-5 rounded-lg shadow border border-purple-200 hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700 mb-2">
                  Total Payments
                </div>
                <div className="text-4xl font-bold text-purple-900">
                  {stats.totalPayments.toLocaleString()}
                </div>
              </div>
              <IndianRupee className="w-12 h-12 text-purple-500 opacity-60" />
            </div>
            <div className="bg-yellow-50 p-5 rounded-lg shadow border border-yellow-200 hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-700 mb-2">
                  Total Drafts
                </div>
                <div className="text-4xl font-bold text-yellow-900">
                  {stats.totalDrafts.toLocaleString()}
                </div>
              </div>
              <FileText className="w-12 h-12 text-yellow-500 opacity-60" />
            </div>
          </div>
  )
}

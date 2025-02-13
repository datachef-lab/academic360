import React from "react";
import { FaBook, FaClock, FaDollarSign, FaSearch } from "react-icons/fa";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
     

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Message */}
        <h2 className="text-2xl font-semibold text-gray-700">Welcome, Student!</h2>
        <p className="text-gray-500">Here's your library overview.</p>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <FaBook className="text-blue-500 text-3xl" />
            <div>
              <p className="text-gray-600">Books Issued</p>
              <h3 className="text-2xl font-bold">5</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <FaClock className="text-yellow-500 text-3xl" />
            <div>
              <p className="text-gray-600">Due Books</p>
              <h3 className="text-2xl font-bold">2</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <FaDollarSign className="text-red-500 text-3xl" />
            <div>
              <p className="text-gray-600">Pending Fines</p>
              <h3 className="text-2xl font-bold">$10</h3>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex bg-white p-4 rounded-lg shadow-md">
          <FaSearch className="text-gray-400 text-xl mr-3" />
          <input
            type="text"
            placeholder="Search books..."
            className="w-full border-none focus:outline-none"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Search
          </button>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-700">Recent Activity</h3>
          <div className="bg-white p-6 rounded-lg shadow-md mt-4">
            <ul className="space-y-3">
              <li className="text-gray-600">
                ✅ You borrowed <b>"JavaScript Mastery"</b> on Jan 10, 2025
              </li>
              <li className="text-gray-600">
                ⚠️ <b>"React Basics"</b> is due on Jan 15, 2025
              </li>
              <li className="text-gray-600">
                ❌ You have a pending fine of <b>$10</b>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-green-500 text-white p-4 rounded-lg shadow-md hover:bg-green-600">
            📚 Renew Book
          </button>
          <button className="bg-yellow-500 text-white p-4 rounded-lg shadow-md hover:bg-yellow-600">
            🔄 Return Book
          </button>
          <button className="bg-red-500 text-white p-4 rounded-lg shadow-md hover:bg-red-600">
            💳 Pay Fine
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

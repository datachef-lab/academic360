import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Bookmark, 
  Search, 
  Bell, 
  User, 
  Book, 
  Library, 
  Calendar, 
  Settings 
} from 'lucide-react';
import LibFineManagement from './LibFines';



const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-6 bg-white/50 rounded-3xl shadow-lg backdrop-blur-sm"
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-2xl shadow-xl"
            >
              <Library className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Library Management</h1>
              <p className="text-sm text-purple-600 font-medium">Welcome to your digital library hub</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: <BookOpen className="h-6 w-6" />, title: "Total Books", value: "2,543", color: "from-blue-400 to-blue-600" },
            { icon: <Users className="h-6 w-6" />, title: "Active Members", value: "1,234", color: "from-green-400 to-green-600" },
            { icon: <Clock className="h-6 w-6" />, title: "Overdue Books", value: "23", color: "from-red-400 to-red-600" },
            { icon: <Bookmark className="h-6 w-6" />, title: "Reserved Books", value: "45", color: "from-yellow-400 to-yellow-600" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl shadow-lg text-white`}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white/20 rounded-xl">{stat.icon}</div>
                <div className="text-right">
                  <p className="text-sm opacity-80">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search and Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books, members, or categories..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-purple-500 text-white px-6 py-2 rounded-xl hover:bg-purple-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Recent Activity */}
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { title: "New book added: 'The Great Gatsby'", time: "2 hours ago" },
                  { title: "Member checked out: 'To Kill a Mockingbird'", time: "4 hours ago" },
                  { title: "Book returned: '1984'", time: "6 hours ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-white/30 rounded-xl">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Bell className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fine Management Section */}
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Fine Management</h2>
              <LibFineManagement />
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Book className="h-5 w-5" />, label: "Add Book" },
                  { icon: <User className="h-5 w-5" />, label: "Add Member" },
                  { icon: <Calendar className="h-5 w-5" />, label: "Check Out" },
                  { icon: <Bookmark className="h-5 w-5" />, label: "Reserve" },
                  { icon: <Settings className="h-5 w-5" />, label: "Settings" },
                  { icon: <Library className="h-5 w-5" />, label: "Categories" },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg">{action.icon}</div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
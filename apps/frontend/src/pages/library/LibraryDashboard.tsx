import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Clock, Bookmark, Search, Bell, User, ChevronRight, Star, TrendingUp, BookText, BookOpenIcon } from 'lucide-react';

const LibraryDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 p-6 bg-white/50 rounded-3xl shadow-lg backdrop-blur-sm"
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl"
            >
              <BookOpen className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Library Management</h1>
              <p className="text-sm text-indigo-600 font-medium">Welcome to your digital library hub</p>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 bg-white/80 p-2 rounded-xl shadow-sm cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-medium text-gray-800">John Doe</p>
                <p className="text-xs text-gray-500">Librarian</p>
              </div>
            </motion.div>
          </div>
        </motion.div> */}
         <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-3 sm:p-3"
                  >
                    <div className="grid grid-cols-[auto_1fr] items-center gap-4 drop-shadow-xl">
                      <motion.div
                      
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-xl"
                      >
                        <BookOpenIcon className="h-8 w-8 drop-shadow-xl text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Library Management  </h2>
                        <p className="text-sm text-purple-600 font-medium">Track, manage and analyze your library resources</p>
                      </div>
                    </div>
            
                   
            
                  <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-1 bg-gradient-to-r mt-2 mb-5 from-purple-400 via-purple-500 to-purple-400 rounded-full origin-left col-span-full"
                    />
                  </motion.div>

        {/* Quick Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: <BookOpen className="h-6 w-6" />, title: "Total Books", value: "2,543", color: "from-indigo-500 to-purple-600" },
            { icon: <Users className="h-6 w-6" />, title: "Active Members", value: "1,234", color: "from-cyan-500 to-blue-600" },
            { icon: <Clock className="h-6 w-6" />, title: "Overdue Books", value: "23", color: "from-rose-500 to-pink-600" },
            { icon: <Bookmark className="h-6 w-6" />, title: "Reserved Books", value: "45", color: "from-amber-500 to-orange-600" },
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
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Search Bar */}
            <div className="bg-white/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    placeholder="Search books, members, or categories..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-colors">
                  Search
                </button>
              </div>
            </div>

            {/* Featured Books */}
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Featured Books</h2>
                <button className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((item) => (
                  <motion.div
                    key={item}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/80 p-4 rounded-xl shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BookText className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">The Great Gatsby</h3>
                        <p className="text-sm text-gray-500">F. Scott Fitzgerald</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-gray-600">4.8</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <motion.div
                    key={item}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center gap-4 p-3 bg-white/30 rounded-xl"
                  >
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Bell className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">New book added: "The Great Gatsby"</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Reading Progress */}
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Reading Progress</h2>
              <div className="space-y-4">
                <div className="bg-white/80 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Atomic Habits</span>
                    <span className="text-sm text-gray-500">65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div className="bg-white/80 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">The Psychology of Money</span>
                    <span className="text-sm text-gray-500">30%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <BookOpen className="h-5 w-5" />, label: "Add Book", color: "from-indigo-500 to-purple-600" },
                  { icon: <User className="h-5 w-5" />, label: "Add Member", color: "from-cyan-500 to-blue-600" },
                  { icon: <Clock className="h-5 w-5" />, label: "Check Out", color: "from-rose-500 to-pink-600" },
                  { icon: <Bookmark className="h-5 w-5" />, label: "Reserve", color: "from-amber-500 to-orange-600" },
                ].map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-white bg-gradient-to-br ${action.color}`}
                  >
                    <div className="p-2 bg-white/20 rounded-lg">{action.icon}</div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Trending Books */}
            <div className="bg-white/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Trending Books</h2>
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <motion.div
                    key={item}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center gap-3 p-3 bg-white/80 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Book Title {item}</p>
                      <p className="text-xs text-gray-500">Author Name</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LibraryDashboard; 
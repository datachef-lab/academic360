
import { motion } from "framer-motion";
import AnimatedBackground from "./AnimatedBackground";
import SocialLinks from "./SocialLinks";


const Index = () => {


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
  //       <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
  //     </div>
  //   );
  // }

  return (
    <div className=" bg-gradient-to-br from-purple-50 to-white">
      <AnimatedBackground />
      
      <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-6xl mx-auto grid gap-8 md:gap-12"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.5,
              }}
              className="relative w-28 h-28 mx-auto mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full opacity-30 animate-pulse-slow"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-purple-600"
                >
                  <path
                    d="M12 4L14.4697 9.60081H20.4086L15.5926 13.2984L17.4587 19.3992L12 15.1508L6.54132 19.3992L8.40742 13.2984L3.59142 9.60081H9.53034L12 4Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>
            
            <motion.h1 
              
              className="text-4xl  sm:text-6xl md:text-7xl font-display   py-6 font-bold text-purple-900 tracking-tight  bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-purple-500 to-purple-800"
            >
              Coming Soon
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="max-w-2xl mx-auto  text-lg sm:text-xl text-purple-700 opacity-90 mb-10"
            >
              We are working hard to bring you something amazing. Stay tuned for exciting new features and experiences.
            </motion.p>

            {/* Interactive Elements Section - Removed the subscription form */}
          </motion.div>

          {/* Features Preview */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Beautiful Design",
                description: "Experience our sleek, modern interface that's built for ease of use.",
                gradient: "from-purple-400 to-purple-600",
                delay: 0.1,
                rotation: -3
              },
              {
                title: "Smart Features",
                description: "Powerful tools designed to enhance your productivity and workflow.",
                gradient: "from-indigo-500 to-indigo-700",
                delay: 0.1,
                rotation: 0
              },
              {
                title: "Seamless Experience",
                description: "Everything works together harmoniously across all your devices.",
                gradient: "from-violet-500 to-violet-700",
                delay: 0.1,
                rotation: 3
              }
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20, rotate: feature.rotation }}
                animate={{ opacity: 1, y: 0, rotate: feature.rotation }}
                transition={{ delay: 1 + feature.delay, duration: 0.3 }}
                whileHover={{ 
                  scale: 1.03, 
                  rotate: 0,
                  transition: { duration: 0.2 } 
                }}
                className="bg-white/30 backdrop-blur-md rounded-2xl p-6 shadow-xl border   flex flex-col h-full"
              >
                <div className={`h-2 w-16 mb-4 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
                <h3 className="text-xl font-display font-bold text-purple-900 mb-3">{feature.title}</h3>
                <p className="text-purple-700/90 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Links */}
          <motion.div variants={itemVariants}>
            <SocialLinks />
          </motion.div>

          {/* Footer */}
          <motion.div 
            variants={itemVariants}
            className="text-center text-sm text-purple-600/60 mt-4"
          >
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </motion.div>
        </motion.div>

        {/* Animated Elements */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute top-5 left-5 sm:top-8 sm:left-8 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-purple-400/30 to-indigo-400/30 rounded-full blur-xl"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 w-24 h-24 sm:w-36 sm:h-36 bg-gradient-to-r from-violet-400/30 to-purple-400/30 rounded-full blur-xl"
        />
        
        <div className="absolute top-16 -left-24 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float hidden md:block"></div>
        <div className="absolute -bottom-8 -right-20 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float hidden md:block" style={{ animationDelay: "-5s" }}></div>
      </div>
    </div>
  );
};

export default Index;
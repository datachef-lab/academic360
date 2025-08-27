import React from "react";
import { motion } from "framer-motion";

const AnimatedBackground: React.FC = () => {
  // Generate random positions for floating elements
  const generateElements = (count: number) => {
    return Array.from({ length: count }).map((_, index) => ({
      id: index,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 80,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 30
    }));
  };

  const floatingElements = generateElements(8);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden  ">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-transparent  "></div>
      
      {/* Animated Grid (for visual effect) */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: "linear-gradient(to right, #9333ea 1px, transparent 1px), linear-gradient(to bottom, #9333ea 1px, transparent 1px)", 
        backgroundSize: "40px 40px" 
      }}></div>
      
      {/* Floating Elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full bg-purple-300/20 backdrop-blur-3xl"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: element.size,
            height: element.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            delay: element.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Main Animated Circles with Gradients */}
      <motion.div
        animate={{ 
          y: [-20, 0, -20],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-indigo-200/20 rounded-full filter blur-3xl"
      ></motion.div>

      <motion.div
        animate={{ 
          y: [0, 20, 0],
          scale: [1, 0.9, 1]
        }}
        transition={{ 
          duration: 18, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-violet-200/20 rounded-full filter blur-3xl"
      ></motion.div>

      <motion.div
        animate={{ 
          y: [10, -10, 10],
          scale: [0.9, 1, 0.9]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-purple-300/30 rounded-full filter blur-3xl"
      ></motion.div>
      
      {/* Subtle moving light effect */}
      <motion.div
        className="absolute inset-0 opacity-[0.08]"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.3) 0%, transparent 70%)",
            "radial-gradient(circle at 70% 60%, rgba(147, 51, 234, 0.3) 0%, transparent 70%)",
            "radial-gradient(circle at 40% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 70%)",
            "radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.3) 0%, transparent 70%)"
          ]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

export default AnimatedBackground;

// import { About } from "@/components/root/About";
// import Contact from "@/components/root/Contact";
// import { Cta } from "@/components/root/Cta";
// import { FAQ } from "@/components/root/FAQ";
// import { Features } from "@/components/root/Features";
// import { Footer } from "@/components/root/Footer";
// import { Hero } from "@/components/root/Hero";
// import { HowItWorks } from "@/components/root/HowItworks";
// import { Navbar } from "@/components/root/Navbar";
// import { ScrollToTop } from "@/components/root/ScrollToTop";
// import { Services } from "@/components/root/Services";
// import { Testimonials } from "@/components/root/Testimonials";
// export default function Root() {
//   return (
//     <div className="flex flex-col items-center">
//       <Navbar />
//       <Hero />
//       <About />
//       <HowItWorks />
//       <Features />
//       <Services />
//       <Cta />
//       <Testimonials />
//       <FAQ />
//       <Contact/>
//       <Footer />
//       <ScrollToTop />
//     </div>
//   );
// }
import React from 'react';
import SearchStudent from './SearchStudent';
import { motion } from "framer-motion";
import { UserSearch } from 'lucide-react';


const SearchStudentPage: React.FC = () => {
  return (
    <div className="grid grid-rows-[auto_1fr] min-h-[80vh] bg-gradient-to-br from-teal-100 to-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 p-6 sm:p-8 bg-white/80 backdrop-blur-sm"
          >
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-br from-teal-400 to-teal-600 p-3 rounded-xl shadow-lg"
              >
                <UserSearch className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Student Search</h2>
                <p className="text-sm text-teal-600 font-medium">Find and manage student records</p>
              </div>
            </div>
    
           
    
          <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-1 bg-gradient-to-r mt-2 from-teal-400 via-teal-500 to-teal-400 rounded-full origin-left col-span-full"
            />
          </motion.div>
    
          {/* Table Section */}
          <div className="grid grid-rows-[1fr_auto] p-4 sm:p-6  bg-white/90 shadow-lg">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="overflow-hidden rounded-xl "
            >
             <SearchStudent></SearchStudent>
            </motion.div>
          </div>
        </div>
  );
};

export default SearchStudentPage;
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BriefcaseIcon } from "lucide-react";

export default function OccupationsPage() {
  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 py-6 px-5 sm:p-4 bg-purple-500 rounded-t-lg"
      >
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-white/20 to-white/10 p-3 rounded-xl shadow-xl"
          >
            <BriefcaseIcon className="h-8 w-8 drop-shadow-xl text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Occupation</h2>
            <p className="text-sm text-white/80 font-medium">
              Customize your preferences and manage configurations effortlessly.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline">Bulk Upload</Button>
          <Button variant="outline">Download Template</Button>
          <Button variant="outline">Add</Button>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-1 bg-gradient-to-r mt-2 from-white/40 via-white/60 to-white/40 rounded-full origin-left col-span-full"
        />
      </motion.div>
    </div>
  );
}

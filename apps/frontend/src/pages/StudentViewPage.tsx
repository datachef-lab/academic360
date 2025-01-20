import React from "react";
import { motion, Variants } from "framer-motion";
import { Bookmark } from "lucide-react";
import { Component } from "./AttendaceChart";
import Fees from "./Fees";
import NoticeBoard from "./NoticeBoard";
import ChipTabs from "./ChipTabs";
import ImageSlider from "./ImageSlider";
import Courses from "./Courses";
import "@/styles/Scrollbar.css";
import SemesterAccordion from "./StudentMarks";

const StudentViewPage: React.FC = () => {
  const fieldsetVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.2, duration: 0.4, ease: "easeInOut" },
    }),
  };

  return (
    <>
      <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 p-6">
        <motion.fieldset
          custom={0}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          variants={fieldsetVariants}
          className="  border border-gray-900 rounded-lg p-4 bg-gray-50 shadow-lg hover:shadow-2xl  transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white "
        >
          <legend>
            <div className="flex items-center justify-center gap-2  text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
              <Bookmark size={21} /> Events
            </div>
          </legend>

          <ImageSlider></ImageSlider>
        </motion.fieldset>

        <motion.fieldset
          custom={2}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          variants={fieldsetVariants}
          className=" border border-gray-900 rounded-lg p-4 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
        >
          <legend>
            <div className="flex items-center justify-center gap-2  text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
              <Bookmark size={21} /> Attendance
            </div>
          </legend>
          <Component />
        </motion.fieldset>
        <motion.fieldset
          custom={4}
          initial="hidden"
          whileHover={{ scale: 1.05 }}
          animate="visible"
          variants={fieldsetVariants}
          className="  border border-gray-900 rounded-lg p-6 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
        >
          <legend>
            <div className="flex items-center justify-center gap-2 text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
              <Bookmark size={21} /> Fees
            </div>
          </legend>
          <Fees />
        </motion.fieldset>

        <motion.fieldset
          custom={3}
          whileHover={{ scale: 1.05 }}
          initial="hidden"
          animate="visible"
          variants={fieldsetVariants}
          className=" border border-gray-900 rounded-lg p-2 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white"
        >
          <legend>
            <div className="flex items-center justify-center gap-2 text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
              <Bookmark size={21} /> Marks
            </div>
          </legend>
          <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
            <SemesterAccordion />
          </div>
        </motion.fieldset>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fieldsetVariants}
          whileHover={{ scale: 1.05 }}
          className="border relative border-gray-900 rounded-lg py-2 px-1 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 hover:bg-white "
        >
          <div>
            <div className=" absolute top-[-20px] left-5 flex items-center justify-center gap-2  text-white  border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
              <Bookmark size={21} /> Time Table
            </div>
          </div>
          <div className=" overflow-y-auto  custom-scrollbar max-h-[330px]  ">
            <div className="  ">
              <Courses></Courses>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="grid grid-cols-1 p-6 ">
        <motion.fieldset
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fieldsetVariants}
          className="  border border-gray-900 rounded-lg p-6 bg-gray-50 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out hover:border-blue-500 "
        >
          <legend>
            <div className="flex items-center  justify-center gap-2 text-white border border-gray-400 bg-blue-500 shadow-sm px-8 py-[6px] rounded-full border-b-2">
              <Bookmark size={21} /> Notice Board
            </div>
          </legend>
          <div>
          <div className="flex-col gap-3 items-center justify-start  ">
            <div>
              <ChipTabs></ChipTabs>
              <div className="border-b-[1px] border-gray-400 w-full "></div>
            </div>
            <div className=" overflow-y-auto custom-scrollbar mt-3 max-h-[500px]">
              <NoticeBoard />
            </div>
          </div>
          </div>
        </motion.fieldset>
      </div>
    </>
  );
};

export default StudentViewPage;

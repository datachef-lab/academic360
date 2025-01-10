import { FaGraduationCap } from "react-icons/fa";
export default function Cards() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 px-4 mt-8 sm:grid-cols-4 w-full sm:px-8">
        <div className="flex p-5 items-center bg-green-300 border  overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              TOTAL
            </h3>
            <p className="text-3xl font-medium text-center">61928</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-purple-300 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              BA
            </h3>
            <p className="text-3xl font-medium text-center">8271</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-blue-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              B.COM
            </h3>
            <p className="text-3xl font-medium text-center">47192</p>
          </div>
        </div>
        <div className="flex items-center p-5 bg-indigo-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              B.SC
            </h3>
            <p className="text-3xl font-medium text-center">2903</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-red-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              BBA
            </h3>
            <p className="text-3xl font-medium text-center">2307</p>
          </div>
        </div>
        <div className="flex items-center p-5 bg-yellow-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 bg-white text-4xl dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              M.A
            </h3>
            <p className="text-3xl font-medium text-center">577</p>
          </div>
        </div>
        <div className="flex p-5 items-center bg-orange-400 border overflow-hidden shadow rounded-lg">
          <div className="p-5 text-4xl bg-white dark:text-black rounded-lg">
            <FaGraduationCap />
          </div>
          <div className="px-4 text-gray-700 ">
            <h3 className="text-sm tracking-wider font-medium text-center">
              M.COM
            </h3>
            <p className="text-3xl font-medium text-center">678</p>
          </div>
        </div>
      </div>
    </div>
  );
}

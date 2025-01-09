import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-100 to-gray-300 text-gray-800">
      <div className="animate-bounce mb-4">
        <h1 className="text-[10rem] font-bold text-red-500 drop-shadow-lg">
          404
        </h1>
      </div>
      <h2 className="text-3xl font-bold mt-4 text-gray-700 animate-fade-in">
        Oops! Page Not Found
      </h2>
      <p className="mt-4 text-lg text-gray-600 max-w-lg text-center animate-fade-in-slow">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/"
        className="mt-8 px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition duration-300 animate-fade-in-slow"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;

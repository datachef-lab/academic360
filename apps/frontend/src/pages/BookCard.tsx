

import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import React from "react";

interface BookData {
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
  added_at: string;
}

interface BookCardProps {
  book: BookData;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <div className="w-full max-w-[300px]  rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out border border-gray-300 bg-white">
      {/* Book Cover */}
      <div className="relative w-full h-40 sm:h-48 md:h-52 bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold rounded-t-2xl">
        <span
          className={`absolute right-3 top-2 px-2 py-[3px] text-xs font-semibold rounded-full ${
            book.available_copies > 0
              ? "bg-green-200 text-green-700"
              : "bg-red-200 text-red-700"
          }`}
        >
          {book.available_copies > 0 ? (
            <>
              Available
              <span className="px-1 ml-1 border border-gray-300 bg-white text-green-700 font-md rounded-full">
                {book.available_copies}/{book.total_copies}
              </span>
            </>
          ) : (
            "Out of Stock"
          )}
        </span>
        Book Cover
      </div>

      {/* Book Details */}
      <div className="relative p-4">
        <div className="absolute w-full top-[-6px] left-3 mt-3 flex flex-wrap justify-between">
          <span className="bg-purple-200 text-purple-700 px-2 py-0.5 text-xs font-semibold rounded-full">
            #{book.category}
          </span>
          <span className="text-xs mr-6 font-semibold">ISBN: {book.isbn}</span>
        </div>
        <h2 className="text-md mt-3 font-bold text-gray-800 mb-1">
          {book.title}
        </h2>
        <p className="text-gray-600 text-xs mb-2">By {book.author}</p>

        {/* Added Date & Issue Button */}
        <div className="flex flex-col sm:flex-row justify-between text-gray-500 text-xs mt-5 gap-2 sm:gap-0">
          <Button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md transition hover:bg-blue-400 hover:scale-105 active:scale-95 w-full sm:w-auto">
            <BookOpen className="w-4 h-4 text-white" />
            Issue
          </Button>
          <div className="w-auto flex items-center justify-center">
            Added on: {new Date(book.added_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;


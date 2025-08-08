import React, { useState } from "react";
import BookCard from "./BookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Book {
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
  added_at: string;
}

const dummyBooks: Book[] = [
  // {
  //     title: "The Great Gatsby",
  //     author: "F. Scott Fitzgerald",
  //     isbn: "978-0743273565",
  //     category: "Classic",
  //     total_copies: 10,
  //     available_copies: 3,
  //     added_at: "2024-02-10",
  //   },
  //   {
  //     title: "To Kill a Mockingbird",
  //     author: "Harper Lee",
  //     isbn: "978-0061120084",
  //     category: "Fiction",
  //     total_copies: 8,
  //     available_copies: 1,
  //     added_at: "2024-01-15",
  //   },
  //   {
  //     title: "1984",
  //     author: "George Orwell",
  //     isbn: "978-0451524935",
  //     category: "Dystopian",
  //     total_copies: 12,
  //     available_copies: 5,
  //     added_at: "2024-03-05",
  //   },
  //   {
  //     title: "Moby Dick",
  //     author: "Herman Melville",
  //     isbn: "978-1503280786",
  //     category: "Adventure",
  //     total_copies: 6,
  //     available_copies: 0,
  //     added_at: "2024-02-28",
  //   },
  //   {
  //     title: "To Kill a Mockingbird",
  //     author: "Harper Lee",
  //     isbn: "978-0061120084",
  //     category: "Fiction",
  //     total_copies: 8,
  //     available_copies: 1,
  //     added_at: "2024-01-15",
  //   },
  //   {
  //     title: "1984",
  //     author: "George Orwell",
  //     isbn: "978-0451524935",
  //     category: "Dystopian",
  //     total_copies: 12,
  //     available_copies: 5,
  //     added_at: "2024-03-05",
  //   },
  //   {
  //     title: "Moby Dick",
  //     author: "Herman Melville",
  //     isbn: "978-1503280786",
  //     category: "Adventure",
  //     total_copies: 6,
  //     available_copies: 0,
  //     added_at: "2024-02-28",
  //   },
  //   {
  //     title: "To Kill a Mockingbird",
  //     author: "Harper Lee",
  //     isbn: "978-0061120084",
  //     category: "Fiction",
  //     total_copies: 8,
  //     available_copies: 1,
  //     added_at: "2024-01-15",
  //   },
  //   {
  //     title: "1984",
  //     author: "George Orwell",
  //     isbn: "978-0451524935",
  //     category: "Dystopian",
  //     total_copies: 12,
  //     available_copies: 5,
  //     added_at: "2024-03-05",
  //   },
  //   {
  //     title: "Moby Dick",
  //     author: "Herman Melville",
  //     isbn: "978-1503280786",
  //     category: "Adventure",
  //     total_copies: 6,
  //     available_copies: 0,
  //     added_at: "2024-02-28",
  //   },
];

const BookCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredBooks = dummyBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "All" || book.category === selectedCategory),
  );

  const categories = ["All", ...new Set(dummyBooks.map((book) => book.category))];

  return (
    <div className="w-full h-full mx-auto p-6">
      {/* Search and Filter Bar */}
      <div className=" flex flex-col md:flex-row justify-end gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search by title..."
          className="border border-gray-500 w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full border border-gray-500  md:w-[10%]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Book Catalog</h1>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10 place-items-center">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book, index) => <BookCard key={index} book={book} />)
        ) : (
          <p className="text-gray-500 text-center col-span-full">No books found</p>
        )}
      </div>
    </div>
  );
};

export default BookCatalog;

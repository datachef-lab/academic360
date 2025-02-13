import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  available: boolean;
  dueDate?: string;
  status?: "On Time" | "Overdue";
}

const books: Book[] = [
  { id: 1, title: "React Mastery", author: "John Doe", available: true },
  { id: 2, title: "TypeScript Guide", author: "Jane Smith", available: false, dueDate: "2025-02-20", status: "Overdue" },
  { id: 3, title: "Tailwind Magic", author: "Alice Brown", available: true },
];

const IssueReturnPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const finePerDay = 10;

  const handleBorrow = (book: Book) => {
    if (borrowedBooks.length < 3) {
      setBorrowedBooks([...borrowedBooks, { ...book, dueDate: "2025-02-27", status: "On Time" }]);
    }
  };

  const handleReturn = (bookId: number) => {
    setBorrowedBooks(borrowedBooks.filter((book) => book.id !== bookId));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 bg-gradient-to-r from-blue-50 to-blue-100 min-h-screen rounded-lg shadow-lg">
      {/* Issue Books Section */}
      <Card className="bg-white shadow-lg rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold text-blue-700">📚 Issue Books</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 mb-6">
            <Input
              className="border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 rounded-lg p-3"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline" className="bg-blue-600 text-white p-3 rounded-lg shadow-md hover:bg-blue-700">
              <Search size={20} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books.filter((book) => book.title.toLowerCase().includes(search.toLowerCase())).map((book) => (
              <Card key={book.id} className="p-6 shadow-md rounded-lg bg-gray-50 hover:shadow-xl transition-all">
                <CardTitle className="text-lg font-semibold text-gray-800">{book.title}</CardTitle>
                <p className="text-sm text-gray-600">by {book.author}</p>
                {book.available ? (
                  <Button className="mt-4 w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600" onClick={() => handleBorrow(book)}>Borrow Now</Button>
                ) : (
                  <Button className="mt-4 w-full bg-red-500 text-white p-3 rounded-lg" variant="destructive">Reserved (Due: {book.dueDate})</Button>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Return Books Section */}
      <Card className="bg-white shadow-lg rounded-lg p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold text-red-700">🔄 Return Books</CardTitle>
        </CardHeader>
        <CardContent>
          {borrowedBooks.length > 0 ? (
            borrowedBooks.map((book) => (
              <Card key={book.id} className="p-6 shadow-md rounded-lg bg-gray-50 hover:shadow-xl transition-all mb-4">
                <CardTitle className="text-lg font-semibold text-gray-800">{book.title}</CardTitle>
                <p className="text-sm text-gray-600">Due Date: {book.dueDate}</p>
                <p className={`text-sm font-bold ${book.status === "Overdue" ? "text-red-500" : "text-green-500"}`}>Status: {book.status}</p>
                {book.status === "Overdue" && <p className="text-red-500 font-bold">Fine: ₹{finePerDay * 3}</p>}
                <Progress value={70} className="mt-3" />
                <Button className="mt-4 w-full bg-yellow-500 text-white p-3 rounded-lg hover:bg-yellow-600" variant="secondary" onClick={() => handleReturn(book.id)}>Return Book</Button>
              </Card>
            ))
          ) : (
            <p className="text-gray-500 text-center text-lg">No books borrowed.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueReturnPage;
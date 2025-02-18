import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  setSearchQuery: (query: string) => void;
  setSearchResult: (result: { date: string; activity: string }[]) => void;
}

export default function SearchBar({ setSearchQuery, setSearchResult }: SearchBarProps) {
  const [query, setQuery] = useState<string>("");

  const handleSearch = () => {
    setSearchQuery(query);
    // TODO: Implement API call for search logic
    setSearchResult([]); // Placeholder: Update with API response
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
        <Input
          type="text"
          placeholder="Search logs or enter Roll No."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button onClick={handleSearch} className="px-6">
        Search
      </Button>
    </div>
  );
}

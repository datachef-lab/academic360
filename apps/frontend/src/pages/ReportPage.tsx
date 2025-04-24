
import { 
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  name: string;
  position: 'Teacher' | 'Student';
  email: string;
  contact: string;
  avatarColor: string;
}

const Table = () => {
  const users: User[] = [
    {
      id: 1,
      name: "Rithu Bhawanaj",
      position: "Teacher",
      email: "manager@edu.in",
      contact: "Theory of Computation",
      avatarColor: "#FFB74D"
    },
    {
      id: 2,
      name: "K Krishna shankar",
      position: "Teacher",
      email: "krish@ak.edu.in",
      contact: "Design of Digital Systems",
      avatarColor: "#4CAF50"
    },
    {
      id: 3,
      name: "Aparna Rajendran",
      position: "Student",
      email: "ritcha.23cs@students.edu.in",
      contact: "23CS103",
      avatarColor: "#00BCD4"
    },
    {
      id: 4,
      name: "Prabha SH",
      position: "Student",
      email: "prabha.23cs@students.edu.in",
      contact: "23CS102",
      avatarColor: "#E040FB"
    },
    {
      id: 5,
      name: "Vinod Noyal",
      position: "Student",
      email: "vinod@example.23cs@students.edu.in",
      contact: "23CS112",
      avatarColor: "#FFD700"
    },
    {
      id: 6,
      name: "Shashwath Raja",
      position: "Student",
      email: "shashwath.raja.23cs@students.edu.in",
      contact: "23CS119",
      avatarColor: "#7B68EE"
    },
    {
      id: 7,
      name: "Aarav",
      position: "Student",
      email: "aarav.23cs@students.edu.in",
      contact: "Mtech(Networked[1])",
      avatarColor: "#FF4444"
    }
  ];

  return (
    <div className="w-full mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
        <div className="overflow-x-auto">
          <ShadcnTable className="border-separate border-spacing-y-3">
            <TableHeader className="bg-gray-50">
              <TableRow className="border hover:bg-gray-100 rounded-full ">
                <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">S.No</TableHead>
                <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
                <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Position</TableHead>
                <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</TableHead>
                <TableHead className="py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Mail Contact/Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="space-y-4">
              {users.map((user) => (
                <TableRow 
                  key={user.id} 
                  className=" my-24 shadow-md bg-gray-50   rounded-full hover:bg-gray-50 transition-all duration-300 ease-in-out"
                >
                  <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full">
                    <div className="text-sm text-gray-900">{user.id}</div>
                  </TableCell>
                  <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: user.avatarColor }}>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full">
                    <Badge 
                      variant={user.position === 'Teacher' ? 'default' : 'secondary'}
                      className={`${
                        user.position === 'Teacher' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                      } rounded-full px-3 py-1 text-xs`}
                    >
                      {user.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full text-sm text-gray-500">
                    {user.email}
                  </TableCell>
                  <TableCell className="py-4 px-6 first:rounded-l-full last:rounded-r-full text-sm text-gray-500">
                    {user.contact}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ShadcnTable>
        </div>
      </div>
    </div>
  );
};

export default Table;
interface Notice {
  id: number;
  title: string;
  date: string;
  description: string;
}

const notices: Notice[] = [
  { id: 1, title: "Exam Schedule Released", date: "Feb 10, 2025", description: "Check the updated exam timetable." },
  { id: 2, title: "Holiday Notice", date: "Feb 15, 2025", description: "College will remain closed on Feb 20." },
  {
    id: 3,
    title: "Fee Payment Reminder",
    date: "Feb 18, 2025",
    description: "Last date for fee submission is Feb 25.",
  },
  { id: 4, title: "Sports Meet", date: "Mar 05, 2025", description: "Annual sports meet will be held on Mar 10." },
];

export default function NoticeTable() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white ">Notices :- </h1>
      <div className="overflow-x-auto dark:bg-black">
        <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
          <thead className="bg-gray-200 dark:bg-gray-800">
            <tr>
              <th className="p-4 text-left text-gray-700 dark:text-white">Title</th>
              <th className="p-4 text-left text-gray-700 dark:text-white">Date</th>
              <th className="p-4 text-left text-gray-700 dark:text-white">Description</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-black ">
            {notices.map((notice) => (
              <tr
                key={notice.id}
                className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <td className="p-4 dark:text-white">{notice.title}</td>
                <td className="p-4 dark:text-white">{notice.date}</td>
                <td className="p-4 dark:text-white">{notice.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ExamDates() {
  const exams = [
    { field: "BA", date: "March 10, 2025", icon: "📖" },
    { field: "BCOM", date: "March 15, 2025", icon: "💼" },
    { field: "BBA", date: "March 20, 2025", icon: "📊" },
    { field: "BSC", date: "March 25, 2025", icon: "🔬" },
    { field: "BCA", date: "March 28, 2025", icon: "💻" },
    { field: "MA", date: "April 5, 2025", icon: "📜" },
    { field: "MCOM", date: "April 10, 2025", icon: "📈" },
  ];
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Exam Dates :- </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 md:p-12 w-full">
        {exams.map((exam, index) => (
          <div key={index} className="p-6  dark:bg-black dark:text-white shadow-md rounded-lg hover:shadow-lg transition duration-300">
            <p className="text-center text-4xl">{exam.icon}</p>
            <h2 className="font-semibold text-lg text-center  mt-2">{exam.field} Exam</h2>
            <p className="mt-2 text-center">
              Exam Date: <span className="font-bold">{exam.date}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

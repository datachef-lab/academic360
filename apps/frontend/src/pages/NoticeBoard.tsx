import React from 'react';

interface Notice {
  title: string;
  description: string;
  date: string;
}

const notices: Notice[] = [
  {
    title: 'Mid-Term Exams Schedule',
    description: 'The mid-term exams will be held from 10th Feb to 15th Feb. Please check the exam schedule and prepare accordingly.',
    date: 'January 16, 2025',
  },
  {
    title: 'Annual Sports Day',
    description: 'Join us for the Annual Sports Day on 25th Jan. Register by 20th Jan to participate in various sports events.',
    date: 'January 14, 2025',
  },
  {
    title: 'Guest Lecture: AI in Healthcare',
    description: 'A guest lecture on AI in Healthcare will be held on 22nd Jan at 2:00 PM in the main auditorium. Don’t miss out!',
    date: 'January 12, 2025',
  },
  {
    title: 'Student Union Elections',
    description: 'The Student Union Elections will be held on 30th Jan. Nominate yourself by 25th Jan to stand for elections.',
    date: 'January 10, 2025',
  },
];

const NoticeBoard: React.FC = () => {
  return (
    <div className=" w-full bg-gray-50 p-8 rounded-lg  space-y-4 ">

      <div className="space-y-4">
        {notices.map((notice, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500 space-y-2"
          >
            <h3 className="text-xl font-bold text-blue-700">{notice.title}</h3>
            <p className="text-gray-700">{notice.description}</p>
            <p className="text-sm text-gray-500 text-right">{notice.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoticeBoard;

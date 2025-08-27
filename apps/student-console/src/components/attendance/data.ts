// Mock data - replace with actual data from your backend
export const mockData = {
    semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    holidays: [
        { date: "2024-03-15", name: "Spring Break", type: "academic" },
        { date: "2024-03-20", name: "Holi", type: "public" },
        { date: "2024-04-01", name: "Easter Monday", type: "public" },
    ],
    collegeEvents: [
        {
            id: 1,
            title: "Tech Symposium 2024",
            date: "2024-03-25",
            time: "09:00 AM",
            location: "Main Auditorium",
            type: "academic",
            description:
                "Annual technical symposium featuring workshops and competitions",
            registrationDeadline: "2024-03-20",
        },
        {
            id: 2,
            title: "Cultural Fest",
            date: "2024-04-05",
            time: "02:00 PM",
            location: "College Grounds",
            type: "cultural",
            description:
                "Annual cultural festival with music, dance, and drama performances",
            registrationDeadline: "2024-03-30",
        },
        {
            id: 3,
            title: "Career Fair",
            date: "2024-04-15",
            time: "10:00 AM",
            location: "Sports Complex",
            type: "career",
            description:
                "Connect with top companies and explore internship opportunities",
            registrationDeadline: "2024-04-10",
        },
    ],
    timetable: {
        Monday: [
            { time: "09:00 - 10:30", subject: "CS101", room: "101", floor: "1st" },
            { time: "11:00 - 12:30", subject: "MA101", room: "202", floor: "2nd" },
            {
                time: "14:00 - 15:30",
                subject: "PH101",
                room: "Lab 1",
                floor: "Ground",
            },
        ],
        Tuesday: [
            { time: "10:00 - 11:30", subject: "CS101", room: "101", floor: "1st" },
            { time: "13:00 - 14:30", subject: "MA101", room: "202", floor: "2nd" },
        ],
        Wednesday: [
            { time: "09:00 - 10:30", subject: "CS101", room: "101", floor: "1st" },
            {
                time: "11:00 - 12:30",
                subject: "PH101",
                room: "Lab 1",
                floor: "Ground",
            },
        ],
        Thursday: [
            { time: "10:00 - 11:30", subject: "MA101", room: "202", floor: "2nd" },
            {
                time: "14:00 - 15:30",
                subject: "PH101",
                room: "Lab 1",
                floor: "Ground",
            },
        ],
        Friday: [
            { time: "09:00 - 10:30", subject: "CS101", room: "101", floor: "1st" },
            { time: "11:00 - 12:30", subject: "MA101", room: "202", floor: "2nd" },
        ],
    } as const,
    subjects: {
        1: [
            {
                code: "CS101",
                name: "Introduction to Programming",
                attended: 2,
                total: 15,
                schedule: "Mon, Wed, Fri - 10:00 AM",
                instructor: "Dr. Smith",
                recentClasses: [
                    { date: "Feb 28, 2025", status: "present" },
                    { date: "Feb 26, 2025", status: "present" },
                    { date: "Feb 24, 2025", status: "absent" },
                ],
            },
            {
                code: "MA101",
                name: "Mathematics I",
                attended: 14,
                total: 15,
                schedule: "Tue, Thu - 11:30 AM",
                instructor: "Dr. Johnson",
                recentClasses: [
                    { date: "Feb 27, 2025", status: "present" },
                    { date: "Feb 25, 2025", status: "present" },
                    { date: "Feb 20, 2025", status: "present" },
                ],
            },
            {
                code: "PH101",
                name: "Physics",
                attended: 10,
                total: 12,
                schedule: "Mon, Wed - 2:00 PM",
                instructor: "Dr. Garcia",
                recentClasses: [
                    { date: "Feb 28, 2025", status: "present" },
                    { date: "Feb 26, 2025", status: "absent" },
                    { date: "Feb 24, 2025", status: "present" },
                ],
            },
        ],
        2: [
            {
                code: "CS201",
                name: "Data Structures",
                attended: 8,
                total: 12,
                schedule: "Mon, Wed, Fri - 9:00 AM",
                instructor: "Dr. Williams",
                recentClasses: [
                    { date: "Feb 28, 2025", status: "present" },
                    { date: "Feb 26, 2025", status: "absent" },
                    { date: "Feb 24, 2025", status: "absent" },
                ],
            },
            {
                code: "MA201",
                name: "Mathematics II",
                attended: 10,
                total: 10,
                schedule: "Tue, Thu - 1:30 PM",
                instructor: "Dr. Brown",
                recentClasses: [
                    { date: "Feb 27, 2025", status: "present" },
                    { date: "Feb 25, 2025", status: "present" },
                    { date: "Feb 20, 2025", status: "present" },
                ],
            },
        ],
    },
};

export type MockData = typeof mockData;
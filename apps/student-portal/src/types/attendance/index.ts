export type ClassSchedule = {
  readonly time: string;
  readonly subject: "CS101" | "MA101" | "PH101" | "ONGOING301";
  readonly room: string;
  readonly floor: string;
};

// Helper to get the current or next class based on time
export interface Subject {
  code: string;
  name: string;
  attended: number;
  total: number;
  schedule: string;
  instructor: string;
  recentClasses: { date: string; status: string }[];
}
export interface UpcomingClass extends Subject {
  classDate: Date;
  room: string;
  floor: string;
}
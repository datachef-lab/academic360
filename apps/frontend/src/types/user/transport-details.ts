export type TransportDetails = {
  id: number;
  studentId: number;
  transportId: number;
  pickupPointId: number;
  seatNumber: string;
  pickupTime: string; // ISO time string, e.g. '08:30:00'
  dropOffTime: string; // ISO time string, e.g. '16:30:00'
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
};

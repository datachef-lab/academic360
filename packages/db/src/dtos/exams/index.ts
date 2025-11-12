import { FloorT, RoomT } from "@/schemas/models/exams";

export interface RoomDto extends Omit<RoomT, "floorId"> {
    floor: FloorT;
}
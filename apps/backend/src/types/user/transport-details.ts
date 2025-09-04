import { Transport } from "@/features/resources/models/transport.model.js";
import { PickupPoint } from "@/features/resources/models/pickupPoint.model.js";
import { TransportDetails } from "@repo/db/schemas/models/user";

export interface TransportDetailsType extends Omit<TransportDetails, "transportId" | "pickupPointId"> {
    transportInfo: Transport | null;
    pickupPoint: PickupPoint | null;
}


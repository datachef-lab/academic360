import { Transport } from "@/features/resources/models/transport.model.ts";
import { PickupPoint } from "@/features/resources/models/pickupPoint.model.ts";
import { TransportDetails } from "@/features/user/models/transportDetails.model.ts";

export interface TransportDetailsType extends Omit<TransportDetails, "transportId" | "pickupPointId"> {
    transportInfo: Transport | null;
    pickupPoint: PickupPoint | null;
}


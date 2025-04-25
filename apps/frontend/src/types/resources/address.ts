export interface Address {
    readonly id?: number;
    country: string | null;
    state: string | null;
    city: string | null;
    addressLine: string | null;
    landmark: string | null;
    localityType: "RURAL" | "URBAN" | null;
    phone: string | null;
    pincode: string | null;
    
}
export interface Address {
  id: number;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  addressLine: string | null;
  landmark: string | null;
  localityType: string | null;
  phone: string | null;
  pincode: string | null;
  createdAt: string;
  updatedAt: string;
}

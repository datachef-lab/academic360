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
  country?: { id: number; name: string } | null;
  state?: { id: number; name: string } | null;
  city?: { id: number; name: string } | null;
  district?: { id: number; name: string } | null;
  postOffice?: { id: number; name: string } | null;
  policeStation?: { id: number; name: string } | null;
}

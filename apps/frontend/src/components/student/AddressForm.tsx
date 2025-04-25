import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Address } from "@/types/resources/address";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Home, MapPin, Building, Phone } from "lucide-react";

type AddressProps = {
  address: Address | null;
  onChange: (address: Address) => void;
  isEditable?: boolean;
  title?: string;
};

export default function AddressForm({ address, onChange, isEditable = true, title = "Address" }: AddressProps) {
  const [localAddress, setLocalAddress] = useState<Partial<Address>>({
    addressLine: "",
    landmark: "",
    localityType: "URBAN",
    phone: "",
    pincode: "",
    country: null,
    state: null,
    city: null,
  });

  useEffect(() => {
    if (address) {
      setLocalAddress({
        id: address.id,
        addressLine: address.addressLine || "",
        landmark: address.landmark || "",
        localityType: address.localityType || "URBAN",
        phone: address.phone || "",
        pincode: address.pincode || "",
        country: address.country,
        state: address.state,
        city: address.city,
      });
    }
  }, [address]);

  const handleChange = (field: keyof Address, value: string) => {
    const updatedAddress = { ...localAddress, [field]: value };
    setLocalAddress(updatedAddress);

    // Only trigger onChange if we have a complete address
    if (updatedAddress.addressLine && updatedAddress.pincode) {
      onChange(updatedAddress as Address);
    }
  };

  if (!isEditable && !address) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 italic">No address information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-md font-medium">{title}</h3>}

      <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        {!isEditable ? (
          // Read-only view
          <div className="space-y-2">
            <p className="mb-2">{address?.addressLine}</p>
            {address?.landmark && <p className="text-sm text-gray-600">Landmark: {address.landmark}</p>}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-medium">Locality:</span> {address?.localityType}
              </p>
              <p>
                <span className="font-medium">Pincode:</span> {address?.pincode}
              </p>
              {address?.phone && (
                <p>
                  <span className="font-medium">Phone:</span> {address.phone}
                </p>
              )}
            </div>
            {address?.city && address?.state && (
              <p className="text-sm">
                <span className="font-medium">Location:</span> {address.city}, {address.state}
                {address.country && `, ${address.country}`}
              </p>
            )}
          </div>
        ) : (
          // Editable form
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Country
                </Label>
                <Input
                  value={localAddress.country || ""}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Country"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  State
                </Label>
                <Input
                  value={localAddress.state || ""}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="State"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  City
                </Label>
                <Input
                  value={localAddress.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Address Line
              </Label>
              <Input
                value={localAddress.addressLine || ""}
                onChange={(e) => handleChange("addressLine", e.target.value)}
                placeholder="Enter full address"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Landmark (Optional)
              </Label>
              <Input
                value={localAddress.landmark || ""}
                onChange={(e) => handleChange("landmark", e.target.value)}
                placeholder="Enter nearby landmark"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Locality Type
                </Label>
                <Select
                  value={localAddress.localityType || "URBAN"}
                  onValueChange={(value) => handleChange("localityType", value as "RURAL" | "URBAN")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select locality type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URBAN">Urban</SelectItem>
                    <SelectItem value="RURAL">Rural</SelectItem>
                    <SelectItem value="SEMI_URBAN">Semi-Urban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Pincode
                </Label>
                <Input
                  value={localAddress.pincode || ""}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  placeholder="Enter pincode"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone (Optional)
              </Label>
              <Input
                value={localAddress.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter contact phone for this address"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

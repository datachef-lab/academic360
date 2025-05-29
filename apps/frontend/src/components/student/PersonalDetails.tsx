import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { findPersonalDetailsByStudentId, addPersonalDetails, updatePersonalDetails } from "@/services/personal-details-api";
import { PersonalDetails as PersonalDetailsType } from "@/types/user/personal-details";
import { CalendarIcon, Globe, IdCard, Mail, User, Save, Sparkles, BookOpen, CheckCircle, PenLine, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

// Helper function to safely access object properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNameProperty = (obj: any): string => {
  if (obj && typeof obj === 'object' && 'name' in obj && typeof obj.name === 'string') {
    return obj.name;
  }
  return '';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAddressProperty = (obj: any, prop: string): string => {
  if (obj && typeof obj === 'object' && prop in obj && obj[prop] !== null) {
    return obj[prop];
  }
  return '';
};

const formElements = [
  { name: "aadhaarCardNumber", label: "Aadhaar Number", type: "text", icon: <IdCard className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "alternativeEmail", label: "Alternative Email", type: "email", icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "TRANSGENDER", label: "Transgender" },
];

const defaultPersonalDetails: PersonalDetailsType = {
  studentId: 0,
  aadhaarCardNumber: null,
  email: null,
  alternativeEmail: null,
  dateOfBirth: null,
  nationality: null,
  motherTongue: null,
  religion: null,
  residentialAddress: null,
  mailingAddress: null,
  category: null,
  gender: null,
  disability: "OTHER",
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface PersonalDetailProps {
  studentId: number;
}

export default function PersonalDetail({ studentId }: PersonalDetailProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PersonalDetailsType>({
    ...defaultPersonalDetails,
    studentId
  });

  // Use React Query to fetch personal details
  const { data: personalDetails, isLoading, isError, refetch } = useQuery({
    queryKey: ['personalDetails', studentId],
    queryFn: async () => {
      const response = await findPersonalDetailsByStudentId(studentId);
      return response.payload;
    },
    enabled: studentId > 0,
    retry: 1,
    staleTime: 300000, // 5 minutes
  });

  // Update form data when personal details are loaded
  useEffect(() => {
    if (personalDetails) {
      console.log("Personal details data loaded:", personalDetails);
      setFormData(personalDetails);
    }
  }, [personalDetails]);

  const updateMutation = useMutation({
    mutationFn: (formData: PersonalDetailsType) => {
      if (formData.id) {
        return updatePersonalDetails(formData.id, formData);
      } else {
        return addPersonalDetails(formData);
      }
    },
    onSuccess: () => {
      toast.success("Personal details have been successfully updated.", {
        icon: <PenLine />,
      });
      setShowSuccess(true);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to save personal details. Please try again.");
      console.error("Error saving personal details:", error);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (formData.email && !formData.email.includes("@")) {
      newErrors.email = "Invalid email format";
    }
    
    // Alternative email validation (only if provided)
    if (formData.alternativeEmail && !formData.alternativeEmail.includes("@")) {
      newErrors.alternativeEmail = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  useEffect(() => {
    if (updateMutation.isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 800);
      return () => clearTimeout(timer);
    }
  }, [updateMutation.isSuccess]);

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;
    console.log("Submitting form data:", formData);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="w-8 h-8 text-blue-500" />
        <span className="ml-2">Loading personal details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-40 text-red-500">
        <p>Error loading personal details</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="shadow-lg border py-10 w-full bg-white flex items-center rounded-lg justify-center px-5">
      <div className="max-w-[80%] w-full">
        {/* Personal Details Section */}
        <h3 className="text-lg font-medium border-b pb-1 mb-6">PERSONAL DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {formElements.map(({ name, label, type, icon }) => (
            <div key={name} className="flex flex-col mr-8">
              <div className="relative p-1">
                {errors[name] ? <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span> : null}
                <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
                <Input
                  id={name}
                  name={name}
                  type={type}
                  value={formData[name as keyof PersonalDetailsType] as string || ""}
                  placeholder={label}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 rounded-lg py-2 ${errors[name] ? "border-red-500" : ""}`}
                />
              </div>
              {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
            </div>
          ))}

          {/* Date of Birth Field */}
          <div className="flex flex-col mr-8">
            <div className="relative p-1">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Date of Birth</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <CalendarIcon className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <Input
                name="dateOfBirth"
                type="date"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth as any).toISOString().split('T')[0] : ""}
                onChange={handleChange}
                className="w-full pl-10 pr-3 rounded-lg py-2"
              />
            </div>
          </div>

          {/* Gender Field */}
          <div className="flex flex-col mr-8">
            <div className="relative p-1">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Gender</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <User className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }) as PersonalDetailsType)}
                className="w-full pl-10 pr-3 rounded-lg py-2 border"
              >
                <option value="">Select Gender</option>
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Religion Field */}
          <div className="flex flex-col mr-8">
            <div className="relative p-1">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Religion</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <BookOpen className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <Input
                name="religion"
                type="text"
                value={getNameProperty(formData.religion)}
                onChange={(e) => {
                  if (formData.religion) {
                    setFormData(prev => ({
                      ...prev,
                      religion: { ...prev.religion, name: e.target.value }
                    }) as PersonalDetailsType);
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      religion: { name: e.target.value, id: 0 }
                    }) as PersonalDetailsType);
                  }
                }}
                className="w-full pl-10 pr-3 rounded-lg py-2"
              />
            </div>
          </div>

          {/* Category Field */}
          <div className="flex flex-col mr-8">
            <div className="relative p-1">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Category</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <BookOpen className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <Input
                name="category"
                type="text"
                value={getNameProperty(formData.category)}
                onChange={(e) => {
                  if (formData.category) {
                    setFormData(prev => ({
                      ...prev,
                      category: { ...prev.category, name: e.target.value }
                    }) as PersonalDetailsType);
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      category: { name: e.target.value, id: 0 }
                    }) as PersonalDetailsType);
                  }
                }}
                className="w-full pl-10 pr-3 rounded-lg py-2"
              />
            </div>
          </div>

          {/* Nationality Field */}
          <div className="flex flex-col mr-8">
            <div className="relative p-1">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Nationality</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Globe className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <Input
                name="nationality"
                type="text"
                value={getNameProperty(formData.nationality)}
                onChange={(e) => {
                  if (formData.nationality) {
                    setFormData(prev => ({
                      ...prev,
                      nationality: { ...prev.nationality, name: e.target.value }
                    }) as PersonalDetailsType);
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      nationality: { name: e.target.value, id: 0 }
                    }) as PersonalDetailsType);
                  }
                }}
                className="w-full pl-10 pr-3 rounded-lg py-2"
              />
            </div>
          </div>

          {/* Disability Field */}
          <div className="flex flex-col mr-8">
            <div className="relative p-1">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Disability</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <select
                name="disability"
                value={formData.disability || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, disability: e.target.value }) as PersonalDetailsType)}
                className="w-full pl-10 pr-3 rounded-lg py-2 border"
              >
                <option value="">None</option>
                <option value="VISUAL">Visual</option>
                <option value="HEARING_IMPAIRMENT">Hearing Impairment</option>
                <option value="VISUAL_IMPAIRMENT">Visual Impairment</option>
                <option value="ORTHOPEDIC">Orthopedic</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <h3 className="text-lg font-medium border-b pb-1 mb-6">ADDRESS DETAILS</h3>
        
        {/* Residential Address */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">RESIDENTIAL ADDRESS</h4>
          <div className="p-4 rounded-lg border">
            {formData.residentialAddress ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Address Line</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.residentialAddress, 'addressLine')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          residentialAddress: {
                            ...prev.residentialAddress,
                            addressLine: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Pincode</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.residentialAddress, 'pincode')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          residentialAddress: {
                            ...prev.residentialAddress,
                            pincode: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Landmark</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.residentialAddress, 'landmark') || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          residentialAddress: {
                            ...prev.residentialAddress,
                            landmark: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      placeholder="Enter landmark"
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Phone</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Phone className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.residentialAddress, 'phone') || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          residentialAddress: {
                            ...prev.residentialAddress,
                            phone: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      placeholder="Enter phone number"
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Locality Type</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <select
                      value={getAddressProperty(formData.residentialAddress, 'localityType')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          residentialAddress: {
                            ...prev.residentialAddress,
                            localityType: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      className="w-full pl-10 pr-3 rounded-lg py-2 border"
                    >
                      <option value="URBAN">Urban</option>
                      <option value="RURAL">Rural</option>
                      <option value="SEMI_URBAN">Semi-Urban</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No residential address provided</p>
            )}
          </div>
        </div>
        
        {/* Mailing Address */}
        <div className="mb-8">
          <h4 className="text-md font-medium mb-2">MAILING ADDRESS</h4>
          <div className="p-4 rounded-lg border">
            {formData.mailingAddress ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-medium">Address Line</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.mailingAddress, 'addressLine')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          mailingAddress: {
                            ...prev.mailingAddress,
                            addressLine: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Pincode</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.mailingAddress, 'pincode')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          mailingAddress: {
                            ...prev.mailingAddress,
                            pincode: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Landmark</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.mailingAddress, 'landmark') || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          mailingAddress: {
                            ...prev.mailingAddress,
                            landmark: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      placeholder="Enter landmark"
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Phone</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Phone className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <Input
                      value={getAddressProperty(formData.mailingAddress, 'phone') || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          mailingAddress: {
                            ...prev.mailingAddress,
                            phone: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      placeholder="Enter phone number"
                      className="w-full pl-10 pr-3 rounded-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium">Locality Type</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                    </span>
                    <select
                      value={getAddressProperty(formData.mailingAddress, 'localityType')}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          mailingAddress: {
                            ...prev.mailingAddress,
                            localityType: e.target.value
                          }
                        }) as PersonalDetailsType);
                      }}
                      className="w-full pl-10 pr-3 rounded-lg py-2 border"
                    >
                      <option value="URBAN">Urban</option>
                      <option value="RURAL">Rural</option>
                      <option value="SEMI_URBAN">Semi-Urban</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No mailing address provided</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-span-2 mt-6">
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            className="w-full sm:w-auto text-white font-medium sm:font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
            disabled={updateMutation.isLoading}
          >
            {updateMutation.isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

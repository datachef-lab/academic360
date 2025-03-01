import axiosInstance from "@/utils/api";



export const getAcademicIdentifier = async (studentId: number) => {
  if (!studentId) return null;
 
  const response = await axiosInstance.get(`/api/academicIdentifiers/query?studentId=${studentId}`,
    {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
        },
    });
  console.log("res data1**",response.data);
  console.log("res,data**",response.data.payload);
  return response.data;
};

export const getAccommodation = async (studentId: number) => {
    if (!studentId) return null;
   
    const response = await axiosInstance.get(`/api/accommodations/query?studentId=${studentId}`,
      {
          headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
          },
      });
    console.log("res data1**",response.data);
    console.log("res,data**",response.data.payload);
    return response.data;
  };

  export const getAcademicHistory = async (studentId: number) => {
    if (!studentId) return null;
   
    const response = await axiosInstance.get(`/api/academicHistories/query?studentId=${studentId}`,
      {
          headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
          },
      });
    console.log("res data1**",response.data);
    console.log("res,data**",response.data.payload);
    return response.data;
  };

  export const getEmergencyContact = async (studentId: number) => {
    if (!studentId) return null;
   
    const response = await axiosInstance.get(`/api/emergency-contact/query?studentId=${studentId}`,
      {
          headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
          },
      });
    console.log("res data1**",response.data);
    console.log("res,data**",response.data.payload);
    return response.data;
  };
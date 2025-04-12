import axiosInstance from "@/utils/api";
import axios from "axios";



export const getAcademicIdentifier = async (studentId: number) => {
  try {
    if (!studentId) return null;

    const response = await axiosInstance.get(`/api/academicIdentifiers/query?studentId=${studentId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    console.log("res data1**", response.data);
    console.log("res,data**", response.data.payload);
    return response.data;
  } catch (error) {
    console.log("error", error);
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw error;
  }

};

export const getAccommodation = async (studentId: number) => {
  try {
    if (!studentId) return null;

    const response = await axiosInstance.get(`/api/accommodations/query?studentId=${studentId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
        },
      });
    console.log("res data1**", response.data);
    console.log("res,data**", response.data.payload);
    return response.data;

  } catch (error) {
    console.log("error", error);
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw error;
  }


 
};

export const getAcademicHistory = async (studentId: number) => {
  try {
    console.log("studentId", studentId);
    if (!studentId) return null;

    const response = await axiosInstance.get(`/api/academicHistories/query?studentId=${studentId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
        },
      });
    // console.log("res data1**",response.data);
    console.log("res,data**",response.data.payload);
    return response.data;

  } catch (error) {
    console.log("error", error);

    if (axios.isAxiosError(error)) {
      // Don't swallow the error - let React Query handle it
      throw error;
    }
    throw error;
    // Re-throw non-Axios errors
  }

};

export const getEmergencyContact = async (studentId: number) => {
  try {
    if (!studentId) return null;

    const response = await axiosInstance.get(`/api/emergency-contact/query?studentId=${studentId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
        },
      });
    console.log("res data1**", response.data);
    console.log("res,data**", response.data.payload);
    return response.data;

  } catch (error) {
    console.log("error", error);
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw error;

  }

};

export const getInstitution = async (studentId: number) => {
  if (!studentId) return null;

  const response = await axiosInstance.get(`/api/institutions/${studentId}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
      },
    });

  // console.log("res,data**",response.data);
  // console.log("res data test*****",response.data?.payload?.name);
  return response.data;
};

export const getBoardUniversity = async (id: number) => {
  if (!id) return null;

  const response = await axiosInstance.get(`/api/board-universities/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, 
      },
    });

  console.log("res,data**", response.data);
  console.log("res data test*****", response.data?.payload?.name);
  return response.data;
};


export const getBoardResultStatus = async (id: number) => {
  if (!id) return null;

  const response = await axiosInstance.get(`/api/resultstatus/query?id=${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
      },
    });

  console.log("res,data**", response.data.payload);
  console.log("res data test*****", response.data?.payload?.name);
  return response.data;
};


export const getAllSpecialization = async () => {
 

  const response = await axiosInstance.get(`/api/specialization`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ Send Bearer token
      },
    });

  console.log("res,data**", response.data.payload);
  console.log("res data test*****", response.data?.payload?.name);
  return response.data.payload;
};
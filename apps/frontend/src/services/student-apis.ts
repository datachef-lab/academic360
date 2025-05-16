import { ResultStatus } from "@/types/enums";
import { Address } from "@/types/resources/address";
import { AnnualIncome } from "@/types/resources/annual-income";
import { BoardUniversity } from "@/types/resources/board-university";
import { Category } from "@/types/resources/category";
import { Degree } from "@/types/resources/degree";
import { Institution } from "@/types/resources/institution";
import { Religion } from "@/types/resources/religion";
import { AcademicHistory } from "@/types/user/academic-history";
import { AcademicIdentifier } from "@/types/user/academic-identifier";
import { Accommodation } from "@/types/user/accommodation";
import { EmergencyContact } from "@/types/user/emergency-contact";
import { Health } from "@/types/user/health";
import { Parent } from "@/types/user/parent";
import { PersonalDetails } from "@/types/user/personal-details";
import { User } from "@/types/user/user";
import axiosInstance from "@/utils/api";

export const updateEmergencyContact = async (formData: EmergencyContact, id: number) => {
  const response = await axiosInstance.put(`/api/emergency-contact/${id}`, formData, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

export const createEmergencyContact = async (formData: EmergencyContact) => {
  const response = await axiosInstance.post(`/api/emergency-contact`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

export const updateAccommodation = async (formData: Accommodation, id: number) => {
  const res = await axiosInstance.put(`/api/accommodations/query?id=${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};
export const createAccommodation = async (formData: Accommodation) => {
  const response = await axiosInstance.post(`/api/accommodations`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

export const updateBoardUniversities = async (formData: BoardUniversity, id: number) => {
  const res = await axiosInstance.put(`/api/board-universities/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const createBoardUniversities = async (formData: BoardUniversity) => {
  const res = await axiosInstance.post(`/api/board-universities`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const updateInstitution = async (formData: Institution, id: number) => {
  const res = await axiosInstance.put(`/api/institutions/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const createInstitution = async (formData: Institution) => {
  const res = await axiosInstance.post(`/api/institutions`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const updateBoardResultStatus = async (formData: ResultStatus, id: number) => {
  const res = await axiosInstance.put(`/api/resultstatus/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const createBoardResultStatus = async (formData: ResultStatus) => {
  const res = await axiosInstance.post(`/api/resultstatus`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const updatedAcademicIdentifier = async (formData: AcademicIdentifier, id: number) => {
  const res = await axiosInstance.put(`/api/academicIdentifiers/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const createAcademicIdentifier = async (formData: AcademicIdentifier) => {
  const res = await axiosInstance.post(`/api/academicIdentifiers/`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const updateAcademicHistory = async (id: number, formData: AcademicHistory) => {
  const res = await axiosInstance.put(`/api/academicHistories/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const createAcademicHistory = async (formData: AcademicHistory) => {
  const res = await axiosInstance.post(`/api/academicHistories`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const UpdateDegree = async (formData: Degree, id: number) => {
  console.log("formdata", formData);
  console.log("id", id);
  const res = await axiosInstance.put(`/api/degree/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};
export const UpdateCategory = async (formData: Category, id: number) => {
  console.log("formdata", formData);
  console.log("id", id);
  const res = await axiosInstance.put(`/api/categories/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};
export const UpdateAnnualIncome = async (formData: AnnualIncome, id: number) => {
  console.log("formdata", formData);
  console.log("id", id);
  const res = await axiosInstance.put(`/api/annual-incomes/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const UpdateReligion = async (formData: Religion, id: number) => {
  console.log("formdata", formData);
  console.log("id", id);
  const res = await axiosInstance.put(`/api/religions/${id}`, formData);
  return res.data;
};

export const UpdateUser = async (formData: User, id: number) => {
  console.log("formdata", formData);
  console.log("id", id);
  const res = await axiosInstance.put(`/api/users/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

type ReportFilters = {
  page?: number;
  pageSize?: number;
  framework?: string;
  stream?: string;
  year?: string;
  searchText?: string;
  semester?: number;
  showFailedOnly?: boolean;
  export?: boolean;
};
export const getAllReports = async (filters: ReportFilters = {}) => {
  try {
    const { export: isExport, ...rest } = filters;
    
    // Build query string from rest filters
    let query = Object.entries(rest)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");

    // Add export parameter if needed
    if (isExport) {
      query += (query ? "&" : "") + "export=true";
    }

    const url = `/api/reports/query${query ? "?" + query : ""}`;
    console.log("URL:", url);
    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};


type marksheetFilters = {
  page?: number;
  pageSize?: number;
  stream?: string;
  year?: string;
  searchText?: string;
  semester?: number;
  showFailedOnly?: boolean;
  export?: boolean;
};
export const getAllMarksheet = async (filters: marksheetFilters = {}) => {
  const {export:isExport, ...rest} = filters;
  // console.log("Filters in getAllReports:", filters);
  let query = Object.entries(rest)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
    if(isExport){
      query += "isExport=true";
    }
  // console.log("Query string:", query);
  const url = `/api/marksheets/query${query ? "?" + query : ""}`;
  // console.log("URL:", url);

  const response = await axiosInstance.get(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  // console.log("response****/", response.data);

  return response.data.payload;
};

export const createFamilyDetails = async (formData: Parent) => {
  const response = await axiosInstance.post(`/api/parents`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

export const createHealthDetails = async (formData: Health) => {
  const response = await axiosInstance.post(`/api/health`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

export const createPersonalDetails = async (formData: PersonalDetails) => {
  const response = await axiosInstance.post(`/api/personal-details`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

export const createAddressDetails = async (formData: Address) => {
  const response = await axiosInstance.post(`/api/address`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};

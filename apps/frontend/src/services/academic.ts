import axiosInstance from "@/utils/api";
import axios from "axios";
import { ApiResonse } from "@/types/api-response";
import { Course } from "@/types/academics/course";
import { Shift } from "@/types/academics/shift";
import { Section } from "@/types/academics/section";

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
        return response.data.payload;

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
        console.log("res,data**", response.data.payload);
        return response.data.payload;

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
        return response.data.payload;

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

export async function getAllCourses(): Promise<ApiResonse<Course[]>> {
    const response = await axiosInstance.get(`/api/v1/academics/streams`);
    return response.data;
}

export async function getAllShifts(): Promise<Shift[]> {
    const response = await axiosInstance.get(`/api/v1/shifts`);
    return response.data;
}

// Get all sections
export async function getAllSections(): Promise<Section[]> {
    const response = await axiosInstance.get(`/api/v1/sections`);
    // If the backend returns { payload: Section[] }, extract it
    if (response.data && response.data.payload) return response.data.payload;
    return response.data;
}
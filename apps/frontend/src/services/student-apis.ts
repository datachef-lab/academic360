import { ResultStatus } from "@/types/enums";
import { BoardUniversity } from "@/types/resources/board-university";
import { Institution } from "@/types/resources/institution";
import { AcademicHistory } from "@/types/user/academic-history";
import { academicIdentifier } from "@/types/user/academic-identifier";
import { Accommodation } from "@/types/user/accommodation";
import { EmergencyContact } from "@/types/user/emergency-contact";
import axiosInstance from "@/utils/api";

export const  updateEmergencyContact = async (formData: EmergencyContact,id: number) => {
    const response = await axiosInstance.put(`/api/emergency-contact/${id}`,formData,
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`, 
            },
        }  
    )
    return response.data;
};

export const createEmergencyContact = async (formData: EmergencyContact) => {
    const response = await axiosInstance.post(`/api/emergency-contact`,formData,
        {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`, 
            },
        }  
    )
    return response.data;
};

export const updateAccommodation = async (formData: Accommodation, id: number) => {
    const res = await axiosInstance.put(`/api/accommodations/query?id=${id}`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};



export const updateBoardUniversities = async (formData: BoardUniversity, id: number) => {
    const res = await axiosInstance.put(`/api/board-universities/${id}`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};

export const createBoardUniversities = async (formData: BoardUniversity) => {
    const res = await axiosInstance.post(`/api/board-universities`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};

export const updateInstitution = async (formData: Institution,id: number) => {
    const res = await axiosInstance.put(`/api/institutions/${id}`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })  
    return res.data;
};

export const createInstitution = async (formData: Institution) => {
    const res = await axiosInstance.post(`/api/institutions`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};


export const updateBoardResultStatus = async (formData: ResultStatus, id: number) => {
    const res = await axiosInstance.put(`/api/resultstatus/${id}`,formData, {       
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};

export const createBoardResultStatus = async (formData: ResultStatus) => {
    const res = await axiosInstance.post(`/api/resultstatus`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};

export const updatedAcademicIdentifier = async (formData: academicIdentifier, id: number) => {
    const res = await axiosInstance.put(`/api/academicIdentifiers/${id}`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;

};


export const updateAcademicHistory = async (formData: AcademicHistory, id: number) => {
    const res = await axiosInstance.put(`/api/academicHistories/${id}`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};

export const createAcademicHistory = async (formData: AcademicHistory) => {
    const res = await axiosInstance.post(`/api/academicHistories`,formData,{
        headers:{
             "Authorization": `Bearer ${localStorage.getItem("token")}`,
        } 
    })
    return res.data;
};

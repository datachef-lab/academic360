"use client"; // Ensures this runs only on the client side

import React, {
  useState,
  useCallback,
  useEffect,
  ReactNode,
  createContext,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { Student } from "@/types/academics/student";
import { StudentAccessControl } from "@/types/academics/access-control";
import { ApplicationFormDto } from "@/types/admissions";
import { Admission, AdmissionGeneralInfo, ApplicationForm } from "@/db/schema";

const axiosInstance = axios.create({
  baseURL: "", // Use relative URLs
  withCredentials: true, // ✅ Ensures cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});

type LoginCred = {
  accessToken: string;
  user: Student;
  accessControl: StudentAccessControl;
};

export interface ApplicationFormContextType {
  applicationForm: ApplicationFormDto | null;
  setApplicationForm: React.Dispatch<
    React.SetStateAction<ApplicationFormDto | null>
  >;
  login: (mobileNumber: string, password: string) => Promise<void>;
  admission: Admission;
  displayFlag: boolean;
  isLoading: boolean;
}

export const ApplicationFormContext = createContext<
  ApplicationFormContextType | undefined
>(undefined);

interface ApplicationFormProviderProps {
  children: ReactNode;
  admission: Admission;
}

export const ApplicationFormProvider: React.FC<
  ApplicationFormProviderProps
> = ({ children, admission }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [displayFlag, setDisplayFlag] = useState(false);
  const [applicationForm, setApplicationForm] =
    useState<ApplicationFormDto | null>(null);
  const router = useRouter();
  const pathname = usePathname(); // Get the current route

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayFlag(true);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const login = async (mobileNumber: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post<
        LoginCred | { applicationForm: ApplicationFormDto }
      >("/api/auth/admission-form-login", {
        loginId: mobileNumber,
        password,
      });

      const data = response.data;

      console.log(data)

      if ("accessToken" in data && "user" in data) {
        router.push("/dashboard"); // Fully authenticated student
        return;
      }

      if ("applicationForm" in data) {
        setApplicationForm({
          ...data.applicationForm,
          generalInfo: data.applicationForm.generalInfo || {
            applicationFormId: data.applicationForm.id ?? 0,
            dateOfBirth: new Date().toISOString().split('T')[0],
            email: "",
            firstName: "",
            middleName: null,
            lastName: "",
            mobileNumber: "",
            password: "",
            categoryId: null,
            degreeLevel: "UNDER_GRADUATE",
            residenceOfKolkata: true,
            gender: "FEMALE",
            isGujarati: false,
            nationalityId: null,
            otherNationality: null,
            religionId: null,
            whatsappNumber: null,
          } as AdmissionGeneralInfo,
          admissionId: admission.id!,
        });
      }
    } catch (error: any) {
      console.error("Login failed:", error?.response?.data || error.message);
      throw new Error("Invalid credentials or login error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplicationFormRefresh =
    useCallback(async (): Promise<ApplicationFormDto | null> => {
      console.log("fetching refresh applicationForm");
      if (applicationForm) {
        console.log("Returning existing applicationFormDto:", applicationForm)
        setApplicationForm(applicationForm)
        return applicationForm;

      }
      if (!pathname.startsWith("/admissions")) return null;

      try {
        const response = await axiosInstance.get<
          LoginCred | { applicationForm: ApplicationFormDto }
        >("/api/auth/admission-refresh", { withCredentials: true });

        console.log("Token refresh response received");

        const data = response.data;
        console.log(data);

        // Distinguish between LoginCred and ApplicationForm response
        if ("accessToken" in data && "user" in data) {
          // Redirect to dashboard for fully logged-in users
          router.push("/dashboard");
          return null;
        }

        if ("applicationForm" in data) {
          setApplicationForm({
            ...data.applicationForm,
            generalInfo: data.applicationForm.generalInfo || {
              applicationFormId: data.applicationForm.id ?? 0,
              dateOfBirth: new Date().toISOString().split('T')[0],
              email: "",
              firstName: "",
              middleName: null,
              lastName: "",
              mobileNumber: "",
              password: "",
              categoryId: null,
              degreeLevel: "UNDER_GRADUATE",
              residenceOfKolkata: true,
              gender: "FEMALE",
              isGujarati: false,
              nationalityId: null,
              otherNationality: null,
              religionId: null,
              whatsappNumber: null,
            } as AdmissionGeneralInfo,
            admissionId: admission.id!,
          });
          return data.applicationForm;
        }

        const emptyForm: ApplicationFormDto = {
          id: 0,
          generalInfo: null,
          academicInfo: null,
          courseApplication: null,
          additionalInfo: null,
          admissionId: admission.id!,
          admissionStep: "GENERAL_INFORMATION",
          formStatus: "DRAFT",
          paymentInfo: null,
          currentStep: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setApplicationForm(emptyForm);
        return emptyForm;
      } catch (error) {
        // console.error("Failed to refresh-load applicationForm:", 
        // error);
        // if (axios.isAxiosError(error) && error.response?.status === 401) {
        //   router.push("/admission-form-login"); // Redirect to login page on 401
        // }
        setApplicationForm({
          id: 0,
          generalInfo: null,
          academicInfo: null,
          courseApplication: null,
          additionalInfo: null,
          admissionId: admission.id!,
          admissionStep: "GENERAL_INFORMATION",
          formStatus: "DRAFT",
          paymentInfo: null,
          currentStep: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [pathname, router]);

  useEffect(() => {
    if (!applicationForm && admission) {
      fetchApplicationFormRefresh();
    }
  }, [applicationForm, admission, pathname, fetchApplicationFormRefresh]);

  const contextValue: ApplicationFormContextType = {
    applicationForm: applicationForm!,
    setApplicationForm: setApplicationForm,
    login,
    admission,
    displayFlag,
    isLoading,
  };

  return (
    <ApplicationFormContext.Provider value={contextValue}>
      {children}
    </ApplicationFormContext.Provider>
  );
};

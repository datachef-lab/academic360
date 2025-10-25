"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { getStudentCuCorrectionRequests, getCuCorrectionRequestById } from "@/services/cu-registration";
import {
  getCuRegistrationDocuments,
  getCuRegistrationDocumentsByStudentUid,
  getAllStudentDocuments,
  getCuRegistrationDocumentSignedUrl,
  getCuRegistrationPdfUrlByRequestId,
  uploadCuRegistrationDocument,
} from "@/services/cu-registration-documents";
import { fetchUserProfile } from "@/services/student";
import { fetchStudentSubjectSelections, fetchMandatorySubjects } from "@/services/subject-selection";
import { getActiveCountries } from "@/services/country.service";
import { getStatesByCountry } from "@/services/state.service";
import { getCitiesByState } from "@/services/city.service";
import { getDistrictsByState } from "@/services/address.service";
import { getAllNationalities } from "@/services/nationalities.service";
import type { StudentDto, ProfileInfo } from "@repo/db/dtos/user";
import { genderTypeEnum, cuRegistrationCorrectionRequestStatusEnum } from "@repo/db/enums";
import axiosInstance from "@/utils/api";

interface CuRegistrationFormProps {
  studentId: number;
  studentData: StudentDto;
}

interface CorrectionFlags {
  gender: boolean;
  nationality: boolean;
  aadhaarNumber: boolean;
  apaarId: boolean;
  subjects: boolean;
}

interface EditableFormData {
  fullName: string;
  fatherMotherName: string;
  gender: string;
  nationality: string;
  belongsToEWS: string;
  aadhaarNumber: string;
  apaarId: string;
  // Address fields
  residentialAddress: string;
  residentialCountry: string;
  residentialState: string;
  residentialDistrict: string;
  residentialCity: string;
  residentialPinCode: string;
  residentialPoliceStation: string;
  residentialPostOffice: string;
  mailingAddress: string;
  mailingCountry: string;
  mailingState: string;
  mailingDistrict: string;
  mailingCity: string;
  mailingPinCode: string;
  mailingPoliceStation: string;
  mailingPostOffice: string;
}

interface CorrectionRequestStatus {
  id: number;
  status: string;
  remarks?: string;
  applicationNumber?: string;
}

export default function CuRegistrationForm({ studentId, studentData }: CuRegistrationFormProps) {
  const [activeTab, setActiveTab] = useState("personal");

  // Check if student is in BCOM program (for MDC display logic)
  const isBcomProgram = studentData?.programCourse?.course?.name
    ?.normalize("NFKD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .startsWith("BCOM");

  // Debug: Track activeTab changes
  React.useEffect(() => {
    console.info("[CU-REG MAIN-CONSOLE] activeTab changed to:", activeTab);
  }, [activeTab]);

  const [correctionFlags, setCorrectionFlags] = useState<CorrectionFlags>({
    gender: false,
    nationality: false,
    aadhaarNumber: false,
    apaarId: false,
    subjects: false,
  });

  const [personalDeclared, setPersonalDeclared] = useState(false);

  // New state for editable form data
  const [editableData, setEditableData] = useState<EditableFormData>({
    fullName: "",
    fatherMotherName: "",
    gender: "",
    nationality: "",
    belongsToEWS: "",
    aadhaarNumber: "",
    apaarId: "",
    residentialAddress: "",
    residentialCountry: "",
    residentialState: "",
    residentialDistrict: "",
    residentialCity: "",
    residentialPinCode: "",
    residentialPoliceStation: "",
    residentialPostOffice: "",
    mailingAddress: "",
    mailingCountry: "",
    mailingState: "",
    mailingDistrict: "",
    mailingCity: "",
    mailingPinCode: "",
    mailingPoliceStation: "",
    mailingPostOffice: "",
  });

  // Correction request status
  const [correctionRequestStatus, setCorrectionRequestStatus] = useState<CorrectionRequestStatus | null>(null);

  // Debug: Track correction request status changes
  React.useEffect(() => {
    console.info("[CU-REG MAIN-CONSOLE] correctionRequestStatus changed to:", correctionRequestStatus);
  }, [correctionRequestStatus]);

  // File upload states for each document (like student console - store files, upload on declaration)
  const [documents, setDocuments] = useState<Record<string, File | null>>({});

  // API data states
  const [countries, setCountries] = useState<Array<{ id?: number; name: string }>>([]);
  const [nationalities, setNationalities] = useState<Array<{ id?: number; name: string }>>([]);

  // Residential address data states
  const [residentialStates, setResidentialStates] = useState<Array<{ id?: number; name: string }>>([]);
  const [residentialCities, setResidentialCities] = useState<Array<{ id?: number; name: string }>>([]);
  const [residentialDistricts, setResidentialDistricts] = useState<Array<{ id?: number; name: string }>>([]);

  // Mailing address data states
  const [mailingStates, setMailingStates] = useState<Array<{ id?: number; name: string }>>([]);
  const [mailingCities, setMailingCities] = useState<Array<{ id?: number; name: string }>>([]);
  const [mailingDistricts, setMailingDistricts] = useState<Array<{ id?: number; name: string }>>([]);

  const [addressDeclared, setAddressDeclared] = useState(false);
  const [subjectsDeclared, setSubjectsDeclared] = useState(false);
  const [documentsConfirmed, setDocumentsConfirmed] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);
  const [isSavingDocuments, setIsSavingDocuments] = useState(false);

  // Check if all declarations are completed
  const allDeclarationsCompleted = personalDeclared && addressDeclared && subjectsDeclared && documentsConfirmed;

  const [subjectsData, setSubjectsData] = useState({
    DSCC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    Minor: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    IDC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    SEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    AEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    CVAC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
  });
  const [mandatorySubjects, setMandatorySubjects] = useState({
    DSCC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    Minor: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    IDC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    SEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    AEC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
    CVAC: { sem1: [] as string[], sem2: [] as string[], sem3: [] as string[], sem4: [] as string[] },
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<Array<Record<string, unknown>>>([]);
  const [docPreviewUrls, setDocPreviewUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  // Helper: format Aadhaar number to 4-4-4 format
  const formatAadhaarNumber = (aadhaar: string) => {
    if (!aadhaar || aadhaar === "XXXX XXXX XXXX") return aadhaar;
    const digits = aadhaar.replace(/\D/g, "");
    if (digits.length === 12) {
      return digits.replace(/^(\d{4})(\d{4})(\d{4})$/, "$1-$2-$3");
    }
    return aadhaar;
  };

  // Helper: format APAAR ID to 3-3-3-3 format
  const formatApaarId = (apaarId: string) => {
    if (!apaarId || apaarId === "Not provided") return apaarId;
    const digits = apaarId.replace(/\D/g, "");
    if (digits.length === 12) {
      return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1-$2-$3-$4");
    }
    return apaarId;
  };

  // Helper: validate and format Aadhaar number input (only 12 digits, 4-4-4 format)
  const handleAadhaarInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Only allow up to 12 digits
    const limitedDigits = digits.slice(0, 12);

    // Format as 4-4-4
    if (limitedDigits.length <= 4) {
      return limitedDigits;
    } else if (limitedDigits.length <= 8) {
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4)}`;
    } else {
      return `${limitedDigits.slice(0, 4)}-${limitedDigits.slice(4, 8)}-${limitedDigits.slice(8)}`;
    }
  };

  // Helper: validate and format APAAR ID input (only 12 digits, 3-3-3-3 format)
  const handleApaarIdInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Only allow up to 12 digits
    const limitedDigits = digits.slice(0, 12);

    // Format as 3-3-3-3
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    } else if (limitedDigits.length <= 9) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9)}`;
    }
  };

  // Dropdown options using database enums
  const genderOptions = genderTypeEnum.enumValues.map((value) => ({
    value,
    label: value.charAt(0) + value.slice(1).toLowerCase(),
  }));

  const ewsOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  const correctionStatusOptions = cuRegistrationCorrectionRequestStatusEnum.enumValues.map((value) => ({
    value,
    label: value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  // Document types for file uploads - fetched from API
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: string; name: string; code: string }>>([]);

  // File size limits based on PDF document (Annexure 9)
  const getFileSizeLimit = (documentName: string): { maxSizeKB: number; maxSizeMB: number } => {
    const name = documentName.toLowerCase();

    if (name.includes("photo") || name.includes("signature")) {
      return { maxSizeKB: 100, maxSizeMB: 0.1 }; // 100KB
    } else {
      return { maxSizeKB: 250, maxSizeMB: 0.25 }; // 250KB for all other documents
    }
  };

  // Helper functions for form handling
  const handleInputChange = (field: keyof EditableFormData, value: string) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatusChange = async (status: string) => {
    if (correctionRequestStatus) {
      try {
        console.info("[CU-REG MAIN-CONSOLE] Updating correction request status to:", status);

        // Call the backend API to update the status
        await axiosInstance.put(`/api/admissions/cu-registration-correction-requests/${correctionRequestStatus.id}`, {
          status: status,
        });

        // Update local state only after successful API call
        setCorrectionRequestStatus((prev) => (prev ? { ...prev, status } : null));
        toast.success("Correction request status updated successfully!");
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error updating status:", error);
        toast.error("Failed to update correction request status");
      }
    }
  };

  // Declaration handlers following student-console pattern
  const handlePersonalInfoDeclarationChange = async (checked: boolean) => {
    console.info("[CU-REG MAIN-CONSOLE] Personal info declaration clicked", { checked });

    if (checked) {
      setIsSavingPersonal(true);
      try {
        console.info("[CU-REG MAIN-CONSOLE] Saving personal info data...");
        toast.info("Saving personal information and regenerating PDF...");

        // Prepare the data to save
        const personalInfoData = {
          gender: editableData.gender,
          nationality: editableData.nationality,
          aadhaarNumber: editableData.aadhaarNumber,
          apaarId: editableData.apaarId,
          ews: editableData.belongsToEWS,
        };

        // Call the backend API to save personal info
        await axiosInstance.post(
          `/api/admissions/cu-registration-correction-requests/${correctionRequestStatus?.id}/personal-info`,
          {
            personalInfo: personalInfoData,
            flags: {
              gender: correctionFlags.gender,
              nationality: correctionFlags.nationality,
              aadhaarNumber: correctionFlags.aadhaarNumber,
              apaarId: correctionFlags.apaarId,
            },
          },
        );

        setPersonalDeclared(true);
        toast.success("Personal information saved successfully!");

        // Refresh correction request status to get updated status from backend
        if (correctionRequestStatus?.id) {
          try {
            const updatedRequest = await getCuCorrectionRequestById(correctionRequestStatus.id);
            setCorrectionRequestStatus({
              id: updatedRequest.id || correctionRequestStatus.id,
              status: updatedRequest.status || "PENDING",
              remarks: updatedRequest.remarks || undefined,
              applicationNumber: updatedRequest.cuRegistrationApplicationNumber || undefined,
            });
            console.info(
              "[CU-REG MAIN-CONSOLE] Refreshed correction request status after personal info update:",
              updatedRequest.status,
            );
          } catch (error) {
            console.error("[CU-REG MAIN-CONSOLE] Error refreshing correction request status:", error);
          }
        }
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error saving personal info:", error);
        toast.error("Failed to save personal information");
      } finally {
        setIsSavingPersonal(false);
      }
    }
  };

  const handleAddressInfoDeclarationChange = async (checked: boolean) => {
    console.info("[CU-REG MAIN-CONSOLE] Address info declaration clicked", { checked });

    if (checked) {
      setIsSavingAddress(true);
      try {
        console.info("[CU-REG MAIN-CONSOLE] Saving address info data...");
        toast.info("Saving address information and regenerating PDF...");

        // Prepare the address data to save
        const addressData = {
          residential: {
            address: editableData.residentialAddress,
            country: editableData.residentialCountry,
            state: editableData.residentialState,
            district: editableData.residentialDistrict,
            city: editableData.residentialCity,
            pincode: editableData.residentialPinCode,
            policeStation: editableData.residentialPoliceStation,
            postOffice: editableData.residentialPostOffice,
          },
          mailing: {
            address: editableData.mailingAddress,
            country: editableData.mailingCountry,
            state: editableData.mailingState,
            district: editableData.mailingDistrict,
            city: editableData.mailingCity,
            pincode: editableData.mailingPinCode,
            policeStation: editableData.mailingPoliceStation,
            postOffice: editableData.mailingPostOffice,
          },
        };

        console.info("[CU-REG MAIN-CONSOLE] Address data to save:", addressData);

        // Use the same pattern as student-console: call updateCuCorrectionRequest directly
        const updateData = {
          flags: {}, // Address doesn't have specific correction flags
          payload: {
            addressData: {
              residential: {
                cityId: residentialCities.find((c) => c.id?.toString() === editableData.residentialCity)?.id,
                districtId: residentialDistricts.find((d) => d.id?.toString() === editableData.residentialDistrict)?.id,
                postofficeId: null,
                otherPostoffice: editableData.residentialPostOffice,
                policeStationId: null,
                otherPoliceStation: editableData.residentialPoliceStation,
                addressLine: editableData.residentialAddress,
                pincode: editableData.residentialPinCode,
                city: residentialCities.find((c) => c.id?.toString() === editableData.residentialCity)?.name || "",
                district:
                  residentialDistricts.find((d) => d.id?.toString() === editableData.residentialDistrict)?.name || "",
                state: residentialStates.find((s) => s.id?.toString() === editableData.residentialState)?.name || "",
                country: countries.find((c) => c.id?.toString() === editableData.residentialCountry)?.name || "",
              },
              mailing: {
                cityId: mailingCities.find((c) => c.id?.toString() === editableData.mailingCity)?.id,
                districtId: mailingDistricts.find((d) => d.id?.toString() === editableData.mailingDistrict)?.id,
                postofficeId: null,
                otherPostoffice: editableData.mailingPostOffice,
                policeStationId: null,
                otherPoliceStation: editableData.mailingPoliceStation,
                addressLine: editableData.mailingAddress,
                pincode: editableData.mailingPinCode,
                city: mailingCities.find((c) => c.id?.toString() === editableData.mailingCity)?.name || "",
                district: mailingDistricts.find((d) => d.id?.toString() === editableData.mailingDistrict)?.name || "",
                state: mailingStates.find((s) => s.id?.toString() === editableData.mailingState)?.name || "",
                country: countries.find((c) => c.id?.toString() === editableData.mailingCountry)?.name || "",
              },
            },
          },
          addressInfoDeclaration: true,
        };

        console.info("[CU-REG MAIN-CONSOLE] Sending address update data:", updateData);

        // Call the main update endpoint like student-console does
        const response = await axiosInstance.put(
          `/api/admissions/cu-registration-correction-requests/${correctionRequestStatus?.id}`,
          updateData,
        );

        console.info("[CU-REG MAIN-CONSOLE] Address save response:", response.data);
        setAddressDeclared(true);
        toast.success("Address information saved successfully!");

        // Refresh correction request status to get updated status from backend
        if (correctionRequestStatus?.id) {
          try {
            const updatedRequest = await getCuCorrectionRequestById(correctionRequestStatus.id);
            setCorrectionRequestStatus({
              id: updatedRequest.id || correctionRequestStatus.id,
              status: updatedRequest.status || "PENDING",
              remarks: updatedRequest.remarks || undefined,
              applicationNumber: updatedRequest.cuRegistrationApplicationNumber || undefined,
            });
            console.info(
              "[CU-REG MAIN-CONSOLE] Refreshed correction request status after address info update:",
              updatedRequest.status,
            );
          } catch (error) {
            console.error("[CU-REG MAIN-CONSOLE] Error refreshing correction request status:", error);
          }
        }
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error saving address info:", error);
        toast.error("Failed to save address information");
      } finally {
        setIsSavingAddress(false);
      }
    }
  };

  const handleSubjectsDeclarationChange = async (checked: boolean) => {
    console.info("[CU-REG MAIN-CONSOLE] Subjects declaration clicked", { checked });

    if (checked) {
      setIsSavingSubjects(true);
      try {
        console.info("[CU-REG MAIN-CONSOLE] Saving subjects declaration...");
        toast.info("Saving subjects declaration...");

        // Check if we have a valid correction request ID
        if (!correctionRequestStatus?.id) {
          console.error("[CU-REG MAIN-CONSOLE] Missing Correction Request ID:", {
            correctionRequestStatus: correctionRequestStatus,
            correctionRequestId: correctionRequestStatus?.id,
          });
          throw new Error("Correction request ID not found. Please ensure the correction request is properly loaded.");
        }

        console.info(`[CU-REG MAIN-CONSOLE] Using correction request ID: ${correctionRequestStatus.id}`);

        // Update correction request with subjects declaration
        const updateData = {
          subjectsDeclaration: true,
          subjectsCorrectionRequest: correctionFlags.subjects,
        };

        console.info("[CU-REG MAIN-CONSOLE] Sending subjects declaration update:", updateData);

        // Call the backend API to save subjects declaration
        await axiosInstance.put(
          `/api/admissions/cu-registration-correction-requests/${correctionRequestStatus.id}`,
          updateData,
        );

        setSubjectsDeclared(true);
        toast.success("Subjects declaration saved successfully!");

        // Refresh correction request status to get updated status from backend
        if (correctionRequestStatus?.id) {
          try {
            const updatedRequest = await getCuCorrectionRequestById(correctionRequestStatus.id);
            setCorrectionRequestStatus({
              id: updatedRequest.id || correctionRequestStatus.id,
              status: updatedRequest.status || "PENDING",
              remarks: updatedRequest.remarks || undefined,
              applicationNumber: updatedRequest.cuRegistrationApplicationNumber || undefined,
            });
            console.info(
              "[CU-REG MAIN-CONSOLE] Refreshed correction request status after subjects declaration:",
              updatedRequest.status,
            );
          } catch (error) {
            console.error("[CU-REG MAIN-CONSOLE] Error refreshing correction request status:", error);
          }
        }
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error saving subjects declaration:", error);
        toast.error("Failed to save subjects declaration");
      } finally {
        setIsSavingSubjects(false);
      }
    }
  };

  const handleDocumentsDeclarationChange = async (checked: boolean) => {
    console.info("[CU-REG MAIN-CONSOLE] Documents declaration clicked", { checked });
    console.info("[CU-REG MAIN-CONSOLE] Current documents state:", documents);
    console.info("[CU-REG MAIN-CONSOLE] Current correctionRequestStatus:", correctionRequestStatus);

    if (checked) {
      setIsSavingDocuments(true);
      try {
        console.info("[CU-REG MAIN-CONSOLE] Saving documents declaration and uploading files...");
        toast.info("Saving documents declaration and uploading files...");

        // Check if we have a valid correction request ID
        if (!correctionRequestStatus?.id) {
          console.error("[CU-REG MAIN-CONSOLE] Missing Correction Request ID:", {
            correctionRequestStatus: correctionRequestStatus,
            correctionRequestId: correctionRequestStatus?.id,
          });
          throw new Error("Correction request ID not found. Please ensure the correction request is properly loaded.");
        }

        console.info(`[CU-REG MAIN-CONSOLE] Using correction request ID: ${correctionRequestStatus.id}`);

        // Get student data for upload
        const studentUid = studentData?.uid || "";

        if (!studentUid) {
          console.error("[CU-REG MAIN-CONSOLE] Missing Student UID for upload");
          throw new Error("Student UID not found. Cannot upload files.");
        }

        // Upload all selected files (like student console)
        console.info(`[CU-REG MAIN-CONSOLE] Documents state:`, documents);

        // Check if any files are selected for upload
        const filesToUpload = Object.entries(documents).filter(([, file]) => file);
        console.info(`[CU-REG MAIN-CONSOLE] Files to upload: ${filesToUpload.length}`);

        let uploadSuccessCount = 0;
        let uploadErrorCount = 0;

        // Warn user if no files are selected but they're trying to declare documents
        if (filesToUpload.length === 0) {
          console.info(`[CU-REG MAIN-CONSOLE] No files selected for upload - proceeding with declaration only`);
        }

        if (filesToUpload.length > 0) {
          console.info(`[CU-REG MAIN-CONSOLE] Starting upload process for ${filesToUpload.length} files`);
          const uploadPromises = filesToUpload.map(async ([documentKey, file]) => {
            if (file) {
              // Extract document ID from key (format: "document-{id}")
              const documentId = parseInt(documentKey.replace("document-", ""));
              console.info(`[CU-REG MAIN-CONSOLE] Uploading file for document ID ${documentId}:`, {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              });
              try {
                console.info(`[CU-REG MAIN-CONSOLE] Calling uploadCuRegistrationDocument API...`);
                await uploadCuRegistrationDocument({
                  file,
                  cuRegistrationCorrectionRequestId: correctionRequestStatus.id,
                  documentId,
                });
                console.info(`[CU-REG MAIN-CONSOLE] File uploaded successfully for document ID ${documentId}`);
                uploadSuccessCount++;
              } catch (error) {
                console.error(`[CU-REG MAIN-CONSOLE] Error uploading file for document ID ${documentId}:`, error);
                uploadErrorCount++;
                throw error;
              }
            }
          });

          console.info(`[CU-REG MAIN-CONSOLE] Waiting for all uploads to complete...`);
          await Promise.all(uploadPromises);
          console.info(
            `[CU-REG MAIN-CONSOLE] All uploads completed. Success: ${uploadSuccessCount}, Errors: ${uploadErrorCount}`,
          );
        } else {
          console.info(`[CU-REG MAIN-CONSOLE] No files selected for upload`);
        }

        // Update correction request with documents declaration
        const updateData = {
          documentsDeclaration: true,
        };

        console.info("[CU-REG MAIN-CONSOLE] Updating correction request with documents declaration:", updateData);

        await axiosInstance.put(
          `/api/admissions/cu-registration-correction-requests/${correctionRequestStatus?.id}`,
          updateData,
        );

        // Refresh the uploaded documents list
        try {
          const documents = await getCuRegistrationDocuments(correctionRequestStatus.id);
          setUploadedDocuments(documents);
          console.info("[CU-REG MAIN-CONSOLE] Refreshed uploaded documents:", documents);

          // Force refresh of image previews by clearing any cached URLs
          setDocPreviewUrls({});
        } catch (error) {
          console.error("[CU-REG MAIN-CONSOLE] Error refreshing documents:", error);
        }

        // Reset file inputs AFTER upload is complete
        setDocuments({});

        setDocumentsConfirmed(true);

        // Show appropriate success message based on upload results
        if (filesToUpload.length === 0) {
          toast.success("Documents declaration saved successfully! (No files to upload)");
        } else if (uploadSuccessCount > 0 && uploadErrorCount === 0) {
          toast.success(`Documents declaration saved and ${uploadSuccessCount} file(s) uploaded successfully!`);
        } else if (uploadSuccessCount > 0 && uploadErrorCount > 0) {
          toast.warning(
            `Documents declaration saved. ${uploadSuccessCount} file(s) uploaded, ${uploadErrorCount} failed.`,
          );
        } else {
          toast.error("Documents declaration saved but file uploads failed!");
        }

        // Refresh correction request status to get updated status from backend
        if (correctionRequestStatus?.id) {
          try {
            const updatedRequest = await getCuCorrectionRequestById(correctionRequestStatus.id);
            setCorrectionRequestStatus({
              id: updatedRequest.id || correctionRequestStatus.id,
              status: updatedRequest.status || "PENDING",
              remarks: updatedRequest.remarks || undefined,
              applicationNumber: updatedRequest.cuRegistrationApplicationNumber || undefined,
            });
            console.info(
              "[CU-REG MAIN-CONSOLE] Refreshed correction request status after documents update:",
              updatedRequest.status,
            );
          } catch (error) {
            console.error("[CU-REG MAIN-CONSOLE] Error refreshing correction request status:", error);
          }
        }
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error saving documents declaration:", error);
        toast.error("Failed to save documents declaration and upload files");
      } finally {
        setIsSavingDocuments(false);
      }
    }
  };

  // Fetch document types from API
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        console.info("[CU-REG MAIN-CONSOLE] Fetching document types from API...");
        const response = await axiosInstance.get("/api/documents");
        const documents = response.data.payload || [];

        // Transform the API response to match our expected format
        const transformedDocuments = documents.map((doc: { id: number; name: string }) => {
          // Generate appropriate code based on document name
          let code = "";
          const name = doc.name.toLowerCase();

          if (name.includes("marksheet")) {
            code = "M";
          } else if (name.includes("aadhaar")) {
            code = "AD";
          } else if (name.includes("apaar")) {
            code = "ABC";
          } else if (name.includes("father") && name.includes("photo")) {
            code = "FP";
          } else if (name.includes("mother") && name.includes("photo")) {
            code = "MP";
          } else if (name.includes("ews")) {
            code = "EWS";
          } else {
            // Fallback to first letter
            code = doc.name.charAt(0).toUpperCase();
          }

          return {
            id: doc.id.toString(),
            name: doc.name,
            code: code,
          };
        });

        console.info("[CU-REG MAIN-CONSOLE] Fetched document types:", transformedDocuments);
        setDocumentTypes(transformedDocuments);
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error fetching document types:", error);
        // Fallback to hardcoded types if API fails
        setDocumentTypes([
          { id: "1", name: "Class XII Marksheet", code: "M" },
          { id: "2", name: "Aadhaar Card", code: "A" },
          { id: "3", name: "APAAR ID Card", code: "ABC" },
          { id: "4", name: "Father Photo ID", code: "FP" },
          { id: "5", name: "Mother Photo ID", code: "MP" },
          { id: "6", name: "EWS Certificate", code: "EWS" },
        ]);
      }
    };

    fetchDocumentTypes();
  }, []);

  // Fetch API data for dropdowns
  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const [countriesData, nationalitiesData] = await Promise.all([getActiveCountries(), getAllNationalities()]);
        setCountries(countriesData);
        setNationalities(nationalitiesData);
      } catch (error) {
        console.error("Error fetching API data:", error);
      }
    };
    fetchApiData();
  }, []);

  // Fetch states when country changes
  const handleCountryChange = async (countryId: string, type: "residential" | "mailing") => {
    try {
      const statesData = await getStatesByCountry(parseInt(countryId));

      if (type === "residential") {
        setResidentialStates(statesData);
        // Clear residential cities and districts when country changes
        setResidentialCities([]);
        setResidentialDistricts([]);
      } else {
        setMailingStates(statesData);
        // Clear mailing cities and districts when country changes
        setMailingCities([]);
        setMailingDistricts([]);
      }

      // Update the form data
      const fieldName = type === "residential" ? "residentialCountry" : "mailingCountry";
      handleInputChange(fieldName, countryId);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  // Fetch cities when state changes
  const handleStateChange = async (stateId: string, type: "residential" | "mailing") => {
    try {
      const citiesData = await getCitiesByState(parseInt(stateId));

      if (type === "residential") {
        setResidentialCities(citiesData);
        // Clear residential districts when state changes
        setResidentialDistricts([]);
      } else {
        setMailingCities(citiesData);
        // Clear mailing districts when state changes
        setMailingDistricts([]);
      }

      // Update the form data
      const fieldName = type === "residential" ? "residentialState" : "mailingState";
      handleInputChange(fieldName, stateId);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  // Fetch districts when city changes
  const handleCityChange = async (cityId: string, type: "residential" | "mailing") => {
    try {
      const districtsData = await getDistrictsByState(parseInt(cityId));

      if (type === "residential") {
        setResidentialDistricts(districtsData);
      } else {
        setMailingDistricts(districtsData);
      }

      // Update the form data
      const fieldName = type === "residential" ? "residentialCity" : "mailingCity";
      handleInputChange(fieldName, cityId);
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  // Fetch correction request and populate data
  useEffect(() => {
    const fetchData = async () => {
      if (!studentId || !studentData) return;

      try {
        setLoading(true);
        console.info(`[CU-REG MAIN-CONSOLE] Fetching data for student: ${studentId}`);

        // Fetch profile info using userId (like student-console does)
        let profileInfo: ProfileInfo | null = null;
        if (studentData.userId) {
          try {
            profileInfo = await fetchUserProfile(studentData.userId);
            console.info(`[CU-REG MAIN-CONSOLE] Profile info fetched:`, profileInfo);
          } catch (error) {
            console.error(`[CU-REG MAIN-CONSOLE] Error fetching profile:`, error);
          }
        }

        // Fetch correction request
        const requests = await getStudentCuCorrectionRequests(studentId);
        const existingRequest = requests?.[0] || null;

        if (existingRequest) {
          console.info(`[CU-REG MAIN-CONSOLE] Found correction request:`, existingRequest);

          // Update correction flags
          setCorrectionFlags({
            gender: existingRequest.genderCorrectionRequest ?? false,
            nationality: existingRequest.nationalityCorrectionRequest ?? false,
            aadhaarNumber: existingRequest.aadhaarCardNumberCorrectionRequest ?? false,
            apaarId: existingRequest.apaarIdCorrectionRequest ?? false,
            subjects: existingRequest.subjectsCorrectionRequest ?? false,
          });

          // Update declaration states
          setPersonalDeclared(!!existingRequest.personalInfoDeclaration);
          setAddressDeclared(!!existingRequest.addressInfoDeclaration);
          setSubjectsDeclared(!!existingRequest.subjectsDeclaration);
          setDocumentsConfirmed(!!existingRequest.documentsDeclaration);

          // Set correction request status - load existing status from database
          if (existingRequest.id) {
            const existingStatus = existingRequest.status || "";
            console.info(`[CU-REG MAIN-CONSOLE] Found correction request ID:`, existingRequest.id);
            console.info(`[CU-REG MAIN-CONSOLE] Loading existing status:`, existingStatus);
            setCorrectionRequestStatus({
              id: existingRequest.id,
              status: existingStatus, // Load existing status from database
              remarks: existingRequest.remarks || undefined,
              applicationNumber: (existingRequest as unknown as Record<string, unknown>).applicationNumber as
                | string
                | undefined,
            });
          }

          // Fetch documents - try both methods
          let docs: Array<Record<string, unknown>> = [];

          // First try: fetch by correction request ID
          if (existingRequest.id) {
            try {
              docs = await getCuRegistrationDocuments(existingRequest.id);
              console.info(`[CU-REG MAIN-CONSOLE] Loaded ${docs?.length || 0} documents from correction request`);
            } catch (docError) {
              console.error(`[CU-REG MAIN-CONSOLE] Error fetching documents by correction request:`, docError);
            }
          }

          // Second try: fetch by student UID if no documents found
          if (docs.length === 0 && studentData?.uid) {
            try {
              docs = await getCuRegistrationDocumentsByStudentUid(studentData.uid);
              console.info(`[CU-REG MAIN-CONSOLE] Loaded ${docs?.length || 0} documents from student UID`);
            } catch (docError) {
              console.error(`[CU-REG MAIN-CONSOLE] Error fetching documents by student UID:`, docError);
            }
          }

          // Third try: if still no documents, try without any filters
          if (docs.length === 0 && studentData?.uid) {
            try {
              console.info(`[CU-REG MAIN-CONSOLE] Trying to fetch all documents for student UID: ${studentData.uid}`);
              docs = await getAllStudentDocuments(studentData.uid);
              console.info(`[CU-REG MAIN-CONSOLE] Loaded ${docs?.length || 0} documents from all types`);
            } catch (docError) {
              console.error(`[CU-REG MAIN-CONSOLE] Error fetching all documents:`, docError);
            }
          }

          setUploadedDocuments(docs || []);
          console.info(`[CU-REG MAIN-CONSOLE] Total documents loaded: ${docs?.length || 0}`);
          console.info(`[CU-REG MAIN-CONSOLE] Documents data:`, docs);
        }

        // Populate personal info from profile data (like student-console does)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const personalDetails = profileInfo?.personalDetails as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const familyDetails = profileInfo?.familyDetails as any;

        console.info(`[CU-REG MAIN-CONSOLE] personalDetails from profile:`, personalDetails);
        console.info(`[CU-REG MAIN-CONSOLE] familyDetails from profile:`, familyDetails);

        if (personalDetails || studentData) {
          setEditableData((prev) => ({
            ...prev,
            fullName:
              studentData?.name && studentData.name.trim().length > 0
                ? studentData.name
                : `${personalDetails?.firstName || ""} ${personalDetails?.middleName || ""} ${personalDetails?.lastName || ""}`.trim(),
            fatherMotherName:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              familyDetails?.members?.find((m: any) => m.type === "FATHER")?.name ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              familyDetails?.members?.find((m: any) => m.type === "MOTHER")?.name ||
              familyDetails?.father?.name ||
              familyDetails?.mother?.name ||
              "",
            gender: personalDetails?.gender || "",
            nationality: String(personalDetails?.nationality?.id || ""),
            aadhaarNumber: formatAadhaarNumber(personalDetails?.aadhaarCardNumber || "XXXX XXXX XXXX"),
            apaarId: formatApaarId((studentData?.apaarId && studentData.apaarId.trim()) || ""),
            belongsToEWS: studentData?.belongsToEWS ? "Yes" : "No",
          }));
        }

        // Populate address data
        const addresses = (personalDetails?.address as Array<Record<string, unknown>>) || [];
        const resAddr = addresses.find((a) => a?.type === "RESIDENTIAL") || addresses[0] || null;
        const mailAddr = addresses.find((a) => a?.type === "MAILING") || addresses[1] || resAddr || null;

        console.info("[CU-REG MAIN-CONSOLE] Address data structure:", { resAddr, mailAddr });

        const getAddressField = (addr: Record<string, unknown> | null, field: string): string => {
          if (!addr) return "";
          return (addr[field] as string) || "";
        };

        const getNestedField = (addr: Record<string, unknown> | null, parent: string, field: string): string => {
          if (!addr) return "";
          const parentObj = addr[parent] as Record<string, unknown> | undefined;
          return (parentObj?.[field] as string) || "";
        };

        if (resAddr || mailAddr) {
          // Debug the extracted values
          const resCountryId = getNestedField(resAddr, "country", "id");
          const resStateId = getNestedField(resAddr, "state", "id");
          const resCityId = getNestedField(resAddr, "city", "id");
          const resDistrictId = getNestedField(resAddr, "district", "id");

          const mailCountryId = getNestedField(mailAddr, "country", "id");
          const mailStateId = getNestedField(mailAddr, "state", "id");
          const mailCityId = getNestedField(mailAddr, "city", "id");
          const mailDistrictId = getNestedField(mailAddr, "district", "id");

          console.info("[CU-REG MAIN-CONSOLE] Extracted IDs:", {
            resCountryId,
            resStateId,
            resCityId,
            resDistrictId,
            mailCountryId,
            mailStateId,
            mailCityId,
            mailDistrictId,
          });

          const newData = {
            residentialAddress:
              getAddressField(resAddr, "addressLine") ||
              getAddressField(resAddr, "address") ||
              getAddressField(mailAddr, "addressLine") ||
              getAddressField(mailAddr, "address"),
            residentialCity: String(resCityId || mailCityId || ""),
            residentialDistrict: String(resDistrictId || mailDistrictId || ""),
            residentialPoliceStation:
              getAddressField(resAddr, "otherPoliceStation") ||
              getNestedField(resAddr, "policeStation", "name") ||
              getAddressField(mailAddr, "otherPoliceStation") ||
              getNestedField(mailAddr, "policeStation", "name"),
            residentialPostOffice:
              getAddressField(resAddr, "otherPostoffice") ||
              getNestedField(resAddr, "postoffice", "name") ||
              getAddressField(mailAddr, "otherPostoffice") ||
              getNestedField(mailAddr, "postoffice", "name"),
            residentialState: String(resStateId || mailStateId || ""),
            residentialCountry: String(resCountryId || mailCountryId || ""),
            residentialPinCode: getAddressField(resAddr, "pincode") || getAddressField(mailAddr, "pincode"),
            mailingAddress:
              getAddressField(mailAddr, "addressLine") ||
              getAddressField(mailAddr, "address") ||
              getAddressField(resAddr, "addressLine") ||
              getAddressField(resAddr, "address"),
            mailingCity: String(mailCityId || resCityId || ""),
            mailingDistrict: String(mailDistrictId || resDistrictId || ""),
            mailingPoliceStation:
              getAddressField(mailAddr, "otherPoliceStation") ||
              getNestedField(mailAddr, "policeStation", "name") ||
              getAddressField(resAddr, "otherPoliceStation") ||
              getNestedField(resAddr, "policeStation", "name"),
            mailingPostOffice:
              getAddressField(mailAddr, "otherPostoffice") ||
              getNestedField(mailAddr, "postoffice", "name") ||
              getAddressField(resAddr, "otherPostoffice") ||
              getNestedField(resAddr, "postoffice", "name"),
            mailingState: String(mailStateId || resStateId || ""),
            mailingCountry: String(mailCountryId || resCountryId || ""),
            mailingPinCode: getAddressField(mailAddr, "pincode") || getAddressField(resAddr, "pincode"),
          };

          console.info("[CU-REG MAIN-CONSOLE] Setting address data:", {
            residentialCountry: newData.residentialCountry,
            residentialState: newData.residentialState,
            residentialCity: newData.residentialCity,
            residentialDistrict: newData.residentialDistrict,
            mailingCountry: newData.mailingCountry,
            mailingState: newData.mailingState,
            mailingCity: newData.mailingCity,
            mailingDistrict: newData.mailingDistrict,
          });

          setEditableData((prev) => ({ ...prev, ...newData }));

          // Load states for both residential and mailing addresses
          const loadAddressData = async () => {
            try {
              // Load states for residential address
              if (resCountryId) {
                console.info("[CU-REG MAIN-CONSOLE] Loading states for residential country:", resCountryId);
                const resStatesData = await getStatesByCountry(parseInt(resCountryId));
                setResidentialStates(resStatesData);
                console.info("[CU-REG MAIN-CONSOLE] Loaded residential states:", resStatesData);

                // Load cities for residential state
                if (resStateId) {
                  console.info("[CU-REG MAIN-CONSOLE] Loading cities for residential state:", resStateId);
                  const resCitiesData = await getCitiesByState(parseInt(resStateId));
                  setResidentialCities(resCitiesData);
                  console.info("[CU-REG MAIN-CONSOLE] Loaded residential cities:", resCitiesData);

                  // Load districts for residential state
                  try {
                    const resDistrictsData = await getDistrictsByState(parseInt(resStateId));
                    setResidentialDistricts(resDistrictsData);
                    console.info("[CU-REG MAIN-CONSOLE] Loaded residential districts:", resDistrictsData);
                  } catch (error) {
                    console.error("[CU-REG MAIN-CONSOLE] Error loading residential districts:", error);
                  }
                }
              }

              // Load states for mailing address
              if (mailCountryId) {
                console.info("[CU-REG MAIN-CONSOLE] Loading states for mailing country:", mailCountryId);
                const mailStatesData = await getStatesByCountry(parseInt(mailCountryId));
                setMailingStates(mailStatesData);
                console.info("[CU-REG MAIN-CONSOLE] Loaded mailing states:", mailStatesData);

                // Load cities for mailing state
                if (mailStateId) {
                  console.info("[CU-REG MAIN-CONSOLE] Loading cities for mailing state:", mailStateId);
                  const mailCitiesData = await getCitiesByState(parseInt(mailStateId));
                  setMailingCities(mailCitiesData);
                  console.info("[CU-REG MAIN-CONSOLE] Loaded mailing cities:", mailCitiesData);

                  // Load districts for mailing state
                  try {
                    const mailDistrictsData = await getDistrictsByState(parseInt(mailStateId));
                    setMailingDistricts(mailDistrictsData);
                    console.info("[CU-REG MAIN-CONSOLE] Loaded mailing districts:", mailDistrictsData);
                  } catch (error) {
                    console.error("[CU-REG MAIN-CONSOLE] Error loading mailing districts:", error);
                  }
                }
              }
            } catch (error) {
              console.error("[CU-REG MAIN-CONSOLE] Error loading address data:", error);
            }
          };

          loadAddressData();
        }

        // Fetch subject selections and mandatory subjects
        if (studentId) {
          try {
            const [studentRows, mandatoryRows] = await Promise.all([
              fetchStudentSubjectSelections(studentId).catch(() => ({
                studentSubjectsSelection: [],
                selectedMinorSubjects: [],
                actualStudentSelections: [],
                subjectSelectionMetas: [],
                hasFormSubmissions: false,
                session: { id: 1 },
              })),
              fetchMandatorySubjects(studentId).catch(() => []),
            ]);

            console.info(`[CU-REG MAIN-CONSOLE] Student selections:`, studentRows);
            console.info(`[CU-REG MAIN-CONSOLE] Mandatory subjects:`, mandatoryRows);
            console.info(`[CU-REG MAIN-CONSOLE] Uploaded documents:`, uploadedDocuments);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const next: any = { ...subjectsData };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mandatoryNext: any = { ...mandatorySubjects };

            // isBcomProgram is now defined at component level

            const getCategoryKey = (label: string): string | undefined => {
              if (/Discipline Specific Core Courses/i.test(label) || /DSCC/i.test(label)) return "DSCC";
              if (/Minor/i.test(label)) return "Minor";

              // For BCOM students, show MDC instead of IDC
              if (isBcomProgram) {
                if (
                  /Major Discipline Course/i.test(label) ||
                  /Multi Disciplinary Course/i.test(label) ||
                  /MDC/i.test(label)
                ) {
                  return "IDC"; // Map MDC to IDC slot for BCOM
                }
                if (/Interdisciplinary Course/i.test(label) || /IDC/i.test(label)) {
                  return undefined; // Hide IDC for BCOM
                }
              } else {
                if (/Interdisciplinary Course/i.test(label) || /IDC/i.test(label)) {
                  return "IDC";
                }
              }

              // SEC subjects are not displayed
              // if (/Skill Enhancement Course/i.test(label) || /SEC/i.test(label)) return "SEC";
              if (/Ability Enhancement Course/i.test(label) || /AEC/i.test(label)) return "AEC";
              if (/Common Value Added Course/i.test(label) || /CVAC/i.test(label)) return "CVAC";
              return undefined;
            };

            const toSemNumsFromClasses = (forClasses?: unknown[]): number[] => {
              if (!Array.isArray(forClasses)) return [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const map: any = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
              const nums: number[] = [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              forClasses.forEach((c: any) => {
                const label = String(c?.name || c?.shortName || c?.class?.name || c?.class?.shortName || "");
                const roman = /\b(I|II|III|IV|V|VI)\b/i.exec(label);
                if (roman && roman[1]) {
                  nums.push(map[roman[1].toUpperCase()]);
                  return;
                }
                const digit = /\b([1-6])\b/.exec(label);
                if (digit && digit[1]) nums.push(Number(digit[1]));
              });
              return Array.from(new Set(nums));
            };

            const toSemNumFromLabel = (label: string) => {
              const m = /\b(I|II|III|IV)\b/i.exec(label || "");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const map: any = { I: 1, II: 2, III: 3, IV: 4 };
              return m && m[1] ? map[m[1].toUpperCase()] : undefined;
            };

            // Process actualStudentSelections (actual form submissions)
            const actualSelections = studentRows?.actualStudentSelections || [];
            console.log("🔍 CU-REG - Processing actualStudentSelections:", actualSelections);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            actualSelections.forEach((r: any) => {
              // Use the correct field names from the actual data structure
              const label = String(r?.metaLabel || r?.subjectSelectionMeta?.label || "");
              const name = r?.subjectName || r?.subject?.name || r?.subject?.code || "";
              console.log("🔍 CU-REG - Processing selection:", { label, name, raw: r });
              if (!label || !name) {
                console.log("🔍 CU-REG - Skipping due to missing label or name");
                return;
              }

              const key = getCategoryKey(label);
              if (!key || !next[key]) return;

              let semesters: number[] = toSemNumsFromClasses(r?.forClasses || r?.subjectSelectionMeta?.forClasses);

              // Category-specific defaults when class span is unavailable
              if (semesters.length === 0 && /Minor\s*1/i.test(label)) semesters = [1, 2];
              if (semesters.length === 0 && /Minor\s*2/i.test(label)) semesters = [3, 4];
              if (semesters.length === 0 && /Minor\s*3/i.test(label)) semesters = [3];
              if (semesters.length === 0 && /IDC\s*1/i.test(label)) semesters = [1];
              if (semesters.length === 0 && /IDC\s*2/i.test(label)) semesters = [2];
              if (semesters.length === 0 && /IDC\s*3/i.test(label)) semesters = [3];
              if (semesters.length === 0 && /AEC/i.test(label)) semesters = [3, 4];
              if (semesters.length === 0 && /CVAC/i.test(label)) semesters = [2];
              if (semesters.length === 0) {
                const n = toSemNumFromLabel(label);
                if (n) semesters = [n];
              }

              semesters.forEach((s) => {
                if (next[key] && next[key][`sem${s}`] !== undefined) {
                  const currentValue = next[key][`sem${s}`];
                  if (!currentValue.includes(name)) {
                    currentValue.push(name);
                  }
                }
              });
            });

            // Process mandatory papers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mandatoryRows.forEach((r: any) => {
              const subjectTypeName = String(r?.subjectType?.name || "");
              const subjectName = String(r?.subject?.name || r?.subject?.code || "");
              const className = String(r?.class?.name || r?.class?.shortName || "");

              if (!subjectTypeName || !subjectName) return;

              const key = getCategoryKey(subjectTypeName);
              if (!key || !mandatoryNext[key]) return;

              // Extract semester from class name
              let semesters: number[] = [];
              const semMatch = className.match(/\b(I|II|III|IV|1|2|3|4)\b/i);
              if (semMatch && semMatch[1]) {
                const sem = semMatch[1].toUpperCase();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const semMap: any = { I: 1, II: 2, III: 3, IV: 4, "1": 1, "2": 2, "3": 3, "4": 4 };
                semesters = [semMap[sem]];
              }

              // If no semester found in class name, infer from subject type
              if (semesters.length === 0) {
                if (/Minor\s*1/i.test(subjectTypeName)) semesters = [1, 2];
                else if (/Minor\s*2/i.test(subjectTypeName)) semesters = [3, 4];
                else if (/Minor\s*3/i.test(subjectTypeName)) semesters = [3];
                else if (/IDC\s*1/i.test(subjectTypeName)) semesters = [1];
                else if (/IDC\s*2/i.test(subjectTypeName)) semesters = [2];
                else if (/IDC\s*3/i.test(subjectTypeName)) semesters = [3];
                else if (/AEC/i.test(subjectTypeName)) semesters = [3, 4];
                else if (/CVAC/i.test(subjectTypeName)) semesters = [2];
                else semesters = [1, 2, 3, 4]; // Default to all semesters
              }

              semesters.forEach((s) => {
                if (mandatoryNext[key] && mandatoryNext[key][`sem${s}`] !== undefined) {
                  const currentSubjects = mandatoryNext[key][`sem${s}`] as string[];
                  if (!currentSubjects.includes(subjectName)) {
                    currentSubjects.push(subjectName);
                  }
                }
              });
            });

            console.info(`[CU-REG MAIN-CONSOLE] Processed subjects data:`, next);
            console.info(`[CU-REG MAIN-CONSOLE] Processed mandatory subjects:`, mandatoryNext);

            setSubjectsData(next);
            setMandatorySubjects(mandatoryNext);
          } catch (error) {
            console.error("[CU-REG MAIN-CONSOLE] Error fetching subjects:", error);
          }
        }
      } catch (error) {
        console.error("[CU-REG MAIN-CONSOLE] Error fetching data:", error);
        toast.error("Failed to load CU registration data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentData]);

  // Resolve preview URLs for documents
  useEffect(() => {
    if (uploadedDocuments.length === 0) return;

    console.info(`[CU-REG MAIN-CONSOLE] Loading preview URLs for ${uploadedDocuments.length} documents`);

    (async () => {
      const promises = (uploadedDocuments || [])
        .filter((d) => {
          const fileType = d?.fileType as string | undefined;
          const id = d?.id as number | undefined;
          return fileType?.startsWith("image/") && typeof id === "number";
        })
        .map(async (d) => {
          const docId = d.id as number;
          if (docPreviewUrls[docId]) {
            console.info(`[CU-REG MAIN-CONSOLE] Preview URL already exists for document ${docId}`);
            return;
          }
          try {
            console.info(`[CU-REG MAIN-CONSOLE] Fetching preview URL for document ${docId}`);
            const url = await getCuRegistrationDocumentSignedUrl(docId);
            if (url && url !== "undefined" && url !== "null") {
              // Add cache-busting parameter to force browser refresh
              const cacheBustedUrl = url + (url.includes("?") ? "&" : "?") + `t=${Date.now()}`;
              console.info(`[CU-REG MAIN-CONSOLE] Got preview URL for document ${docId}:`, cacheBustedUrl);
              setDocPreviewUrls((prev) => ({ ...prev, [docId]: cacheBustedUrl }));
            } else {
              console.error(`[CU-REG MAIN-CONSOLE] Invalid URL received for document ${docId}:`, url);
            }
          } catch (error) {
            console.error(`[CU-REG MAIN-CONSOLE] Error fetching preview URL for document ${docId}:`, error);
          }
        });
      await Promise.allSettled(promises);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedDocuments]);

  // Check if student is in MA or MCOM program (should not show CU registration form)
  const isMaOrMcomProgram = (() => {
    if (!studentData?.programCourse?.name) return false;

    const normalizedName = studentData.programCourse.name
      .normalize("NFKD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase();

    // Check for MA (but not Mathematics - MA should be exactly "MA" or start with "MA" followed by non-letter)
    const isMA =
      normalizedName === "MA" ||
      (normalizedName.startsWith("MA") && normalizedName.length > 2 && !normalizedName.startsWith("MATHEMATICS"));

    // Check for MCOM
    const isMCOM = normalizedName.startsWith("MCOM");

    return isMA || isMCOM;
  })();

  console.log("[CU-REG MAIN-CONSOLE] Program course name:", studentData?.programCourse?.name);
  console.log("[CU-REG MAIN-CONSOLE] Is MA or MCOM program:", isMaOrMcomProgram);
  console.log("[CU-REG MAIN-CONSOLE] Is BCOM program:", isBcomProgram);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading CU registration data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect MA and MCOM students
  if (isMaOrMcomProgram) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">CU Registration Not Available</h2>
              <p className="text-yellow-700">
                CU Registration form is not available for {studentData?.programCourse?.course?.name} students.
                <br />
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-4 sm:py-8">
      <div className="mx-auto px-3 sm:px-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CU Registration</h1>
          <div className="flex items-center space-x-4">
            <Select
              value={
                correctionRequestStatus?.status &&
                cuRegistrationCorrectionRequestStatusEnum.enumValues.includes(
                  correctionRequestStatus.status as (typeof cuRegistrationCorrectionRequestStatusEnum.enumValues)[number],
                )
                  ? correctionRequestStatus.status
                  : ""
              }
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="bg-white text-gray-900 border-gray-300 w-64">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {correctionStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={!allDeclarationsCompleted}
              onClick={async () => {
                try {
                  if (!correctionRequestStatus?.id) {
                    toast.error("No correction request found");
                    return;
                  }

                  console.info(
                    `[CU-REG MAIN-CONSOLE] Opening admission form PDF for correction request: ${correctionRequestStatus.id}`,
                  );
                  toast.info("Loading admission form PDF...");

                  const pdfUrl = await getCuRegistrationPdfUrlByRequestId(correctionRequestStatus.id);

                  if (pdfUrl && pdfUrl !== "undefined" && pdfUrl !== "null") {
                    console.info(`[CU-REG MAIN-CONSOLE] Opening PDF URL:`, pdfUrl);
                    window.open(pdfUrl, "_blank");
                    toast.success("Admission form PDF opened successfully!");
                  } else {
                    console.error(`[CU-REG MAIN-CONSOLE] Invalid PDF URL received:`, pdfUrl);
                    toast.error("Failed to get valid PDF URL");
                  }
                } catch (error: unknown) {
                  console.error(`[CU-REG MAIN-CONSOLE] Error opening admission form PDF:`, error);

                  // Check if it's a 400 error (declarations not completed)
                  if (error && typeof error === "object" && "response" in error && error.response) {
                    const apiError = error as { response: { status?: number } };
                    if (apiError.response.status === 400) {
                      toast.error("Please complete all required declarations before viewing the PDF");
                    } else {
                      toast.error("Failed to open admission form PDF");
                    }
                  } else {
                    toast.error("Failed to open admission form PDF");
                  }
                }
              }}
            >
              View Adm Form
            </Button>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg border border-gray-200 bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-white">
                <div className="flex w-full overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === "personal"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } cursor-pointer`}
                  >
                    <span className="hidden sm:inline">Personal Info</span>
                    <span className="sm:hidden">Personal</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("address")}
                    className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === "address"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } cursor-pointer`}
                  >
                    <span className="hidden sm:inline">Address Info</span>
                    <span className="sm:hidden">Address</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("subjects")}
                    className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === "subjects"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } cursor-pointer`}
                  >
                    <span className="hidden sm:inline">Subjects Overview</span>
                    <span className="sm:hidden">Subjects</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("documents")}
                    className={`flex-shrink-0 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === "documents"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } cursor-pointer`}
                  >
                    Documents
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 bg-white">
                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Student Name</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                          1.1 Full name
                        </Label>
                        <Input
                          id="fullName"
                          value={editableData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          className="bg-gray-100 text-gray-700 border-gray-300"
                          disabled
                        />
                      </div>

                      {/* Father/Mother Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fatherMotherName" className="text-sm font-medium text-gray-700">
                          1.2 Father / Mother's Name
                        </Label>
                        <Input
                          id="fatherMotherName"
                          value={editableData.fatherMotherName}
                          onChange={(e) => handleInputChange("fatherMotherName", e.target.value)}
                          className="bg-gray-100 text-gray-700 border-gray-300"
                          disabled
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">1.3 Gender</Label>
                        <Select
                          value={editableData.gender}
                          onValueChange={(value) => handleInputChange("gender", value)}
                        >
                          <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.3 Correction Requested</span>
                          <Badge variant={correctionFlags.gender ? "destructive" : "outline"} className="text-xs">
                            {correctionFlags.gender ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>

                      {/* Nationality */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">1.4 Nationality</Label>
                        <Select
                          value={editableData.nationality}
                          onValueChange={(value) => handleInputChange("nationality", value)}
                        >
                          <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                          <SelectContent>
                            {nationalities.map((nationality) => (
                              <SelectItem key={nationality.id || 0} value={(nationality.id || 0).toString()}>
                                {nationality.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.4 Correction Requested</span>
                          <Badge variant={correctionFlags.nationality ? "destructive" : "outline"} className="text-xs">
                            {correctionFlags.nationality ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>

                      {/* EWS */}
                      <div className="space-y-2">
                        <Label htmlFor="belongsToEWS" className="text-sm font-medium text-gray-700">
                          1.5 Whether belong to EWS
                        </Label>
                        <Select
                          value={editableData.belongsToEWS}
                          onValueChange={(value) => handleInputChange("belongsToEWS", value)}
                        >
                          <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                            <SelectValue placeholder="Select EWS status" />
                          </SelectTrigger>
                          <SelectContent>
                            {ewsOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Aadhaar Number */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">1.6 Aadhaar Number</Label>
                        <Input
                          value={editableData.aadhaarNumber}
                          onChange={(e) => {
                            const formatted = handleAadhaarInput(e.target.value);
                            handleInputChange("aadhaarNumber", formatted);
                          }}
                          placeholder="Enter 12-digit Aadhaar number"
                          className="bg-white text-gray-900 border-gray-300"
                          maxLength={14} // 12 digits + 2 dashes
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.6 Correction Requested</span>
                          <Badge
                            variant={correctionFlags.aadhaarNumber ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {correctionFlags.aadhaarNumber ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>

                      {/* APAAR ID */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="apaarId" className="text-sm font-medium text-gray-700">
                          1.7 APAAR (ABC) ID
                        </Label>
                        <Input
                          value={editableData.apaarId}
                          onChange={(e) => {
                            const formatted = handleApaarIdInput(e.target.value);
                            handleInputChange("apaarId", formatted);
                          }}
                          placeholder="Enter 12-digit APAAR ID"
                          className="bg-white text-gray-900 border-gray-300"
                          maxLength={15} // 12 digits + 3 dashes
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">1.7 Correction Requested</span>
                          <Badge variant={correctionFlags.apaarId ? "destructive" : "outline"} className="text-xs">
                            {correctionFlags.apaarId ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>

                      {/* Declaration Checkbox */}
                      <div className="pt-2 md:col-span-2">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="personalDeclaration"
                            checked={personalDeclared}
                            onCheckedChange={handlePersonalInfoDeclarationChange}
                            disabled={isSavingPersonal}
                            className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                          />
                          <Label
                            htmlFor="personalDeclaration"
                            className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                            onClick={() => handlePersonalInfoDeclarationChange(true)}
                          >
                            I declare that the personal information provided above is correct and complete.
                            {isSavingPersonal && (
                              <span className="ml-2 text-xs text-blue-600 font-medium">⏳ Saving...</span>
                            )}
                            {personalDeclared && !isSavingPersonal && (
                              <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                            )}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Address Info Tab */}
                <TabsContent value="address" className="space-y-6">
                  <div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                      {/* Residential Address */}
                      <div className="space-y-4 xl:pr-8 xl:border-r xl:border-gray-200">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900">Residential Address</h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.1 Address Line</Label>
                            <Input
                              value={editableData.residentialAddress}
                              onChange={(e) => handleInputChange("residentialAddress", e.target.value)}
                              placeholder="Enter residential address"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.2 Country</Label>
                            <Select
                              value={editableData.residentialCountry}
                              onValueChange={(value) => handleCountryChange(value, "residential")}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.id || 0} value={(country.id || 0).toString()}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.3 State</Label>
                            <Select
                              value={editableData.residentialState}
                              onValueChange={(value) => handleStateChange(value, "residential")}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent className="max-w-xs max-h-60 overflow-y-auto">
                                <div className="px-2 py-1.5">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search states..."
                                      className="pl-8"
                                      onChange={() => {
                                        // Filter states based on search
                                        // This will be handled by the Select component's built-in filtering
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {residentialStates.length} options available
                                  </div>
                                </div>
                                {residentialStates.map((state) => (
                                  <SelectItem key={state.id || 0} value={(state.id || 0).toString()}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.4 District</Label>
                            <Select
                              value={editableData.residentialDistrict}
                              onValueChange={(value) => handleInputChange("residentialDistrict", value)}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select district" />
                              </SelectTrigger>
                              <SelectContent className="max-w-xs max-h-60 overflow-y-auto">
                                <div className="px-2 py-1.5">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search districts..."
                                      className="pl-8"
                                      onChange={() => {
                                        // Filter districts based on search
                                        // This will be handled by the Select component's built-in filtering
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {residentialDistricts.length} options available
                                  </div>
                                </div>
                                {residentialDistricts.map((district) => (
                                  <SelectItem key={district.id || 0} value={(district.id || 0).toString()}>
                                    {district.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.5 City</Label>
                            <Select
                              value={editableData.residentialCity}
                              onValueChange={(value) => handleCityChange(value, "residential")}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                              <SelectContent className="max-w-xs max-h-60 overflow-y-auto">
                                <div className="px-2 py-1.5">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search cities..."
                                      className="pl-8"
                                      onChange={() => {
                                        // Filter cities based on search
                                        // This will be handled by the Select component's built-in filtering
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {residentialCities.length} options available
                                  </div>
                                </div>
                                {residentialCities.map((city) => (
                                  <SelectItem key={city.id || 0} value={(city.id || 0).toString()}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.6 Pin Code</Label>
                            <Input
                              value={editableData.residentialPinCode}
                              onChange={(e) => handleInputChange("residentialPinCode", e.target.value)}
                              placeholder="Enter pin code"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.7 Police Station</Label>
                            <Input
                              value={editableData.residentialPoliceStation}
                              onChange={(e) => handleInputChange("residentialPoliceStation", e.target.value)}
                              placeholder="Enter police station"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.8 Post Office</Label>
                            <Input
                              value={editableData.residentialPostOffice}
                              onChange={(e) => handleInputChange("residentialPostOffice", e.target.value)}
                              placeholder="Enter post office"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mailing Address */}
                      <div className="space-y-4 xl:pl-8">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900">Mailing Address</h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.9 Address Line</Label>
                            <Input
                              value={editableData.mailingAddress}
                              onChange={(e) => handleInputChange("mailingAddress", e.target.value)}
                              placeholder="Enter mailing address"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.10 Country</Label>
                            <Select
                              value={editableData.mailingCountry}
                              onValueChange={(value) => handleCountryChange(value, "mailing")}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.id || 0} value={(country.id || 0).toString()}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.11 State</Label>
                            <Select
                              value={editableData.mailingState}
                              onValueChange={(value) => handleStateChange(value, "mailing")}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent className="max-w-xs max-h-60 overflow-y-auto">
                                <div className="px-2 py-1.5">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search states..."
                                      className="pl-8"
                                      onChange={() => {
                                        // Filter states based on search
                                        // This will be handled by the Select component's built-in filtering
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {mailingStates.length} options available
                                  </div>
                                </div>
                                {mailingStates.map((state) => (
                                  <SelectItem key={state.id || 0} value={(state.id || 0).toString()}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.12 District</Label>
                            <Select
                              value={editableData.mailingDistrict}
                              onValueChange={(value) => handleInputChange("mailingDistrict", value)}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select district" />
                              </SelectTrigger>
                              <SelectContent className="max-w-xs max-h-60 overflow-y-auto">
                                <div className="px-2 py-1.5">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search districts..."
                                      className="pl-8"
                                      onChange={() => {
                                        // Filter districts based on search
                                        // This will be handled by the Select component's built-in filtering
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {mailingDistricts.length} options available
                                  </div>
                                </div>
                                {mailingDistricts.map((district) => (
                                  <SelectItem key={district.id || 0} value={(district.id || 0).toString()}>
                                    {district.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.13 City</Label>
                            <Select
                              value={editableData.mailingCity}
                              onValueChange={(value) => handleCityChange(value, "mailing")}
                            >
                              <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                                <SelectValue placeholder="Select city" />
                              </SelectTrigger>
                              <SelectContent className="max-w-xs max-h-60 overflow-y-auto">
                                <div className="px-2 py-1.5">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search cities..."
                                      className="pl-8"
                                      onChange={() => {
                                        // Filter cities based on search
                                        // This will be handled by the Select component's built-in filtering
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {mailingCities.length} options available
                                  </div>
                                </div>
                                {mailingCities.map((city) => (
                                  <SelectItem key={city.id || 0} value={(city.id || 0).toString()}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.14 Pin Code</Label>
                            <Input
                              value={editableData.mailingPinCode}
                              onChange={(e) => handleInputChange("mailingPinCode", e.target.value)}
                              placeholder="Enter pin code"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.15 Police Station</Label>
                            <Input
                              value={editableData.mailingPoliceStation}
                              onChange={(e) => handleInputChange("mailingPoliceStation", e.target.value)}
                              placeholder="Enter police station"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">2.16 Post Office</Label>
                            <Input
                              value={editableData.mailingPostOffice}
                              onChange={(e) => handleInputChange("mailingPostOffice", e.target.value)}
                              placeholder="Enter post office"
                              className="bg-white text-gray-900 border-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Declaration Checkbox */}
                    <div className="mt-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addressDeclaration"
                          checked={addressDeclared}
                          onCheckedChange={handleAddressInfoDeclarationChange}
                          disabled={isSavingAddress}
                          className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                        />
                        <Label
                          htmlFor="addressDeclaration"
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                          onClick={() => handleAddressInfoDeclarationChange(true)}
                        >
                          I declare that the address information provided above is correct and complete.
                          {isSavingAddress && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">⏳ Saving...</span>
                          )}
                          {addressDeclared && !isSavingAddress && (
                            <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Subjects Overview Tab */}
                <TabsContent value="subjects" className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">3.1 Subjects Overview (Semesters 1-4)</h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Correction Requested</span>
                        <Badge variant={correctionFlags.subjects ? "destructive" : "outline"} className="text-xs">
                          {correctionFlags.subjects ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                              Category
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              Sem 1
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              Sem 2
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              Sem 3
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              Sem 4
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(subjectsData)
                            .filter(([category]) => category !== "SEC") // Remove SEC subjects from display
                            .map(([category, semesters]) => (
                              <tr key={category} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 min-w-[120px]">
                                  {/* Show MDC instead of IDC for BCOM students */}
                                  {category === "IDC" && isBcomProgram ? "MDC" : category}
                                </td>
                                {Object.entries(semesters).map(([sem, value]) => {
                                  const mandatorySubjectsList =
                                    (mandatorySubjects[category as keyof typeof mandatorySubjects]?.[
                                      sem as keyof typeof semesters
                                    ] as string[]) || [];
                                  const studentSubjectsList = Array.isArray(value) ? value : value ? [value] : [];

                                  return (
                                    <td key={sem} className="border border-gray-300 px-2 py-2 min-w-[150px]">
                                      <div className="text-sm text-gray-900">
                                        {(() => {
                                          // Combine all subjects (mandatory + optional) into one array
                                          const allSubjects: Array<{ name: string; isMandatory: boolean }> = [];

                                          // Add mandatory subjects
                                          mandatorySubjectsList.forEach((subject) => {
                                            allSubjects.push({ name: subject, isMandatory: true });
                                          });

                                          // Add optional subjects (filter out duplicates)
                                          const filteredSubjects = studentSubjectsList.filter(
                                            (subject) => !mandatorySubjectsList.includes(subject),
                                          );
                                          filteredSubjects.forEach((subject) => {
                                            allSubjects.push({ name: subject, isMandatory: false });
                                          });

                                          // For Minor category, if sem4 is empty and sem3 has subjects, duplicate sem3 subjects to sem4
                                          if (category === "Minor" && sem === "sem4" && allSubjects.length === 0) {
                                            const sem3Mandatory =
                                              (mandatorySubjects[category as keyof typeof mandatorySubjects]
                                                ?.sem3 as string[]) || [];
                                            const sem3Student = Array.isArray(semesters.sem3)
                                              ? semesters.sem3
                                              : semesters.sem3
                                                ? [semesters.sem3]
                                                : [];

                                            // Add sem3 mandatory subjects
                                            sem3Mandatory.forEach((subject) => {
                                              allSubjects.push({ name: subject, isMandatory: true });
                                            });

                                            // Add sem3 student subjects (filter out duplicates)
                                            const filteredSem3Subjects = sem3Student.filter(
                                              (subject) => !sem3Mandatory.includes(subject),
                                            );
                                            filteredSem3Subjects.forEach((subject) => {
                                              allSubjects.push({ name: subject, isMandatory: false });
                                            });
                                          }

                                          // If no subjects, display Not Applicable or MDC-specific message
                                          if (allSubjects.length === 0) {
                                            // For BCOM students, show specific message for MDC
                                            if (category === "IDC" && isBcomProgram) {
                                              return (
                                                <span className="text-gray-500 italic">
                                                  MDC subjects not available for this program
                                                </span>
                                              );
                                            }
                                            return <span className="text-gray-500 italic">Not Applicable</span>;
                                          }

                                          // Render all subjects as ordered list
                                          return (
                                            <div className="text-sm text-gray-900">
                                              {allSubjects.map((subject, index) => (
                                                <span key={`subject-${index}`}>
                                                  {subject.name}
                                                  {index < allSubjects.length - 1 && ", "}
                                                </span>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Declaration Checkbox */}
                    <div className="mt-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="subjectsDeclaration"
                          checked={subjectsDeclared}
                          onCheckedChange={handleSubjectsDeclarationChange}
                          disabled={isSavingSubjects}
                          className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                        />
                        <Label
                          htmlFor="subjectsDeclaration"
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                          onClick={() => handleSubjectsDeclarationChange(true)}
                        >
                          I confirm the subjects listed above for Semesters 1-4.
                          {isSavingSubjects && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">⏳ Saving...</span>
                          )}
                          {subjectsDeclared && !isSavingSubjects && (
                            <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Uploads</h2>

                    {/* Documents Table with Upload Column */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Document Type
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Current Document
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Size
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Upload
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {documentTypes.map((docType) => {
                            // Find existing document for this type

                            const existingDoc = uploadedDocuments.find((doc) => {
                              // Use ONLY document ID matching - most reliable method
                              const docId = doc.documentId;
                              const nestedDocId = (doc.document as Record<string, unknown>)?.id;
                              const docTypeId = docType.id;
                              const docTypeIdNum = parseInt(docType.id);

                              // Removed excessive logging for performance

                              // Primary matching: Check document ID (most reliable)
                              const idMatch =
                                docId === docTypeId ||
                                docId === docTypeIdNum ||
                                nestedDocId === docTypeId ||
                                nestedDocId === docTypeIdNum;

                              // Removed excessive logging for performance

                              return idMatch;
                            });

                            console.info(`[CU-REG MAIN-CONSOLE] Found existing doc for ${docType.name}:`, existingDoc);

                            const fileSizeKB = existingDoc?.fileSize
                              ? ((existingDoc.fileSize as number) / 1024).toFixed(1)
                              : "N/A";

                            return (
                              <tr key={docType.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  {docType.name}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  {existingDoc ? (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                        {(existingDoc.fileType as string)?.startsWith("image/") ? (
                                          docPreviewUrls[existingDoc.id as number] ? (
                                            <img
                                              src={docPreviewUrls[existingDoc.id as number]}
                                              alt="Preview"
                                              className="w-full h-full object-cover"
                                              onError={async () => {
                                                try {
                                                  const url = await getCuRegistrationDocumentSignedUrl(
                                                    existingDoc.id as number,
                                                  );
                                                  if (url && url !== "undefined" && url !== "null") {
                                                    setDocPreviewUrls((prev) => ({
                                                      ...prev,
                                                      [existingDoc.id as number]: url,
                                                    }));
                                                  }
                                                } catch (error) {
                                                  console.error("Failed to get signed URL:", error);
                                                }
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                                              <button
                                                onClick={async () => {
                                                  try {
                                                    const url = await getCuRegistrationDocumentSignedUrl(
                                                      existingDoc.id as number,
                                                    );
                                                    if (url && url !== "undefined" && url !== "null") {
                                                      setDocPreviewUrls((prev) => ({
                                                        ...prev,
                                                        [existingDoc.id as number]: url,
                                                      }));
                                                    }
                                                  } catch (error) {
                                                    console.error("Failed to get signed URL:", error);
                                                  }
                                                }}
                                                className="text-xs text-blue-600 hover:underline"
                                              >
                                                Load
                                              </button>
                                            </div>
                                          )
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs">
                                            PDF
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 truncate max-w-[200px]">
                                          {existingDoc.fileName as string}
                                        </p>
                                        <button
                                          className="text-xs text-blue-600 hover:underline"
                                          onClick={async () => {
                                            try {
                                              const url = await getCuRegistrationDocumentSignedUrl(
                                                existingDoc.id as number,
                                              );
                                              if (url && url !== "undefined" && url !== "null") {
                                                window.open(url, "_blank");
                                              } else {
                                                toast.error("Invalid document URL");
                                              }
                                            } catch (error) {
                                              console.error("Failed to open document:", error);
                                              toast.error("Failed to open document");
                                            }
                                          }}
                                        >
                                          Open
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 italic">No document uploaded</span>
                                  )}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  {fileSizeKB} kB
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const inputId = `document-${docType.id}`;
                                        console.info(
                                          `[CU-REG MAIN-CONSOLE] Button clicked for document ${docType.name}, looking for input: ${inputId}`,
                                        );
                                        const input = document.getElementById(inputId) as HTMLInputElement;
                                        if (input) {
                                          console.info(`[CU-REG MAIN-CONSOLE] Input found, triggering click`);
                                          input.click();
                                        } else {
                                          console.error(`[CU-REG MAIN-CONSOLE] Input not found: ${inputId}`);
                                        }
                                      }}
                                    >
                                      {documents[`document-${docType.id}`] ? "Change File" : "Select File"}
                                    </Button>
                                    <p className="text-xs text-gray-500">
                                      Max {getFileSizeLimit(docType.name).maxSizeKB}KB
                                    </p>
                                    <input
                                      id={`document-${docType.id}`}
                                      type="file"
                                      accept=".jpg,.jpeg,.png,.gif"
                                      className="hidden"
                                      onChange={(e) => {
                                        console.info(
                                          `[CU-REG MAIN-CONSOLE] File input onChange triggered for document ${docType.name}`,
                                        );
                                        const file = e.target.files?.[0] || null;
                                        console.info(
                                          `[CU-REG MAIN-CONSOLE] File selected for document ${docType.name}:`,
                                          {
                                            name: file?.name,
                                            size: file?.size,
                                            sizeKB: file ? (file.size / 1024).toFixed(1) : "N/A",
                                            type: file?.type,
                                          },
                                        );
                                        setDocuments((prev) => {
                                          const newState = { ...prev, [`document-${docType.id}`]: file };
                                          console.info(`[CU-REG MAIN-CONSOLE] Updated documents state:`, newState);
                                          return newState;
                                        });
                                        // Files will be uploaded when documents declaration is clicked
                                      }}
                                    />
                                  </div>
                                  {documents[`document-${docType.id}`] && (
                                    <div className="mt-1">
                                      <p className="text-xs text-gray-600 truncate max-w-full">
                                        Selected: {documents[`document-${docType.id}`]?.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {((documents[`document-${docType.id}`]?.size || 0) / 1024).toFixed(1)} kB
                                      </p>
                                    </div>
                                  )}
                                  {/* Debug: Show documents state for this document type */}
                                  {process.env.NODE_ENV === "development" && (
                                    <div className="mt-1 text-xs text-gray-400">
                                      Debug: documents[{`document-${docType.id}`}] ={" "}
                                      {documents[`document-${docType.id}`] ? "File selected" : "No file"}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Declaration Checkbox */}
                    <div className="mt-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="documentsDeclaration"
                          checked={documentsConfirmed}
                          onCheckedChange={(checked) => {
                            console.info(`[CU-REG MAIN-CONSOLE] Documents declaration checkbox clicked:`, {
                              checked,
                              documentsConfirmed,
                              isSavingDocuments,
                              documentUploadsCount: Object.keys(documents).length,
                              documentUploads: documents,
                            });
                            handleDocumentsDeclarationChange(checked as boolean);
                          }}
                          disabled={isSavingDocuments}
                          className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                        />
                        <Label
                          htmlFor="documentsDeclaration"
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                          onClick={() => handleDocumentsDeclarationChange(true)}
                        >
                          I confirm that the uploaded documents correspond to the data provided.
                          {isSavingDocuments && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">⏳ Saving...</span>
                          )}
                          {documentsConfirmed && !isSavingDocuments && (
                            <span className="ml-2 text-xs text-green-600 font-medium">✓ Completed</span>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

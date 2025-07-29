import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Download, 
  FileText, 
  Plus, 
  FolderOpen,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import axiosInstance from "@/utils/api";

// Import all the types we need
import { Degree, DegreeLevel } from "@/types/resources/degree.types";

// Import service functions
import { createBoardUniversity, updateBoardUniversity } from "@/services/board-university.service";
import { createInstitution, updateInstitution } from "@/services/institution.service";
import { createCategory, updateCategory } from "@/services/categories.service";
import {  createDegree, findAllDegrees } from "@/services/degree.service";
import { createReligion, updateReligion } from "@/services/religion.service";
import { createLanguageMedium, updateLanguageMedium } from "@/services/language-medium.service";
import { createBloodGroup, updateBloodGroup } from "@/services/blood-group.service";
import { createQualification, updateQualification } from "@/services/qualification.service";
import { createCountry, updateCountry } from "@/services/country.service";
import { createState, updateState } from "@/services/state.service";
import { createCity, updateCity } from "@/services/city.service";
import { createAnnualIncome, updateAnnualIncome } from "@/services/annual-income.service";
import { createDocument, updateDocument } from "@/services/document.service";
// import { getAllDegrees } from "@/services/degree.service";
import { getAllStates } from "@/services/state.service";
import { getAllCountries } from "@/services/country.service";
import { useQuery } from '@tanstack/react-query';
import { createOccupation, updateOccupation } from '@/services/occupations.service';
import { createNationality, updateNationality } from '@/services/nationalities.service';


interface DynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  action: string;
  settingType: string;
  onSuccess: () => void;
  editData?: Record<string, string | number | boolean | null>;
  editId?: number;
}

// Field configuration based on types
interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: string | number | boolean | null) => string | null;
}

// Get field configuration based on setting type
const getFieldConfig = (settingType: string): FieldConfig[] => {
  const configs: Record<string, FieldConfig[]> = {
    "Board Universities": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter board/university name' },
      { name: 'code', label: 'Code', type: 'text', required: false, placeholder: 'Enter code' },
      { name: 'passingMarks', label: 'Passing Marks', type: 'number', required: false, placeholder: 'Enter passing marks' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Institutions": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter institution name' },
      { name: 'degreeId', label: 'Degree', type: 'select', required: true, placeholder: 'Select a degree' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Categories": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter category name' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter code' },
      { name: 'documentRequired', label: 'Document Required', type: 'boolean', required: true },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Degree": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter degree name' },
      { 
        name: 'level', 
        label: 'Level', 
        type: 'select', 
        required: true,
        options: [
          { value: DegreeLevel.SECONDARY, label: 'Secondary' },
          { value: DegreeLevel.HIGHER_SECONDARY, label: 'Higher Secondary' },
          { value: DegreeLevel.UNDER_GRADUATE, label: 'Under Graduate' },
          { value: DegreeLevel.POST_GRADUATE, label: 'Post Graduate' }
        ]
      },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Religion": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter religion name' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Language Medium": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter language name' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Documents": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter document name' },
      { name: 'description', label: 'Description', type: 'text', required: false, placeholder: 'Enter document description' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Blood Groups": [
      { name: 'type', label: 'Blood Group Type', type: 'text', required: true, placeholder: 'Enter blood group type (e.g., A+, B-, O+)' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Occupation": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter occupation name' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Qualifications": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter qualification name' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Nationality": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter nationality name' },
      { name: 'code', label: 'Code', type: 'number', required: false, placeholder: 'Enter nationality code' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Country": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter country name' },
      { name: 'code', label: 'Country Code', type: 'text', required: false, placeholder: 'Enter country code (e.g., IN, US)' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "State": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter state name' },
      { name: 'countryId', label: 'Country', type: 'select', required: true, placeholder: 'Select a country' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "City": [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter city name' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'Enter city code' },
      { name: 'stateId', label: 'State', type: 'select', required: true, placeholder: 'Select a state' },
      { name: 'documentRequired', label: 'Document Required', type: 'boolean', required: true },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ],
    "Annual Income": [
      { name: 'range', label: 'Income Range', type: 'text', required: true, placeholder: 'Enter income range (e.g., 0-50000, 50000-100000)' },
      { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
      { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
    ]
  };

  return configs[settingType] || [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
    { name: 'sequence', label: 'Sequence', type: 'number', required: false, placeholder: 'Enter sequence number' },
    { name: 'disabled', label: 'Disabled', type: 'boolean', required: false }
  ];
};

// API endpoints mapping
const getApiEndpoints = (settingType: string) => {
  const endpoints = {
    "All Users": {
      base: "/api/users",
      upload: "/api/users/upload",
      download: "/api/users/download",
      template: "/api/users/template"
    },
    "Board Universities": {
      base: "/api/board-universities",
      upload: "/api/board-universities/upload",
      download: "/api/board-universities/download",
      template: "/api/board-universities/template"
    },
    "Institutions": {
      base: "/api/institutions",
      upload: "/api/institutions/upload",
      download: "/api/institutions/download",
      template: "/api/institutions/template"
    },
    "Categories": {
      base: "/api/categories",
      upload: "/api/categories/upload",
      download: "/api/categories/download",
      template: "/api/categories/template"
    },
    "Degree": {
      base: "/api/degree",
      upload: "/api/degree/upload",
      download: "/api/degree/download",
      template: "/api/degree/template"
    },
    "Religion": {
      base: "/api/religions",
      upload: "/api/religions/upload",
      download: "/api/religions/download",
      template: "/api/religions/template"
    },
    "Language Medium": {
      base: "/api/language-mediums",
      upload: "/api/language-mediums/upload",
      download: "/api/language-mediums/download",
      template: "/api/language-mediums/template"
    },
    "Documents": {
      base: "/api/documents",
      upload: "/api/documents/upload",
      download: "/api/documents/download",
      template: "/api/documents/template"
    },
    "Blood Groups": {
      base: "/api/blood-groups",
      upload: "/api/blood-groups/upload",
      download: "/api/blood-groups/download",
      template: "/api/blood-groups/template"
    },
    "Occupation": {
      base: "/api/occupations",
      upload: "/api/occupations/upload",
      download: "/api/occupations/download",
      template: "/api/occupations/template"
    },
    "Qualifications": {
      base: "/api/qualifications",
      upload: "/api/qualifications/upload",
      download: "/api/qualifications/download",
      template: "/api/qualifications/template"
    },
    "Nationality": {
      base: "/api/nationalities",
      upload: "/api/nationalities/upload",
      download: "/api/nationalities/download",
      template: "/api/nationalities/template"
    },
    "Country": {
      base: "/api/countries",
      upload: "/api/countries/upload",
      download: "/api/countries/download",
      template: "/api/countries/template"
    },
    "State": {
      base: "/api/states",
      upload: "/api/states/upload",
      download: "/api/states/download",
      template: "/api/states/template"
    },
    "City": {
      base: "/api/cities",
      upload: "/api/cities/upload",
      download: "/api/cities/download",
      template: "/api/cities/template"
    },
    "Annual Income": {
      base: "/api/annual-incomes",
      upload: "/api/annual-incomes/upload",
      download: "/api/annual-incomes/download",
      template: "/api/annual-incomes/template"
    }
  };

  return endpoints[settingType as keyof typeof endpoints] || endpoints["Categories"];
};

// Service function mapping
const getServiceFunction = (settingType: string) => {
  const services = {
    "Board Universities": createBoardUniversity,
    "Institutions": createInstitution,
    "Categories": createCategory,
    "Degree": createDegree,
    "Religion": createReligion,
    "Language Medium": createLanguageMedium,
    "Documents": createDocument,
    "Blood Groups": createBloodGroup,
    "Occupation": createOccupation,
    "Qualifications": createQualification,
    "Nationality": createNationality,
    "Country": createCountry,
    "State": createState,
    "City": createCity,
    "Annual Income": createAnnualIncome,
  };

  return services[settingType as keyof typeof services];
};

const getUpdateServiceFunction = (settingType: string) => {
  const services = {
    "Board Universities": updateBoardUniversity,
    "Institutions": updateInstitution,
    "Categories": updateCategory,
    "Degree": "updateDegree",
    "Religion": updateReligion,
    "Language Medium": updateLanguageMedium,
    "Documents": updateDocument,
    "Blood Groups": updateBloodGroup,
    "Occupation": updateOccupation,
    "Qualifications": updateQualification,
    "Nationality": updateNationality,
    "Country": updateCountry,
    "State": updateState,
    "City": updateCity,
    "Annual Income": updateAnnualIncome,
  };
  return services[settingType as keyof typeof services];
};

export const DynamicModal: React.FC<DynamicModalProps> = ({
  isOpen,
  onClose,
  type,
  action,
  settingType,
  onSuccess,
  editData,
  editId,
}) => {
  const [formData, setFormData] = useState<Record<string, string | number | boolean | null>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch degrees for institution form
  const { data: degrees = [] } = useQuery({
    queryKey: ['degrees'],
    queryFn: async () => {
      try {
        const result = await findAllDegrees();
        return result || [];
      } catch (error) {
        console.error('Failed to fetch degrees:', error);
        return [] as Degree[];
      }
    },
    enabled: settingType === 'Institutions' && isOpen,
  });

  // Fetch states for city form
  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      try {
        const result = await getAllStates();
        return result || [];
      } catch (error) {
        console.error('Failed to fetch states:', error);
        return [];
      }
    },
    enabled: settingType === 'City' && isOpen,
  });
  
  // Fetch countries for state form
  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      try {
        const result = await getAllCountries();
        return result || [];
      } catch (error) {
        console.error('Failed to fetch countries:', error);
        return [];
      }
    },
    enabled: settingType === 'State' && isOpen,
  });
  
  // Memoize field config and endpoints to prevent re-renders
  const fieldConfig = useMemo(() => {
    const config = getFieldConfig(settingType);
    
    // Add degree options for institution form
    if (settingType === 'Institutions') {
      const degreeField = config.find(field => field.name === 'degreeId');
      if (degreeField) {
        if (degrees.length > 0) {
          degreeField!.options = degrees.map(degree => ({
            value: degree.id.toString(),
            label: degree?.name || ''
          }));
        } else {
          // Fallback: show a message that no degrees are available
          degreeField.options = [
            { value: 'no-degrees', label: 'No degrees available. Please create degrees first.' }
          ];
          degreeField.required = false; // Make it optional if no degrees
        }
      }
    }
    
    // Add country options for state form
    if (settingType === 'State') {
      const countryField = config.find(field => field.name === 'countryId');
      if (countryField) {
        if (countries.length > 0) {
          countryField.options = countries.map(country => ({
            value: country.id.toString(),
            label: country.name
          }));
        } else {
          // Fallback: show a message that no countries are available
          countryField.options = [
            { value: 'no-countries', label: 'No countries available. Please create countries first.' }
          ];
          countryField.required = false; // Make it optional if no countries
        }
      }
    }
    
    // Add state options for city form
    if (settingType === 'City') {
      const stateField = config.find(field => field.name === 'stateId');
      if (stateField) {
        if (states.length > 0) {
          stateField.options = states.map(state => ({
            value: state.id.toString(),
            label: state.name
          }));
        } else {
          // Fallback: show a message that no states are available
          stateField.options = [
            { value: 'no-states', label: 'No states available. Please create states first.' }
          ];
          stateField.required = false; // Make it optional if no states
        }
      }
    }
    
    return config;
  }, [settingType, degrees, states, countries]);
  const endpoints = useMemo(() => getApiEndpoints(settingType), [settingType]);
  const serviceFunction = useMemo(() => getServiceFunction(settingType), [settingType]);
  const updateServiceFunction = useMemo(() => getUpdateServiceFunction(settingType), [settingType]);

  // Reset form data when modal opens
  useEffect(() => {
    if (isOpen && type === 'add') {
      console.log('Resetting form data for:', settingType);
      setFormData({});
      setErrors({});
    }
  }, [isOpen, type, settingType]);

  // Pre-fill form data when editing
  useEffect(() => {
    if (isOpen && type === 'edit' && editData) {
      setFormData(editData);
      setErrors({});
    }
  }, [isOpen, type, editData]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', settingType);
      
      const response = await axiosInstance.post(endpoints.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const url = action.includes('template') ? endpoints.template : endpoints.download;
      const response = await axiosInstance.get(url, {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${settingType.toLowerCase().replace(/\s+/g, '-')}-${action.includes('template') ? 'template' : 'data'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      onSuccess();
    },
    onError: (error) => {
      console.error('Download failed:', error);
    }
  });

  // Add item mutation using proper service functions
  const addMutation = useMutation({
    mutationFn: async (data: Record<string, string | number | boolean | null>) => {
      if (!serviceFunction) {
        throw new Error(`No service function found for ${settingType}`);
      }
      // Convert form data to proper types
      const payload: Record<string, string | number | boolean | null> = { ...data };
      
      // Convert number fields and select fields that should be numbers
      fieldConfig.forEach(field => {
        if (field.type === 'number' && payload[field.name] !== undefined && payload[field.name] !== '') {
          payload[field.name] = Number(payload[field.name]);
        }
        
        // Convert select fields that represent foreign keys to numbers
        if (field.type === 'select' && 
            (field.name === 'countryId' || field.name === 'stateId' || field.name === 'degreeId') &&
            payload[field.name] !== undefined && 
            payload[field.name] !== '') {
          payload[field.name] = Number(payload[field.name]);
        }
      });

      // Use the appropriate service function with proper typing
      try {
        const result = await (serviceFunction as (payload: Record<string, string | number | boolean | null>) => Promise<unknown>)(payload);
        
        // If result is undefined, create a mock result to indicate success
        if (result === undefined) {
          return { success: true, message: 'Item created successfully' };
        }
        
        return result;
      } catch (error) {
        console.error('Service call failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error('Add failed:', error);
    }
  });

  // Update mutation for edit
  const editMutation = useMutation({
    mutationFn: async (data: Record<string, string | number | boolean | null>) => {
      if (!updateServiceFunction || !editId) throw new Error("No update function or id");
      // Convert number fields and select fields that should be numbers
      const payload: Record<string, string | number | boolean | null> = { ...data };
      fieldConfig.forEach(field => {
        if (field.type === 'number' && payload[field.name] !== undefined && payload[field.name] !== '') {
          payload[field.name] = Number(payload[field.name]);
        }
        if (field.type === 'select' &&
            (field.name === 'countryId' || field.name === 'stateId' || field.name === 'degreeId') &&
            payload[field.name] !== undefined &&
            payload[field.name] !== '') {
          payload[field.name] = Number(payload[field.name]);
        }
      });
      // Remove createdAt and updatedAt from payload
      delete payload.createdAt;
      delete payload.updatedAt;
      return (updateServiceFunction as (id: number, payload: Record<string, string | number | boolean | null>) => Promise<unknown>)(editId, payload);
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error('Edit failed:', error);
    }
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      await uploadMutation.mutateAsync(selectedFile);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, uploadMutation]);

  const handleDownload = useCallback(async () => {
    setIsProcessing(true);
    try {
      await downloadMutation.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  }, [downloadMutation]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    fieldConfig.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name] === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      if (field.validation && formData[field.name]) {
        const validationError = field.validation(formData[field.name]);
        if (validationError) {
          newErrors[field.name] = validationError;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fieldConfig, formData]);

  const handleAdd = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    // Filter out fallback values that indicate no options are available
    const filteredData = { ...formData };
    
    // Remove fallback values for select fields
    Object.keys(filteredData).forEach(key => {
      if (filteredData[key] === 'no-countries' || 
          filteredData[key] === 'no-states' || 
          filteredData[key] === 'no-degrees') {
        delete filteredData[key];
      }
    });
    
    setIsProcessing(true);
    try {
      await addMutation.mutateAsync(filteredData);
    } finally {
      setIsProcessing(false);
    }
  }, [validateForm, addMutation, formData]);

  const handleEdit = useCallback(async () => {
    if (!validateForm()) return;
    // Filter out fallback values that indicate no options are available
    const filteredData = { ...formData };
    Object.keys(filteredData).forEach(key => {
      if (filteredData[key] === 'no-countries' ||
          filteredData[key] === 'no-states' ||
          filteredData[key] === 'no-degrees') {
        delete filteredData[key];
      }
    });
    setIsProcessing(true);
    try {
      await editMutation.mutateAsync(filteredData);
    } finally {
      setIsProcessing(false);
    }
  }, [validateForm, editMutation, formData]);

  const handleInputChange = useCallback((fieldName: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  }, [errors]);

  const renderField = useCallback((field: FieldConfig) => {
    const value = (formData[field.name] !== undefined && formData[field.name] !== null) ? formData[field.name] : '';
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              value={typeof value === 'string' || typeof value === 'number' ? value : ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="number"
              value={typeof value === 'number' || typeof value === 'string' ? value : ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={typeof value === 'boolean' ? value : false}
              onCheckedChange={(checked) => handleInputChange(field.name, checked as boolean)}
            />
            <Label htmlFor={field.name}>{field.label}</Label>
            {error && <p className="text-sm text-red-500 ml-2">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Select value={typeof value === 'string' ? value : ''} onValueChange={(value: string) => handleInputChange(field.name, value)}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  }, [formData, errors, handleInputChange]);

  const getModalContent = useMemo(() => {
    switch (type) {
      case "file-select":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FolderOpen className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to select file</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">XLSX, CSV files only</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.csv"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">{selectedFile.name}</span>
              </div>
            )}
          </div>
        );

      case "file-upload":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload file</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">XLSX, CSV files only</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.csv"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">{selectedFile.name}</span>
              </div>
            )}
          </div>
        );

      case "download":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Download className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <p className="text-lg font-medium text-gray-900">
                  {action.includes('template') ? 'Download Template' : 'Download All Data'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {action.includes('template') 
                    ? 'Download the template file to fill in your data'
                    : 'Download all current data as an Excel file'
                  }
                </p>
              </div>
            </div>
          </div>
        );

      case "add":
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              {fieldConfig.map(field => renderField(field))}
            </div>
          </div>
        );

      case "edit":
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              {fieldConfig.map(field => renderField(field))}
            </div>
          </div>
        );

      default:
        return <div>Unknown modal type</div>;
    }
  }, [type, action, selectedFile, handleFileSelect, fieldConfig, renderField]);

  const getModalTitle = useMemo(() => {
    switch (type) {
      case "file-select":
        return "Select File";
      case "file-upload":
        return "Upload File";
      case "download":
        return action.includes('template') ? "Download Template" : "Download Data";
      case "add":
        return `Add ${settingType.slice(0, -1)}`;
      case "edit":
        return `Edit ${settingType.slice(0, -1)}`;
      default:
        return "Modal";
    }
  }, [type, action, settingType]);

  const getModalDescription = useMemo(() => {
    switch (type) {
      case "file-select":
        return `Select a file to process for ${settingType}`;
      case "file-upload":
        return `Upload a file to import data for ${settingType}`;
      case "download":
        return action.includes('template') 
          ? `Download template file for ${settingType}`
          : `Download all ${settingType} data`;
      case "add":
        return `Add a new ${settingType.slice(0, -1).toLowerCase()}`;
      case "edit":
        return `Edit ${settingType.slice(0, -1).toLowerCase()} details`;
      default:
        return "";
    }
  }, [type, action, settingType]);

  const isFormValid = useMemo(() => {
    if (type !== "add" && type !== "edit") return true;
    return fieldConfig.every(field => {
      if (!field.required) return true;
      return formData[field.name] && formData[field.name] !== '';
    });
  }, [type, fieldConfig, formData]);

  const getActionButton = useMemo(() => {
    const isDisabled = isProcessing || 
      (type === "file-upload" && !selectedFile) ||
      ((type === "add" || type === "edit") && !isFormValid);

    switch (type) {
      case "file-select":
        return (
          <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-2" />}
            Select File
          </Button>
        );
      case "file-upload":
        return (
          <Button onClick={handleFileUpload} disabled={isDisabled}>
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload File
          </Button>
        );
      case "download":
        return (
          <Button onClick={handleDownload} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download
          </Button>
        );
      case "add":
        return (
          <Button onClick={handleAdd} disabled={isDisabled}>
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add
          </Button>
        );
      case "edit":
        return (
          <Button onClick={handleEdit} disabled={isDisabled}>
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Save
          </Button>
        );
      default:
        return null;
    }
  }, [type, isProcessing, selectedFile, isFormValid, handleFileUpload, handleDownload, handleAdd, handleEdit]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalTitle}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {getModalContent}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          {getActionButton}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
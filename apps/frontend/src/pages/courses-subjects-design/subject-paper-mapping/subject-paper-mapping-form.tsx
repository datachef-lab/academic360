// // import React, { useState } from 'react';
// // import { useForm, useFieldArray } from 'react-hook-form';
// // import { zodResolver } from '@hookform/resolvers/zod';
// // import { z } from 'zod';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';

// // import { Checkbox } from '@/components/ui/checkbox';
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from '@/components/ui/select';
// // import {  Trash2 } from 'lucide-react';
// // import { Subject, Affiliation, RegulationType, SubjectType } from '@/types/course-design';
// // import { createSubjectPaperWithPapers, checkSubjectPaperDuplicate } from '@/services/course-design.api';
// // import { toast } from 'sonner';
// // import { CascadingDropdowns } from './components/cascading-dropdowns';

// // // Define the API ExamComponent type
// // interface ApiExamComponent {
// //   id?: number;
// //   name: string;
// //   code: string;
// //   description?: string;
// //   createdAt?: Date;
// //   updatedAt?: Date;
// // }

// // // Schema for a single paper row
// // const paperRowSchema = z.object({
// //   subjectTypeId: z.number(),
// //   applicableCourses: z.array(z.number()),
// //   semester: z.string(),
// //   paperName: z.string(),
// //   paperCode: z.string(),
// //   isOptional: z.boolean(),
// //   components: z.array(z.object({
// //     examComponentId: z.number(),
// //     fullMarks: z.number(),
// //     credit: z.number(),
// //   })),
// // });

// // // Schema for the entire form
// // const subjectPaperMappingSchema = z.object({
// //   subjectId: z.number(),
// //   affiliationId: z.number(),
// //   regulationTypeId: z.number(),
// //   academicYearId: z.number(),
// //   papers: z.array(paperRowSchema),
// // });

// // type SubjectPaperMappingFormData = z.infer<typeof subjectPaperMappingSchema>;
// // type PaperRow = z.infer<typeof paperRowSchema>;

// // interface SubjectPaperMappingFormProps {
// //   onSubmit: (data: SubjectPaperMappingFormData) => void;
// //   onCancel: () => void;
// //   isLoading?: boolean;
// //   subjects: Subject[];
// //   affiliations: Affiliation[];
// //   regulationTypes: RegulationType[];
// //   subjectTypes: SubjectType[];
// //   examComponents: ApiExamComponent[];
// //   academicYears: { id: number; year: string; isActive?: boolean }[];
// //   courses: { id: number; name: string; shortName?: string | null }[];
// //   classes: { id: number; name: string; type: string }[];
// //   editData?: any; // Data for editing existing subject paper
// // }

// // export const SubjectPaperMappingForm: React.FC<SubjectPaperMappingFormProps> = ({
// //   onSubmit,
// //   onCancel,
// //   isLoading = false,
// //   subjects,
// //   affiliations,
// //   regulationTypes,
// //   subjectTypes,
// //   examComponents,
// //   academicYears,
// //   courses,
// //   classes,
// //   editData,
// // }) => {
// //   // Use refs to maintain focus
// //   const inputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});
  
// //   // Local state for input values to prevent focus loss
// //   const [localInputValues, setLocalInputValues] = React.useState<{
// //     [key: string]: string;
// //   }>({});

// //   // Function to get input value with fallback
// //   const getInputValue = (key: string, fallback: string) => {
// //     return localInputValues[key] !== undefined ? localInputValues[key] : fallback;
// //   };

// //   // Function to update input value
// //   const updateInputValue = (key: string, value: string) => {
// //     setLocalInputValues(prev => ({
// //       ...prev,
// //       [key]: value
// //     }));
// //   };
  
// //   console.log('SubjectPaperMappingForm received classes:', classes);
// //   console.log('SubjectPaperMappingForm received subjectTypes:', subjectTypes);
// //   console.log('SubjectPaperMappingForm received subjects:', subjects);
// //   console.log('SubjectPaperMappingForm received affiliations:', affiliations);
// //   console.log('SubjectPaperMappingForm received regulationTypes:', regulationTypes);
// //   console.log('SubjectPaperMappingForm received academicYears:', academicYears);
// //   console.log('SubjectPaperMappingForm received courses:', courses);
  
// //   // State for cascading dropdowns
// //   const [selectedAffiliationId, setSelectedAffiliationId] = useState<number | undefined>();
// //   const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | undefined>();
// //   const [selectedRegulationTypeId, setSelectedRegulationTypeId] = useState<number | undefined>();

// //   const {
// //     handleSubmit,
// //     control,
// //     formState: { errors },
// //     // watch,
// //     setValue,
// //   } = useForm<SubjectPaperMappingFormData>({
// //     resolver: zodResolver(subjectPaperMappingSchema),
// //     defaultValues: {
// //       subjectId: 0,
// //       affiliationId: 0,
// //       regulationTypeId: 0,
// //       academicYearId: 0,
// //       papers: [{
// //         subjectTypeId: 0,
// //         applicableCourses: [],
// //         semester: '',
// //         paperName: '',
// //         paperCode: '',
// //         isOptional: false,
// //         components: examComponents.map(component => ({
// //           examComponentId: component.id!,
// //           fullMarks: 0,
// //           credit: 0,
// //         })),
// //       }],
// //     },
// //   });

// //   // Use useFieldArray to properly manage the papers array
// //   const { fields, append, remove, update } = useFieldArray({
// //     control,
// //     name: 'papers',
// //   });

// //   // Update default values when data is loaded
// //   React.useEffect(() => {
// //     if (subjects.length > 0) {
// //       setValue('subjectId', subjects[0].id!);
// //     }
// //     if (affiliations.length > 0) {
// //       setValue('affiliationId', affiliations[0].id!);
// //     }
// //     if (regulationTypes.length > 0) {
// //       setValue('regulationTypeId', regulationTypes[0].id!);
// //     }
// //     if (academicYears.length > 0) {
// //       setValue('academicYearId', academicYears[0].id);
// //     }
// //   }, [subjects, affiliations, regulationTypes, academicYears, setValue]);

// //   // Memoize update functions to prevent unnecessary re-renders
// //   const updatePaperName = React.useCallback((paperIndex: number, value: string) => {
// //     const currentField = fields[paperIndex];
// //     if (currentField && currentField.paperName !== value) {
// //       update(paperIndex, { ...currentField, paperName: value });
// //     }
// //   }, [fields, update]);

// //   const updatePaperCode = React.useCallback((paperIndex: number, value: string) => {
// //     const currentField = fields[paperIndex];
// //     if (currentField && currentField.paperCode !== value) {
// //       update(paperIndex, { ...currentField, paperCode: value });
// //     }
// //   }, [fields, update]);

// //   const addPaperRow = () => {
// //     const newPaper: PaperRow = {
// //       subjectTypeId: 0,
// //       applicableCourses: [],
// //       semester: classes.length > 0 ? classes[0].name : '',
// //       paperName: '',
// //       paperCode: '',
// //       isOptional: false,
// //       components: examComponents.map(component => ({
// //         examComponentId: component.id!,
// //         fullMarks: 0,
// //         credit: 0,
// //       })),
// //     };

// //     append(newPaper);
// //   };

// //   const removePaperRow = (index: number) => {
// //     if (fields.length > 1) {
// //       remove(index);
// //     }
// //   };

// //   const updatePaperComponent = React.useCallback((paperIndex: number, componentIndex: number, field: 'fullMarks' | 'credit', value: number) => {
// //     const currentPaper = fields[paperIndex];
// //     if (currentPaper && currentPaper.components[componentIndex]) {
// //       const currentComponent = currentPaper.components[componentIndex];
// //       if (currentComponent[field] !== value) {
// //         const updatedComponents = [...currentPaper.components];
// //         updatedComponents[componentIndex] = { ...currentComponent, [field]: value };
        
// //         update(paperIndex, {
// //           ...currentPaper,
// //           components: updatedComponents,
// //         });
// //       }
// //     }
// //   }, [fields, update]);

// //   const handleFormSubmit = async (data: SubjectPaperMappingFormData) => {
// //     try {
// //       // Validate required fields
// //       if (!data.subjectId || !data.affiliationId || !data.regulationTypeId || !data.academicYearId) {
// //         toast.error('Please fill in all required fields (Subject, Affiliation, Regulation Type, Academic Year)');
// //         return;
// //       }

// //       // Validate papers data
// //       for (let i = 0; i <data.papers.length; i++) {
// //         const paper = data.papers[i];
// //         if (!paper.subjectTypeId || !paper.applicableCourses.length || !paper.semester || !paper.paperName || !paper.paperCode) {
// //           toast.error(`Please fill in all required fields for paper ${i + 1}`);
// //           return;
// //         }
// //       }

// //       if (editData) {
// //         // Handle edit mode - update existing subject paper
// //         // TODO: Implement update API call
// //         toast.success('Subject paper mapping updated successfully!');
// //       } else {
// //         // Handle create mode - check for duplicates first
// //         const checkData = {
// //           subjectId: data.subjectId,
// //           affiliationId: data.affiliationId,
// //           regulationTypeId: data.regulationTypeId,
// //           academicYearId: data.academicYearId,
// //           papers: data.papers.map(paper => ({
// //             code: paper.paperCode,
// //           })),
// //         };

// //         try {
// //           // Check for duplicates
// //           const duplicateCheck = await checkSubjectPaperDuplicate(checkData);
// //           const duplicateResult = duplicateCheck.data.payload;

// //           if (duplicateResult.isNewSubjectPaper) {
// //             // New subject paper mapping - proceed with creation
// //             console.log('Creating new subject paper mapping');
// //           } else if (duplicateResult.subjectPaperExists) {
// //             // Subject paper mapping exists, check for duplicate paper codes
// //             if (duplicateResult.duplicatePaperCodes.length > 0) {
// //               toast.error(
// //                 `The following paper codes already exist in this subject paper mapping: ${duplicateResult.duplicatePaperCodes.join(', ')}. Please use different paper codes.`
// //               );
// //               return;
// //             }
// //             // Subject paper exists but no duplicate paper codes - proceed with creation
// //             console.log('Adding papers to existing subject paper mapping');
// //           }

// //           // If no duplicates found, proceed with creation
// //           const apiData = {
// //             subjectId: data.subjectId,
// //             affiliationId: data.affiliationId,
// //             regulationTypeId: data.regulationTypeId,
// //             academicYearId: data.academicYearId,
// //             papers: data.papers.map(paper => ({
// //               subjectTypeId: paper.subjectTypeId,
// //               courseId: paper.applicableCourses[0], // Assuming single course selection
// //               classId: classes.find(cls => cls.name === paper.semester)?.id || 1, // Find class by semester name
// //               name: paper.paperName,
// //               code: paper.paperCode,
// //               isOptional: paper.isOptional,
// //               // Filter out components with 0 or null marks/credit
// //               components: paper.components.filter(component => 
// //                 component.fullMarks > 0 && component.credit > 0
// //               ),
// //             })),
// //           };

// //           console.log('Sending API data:', apiData);
// //           const result = await createSubjectPaperWithPapers(apiData);
// //           console.log('API response:', result);
          
// //           // The API response is wrapped in ApiResponse, so we need to access result.data.payload
// //           const responseData = result.data.payload;
// //           console.log('Response data:', responseData);
          
// //           if (responseData.isNewSubjectPaper) {
// //             toast.success('New subject paper mapping created successfully!');
// //           } else {
// //             toast.success('Papers added to existing subject paper mapping successfully!');
// //           }
          
// //           onSubmit(data);
// //         } catch (error: any) {
// //           console.error('Error checking for duplicates or creating subject paper mapping:', error);
// //           const errorMessage = error.response?.data?.message || error.message || 'Failed to create subject paper mapping';
// //           toast.error(errorMessage);
// //         }
// //       }
// //     } catch (error: any) {
// //       console.error('Error in form submission:', error);
// //       const errorMessage = error.response?.data?.message || error.message || 'Failed to process form submission';
// //       toast.error(errorMessage);
// //     }
// //   };

// //   console.log('Rendering form with subjectTypes:', subjectTypes);

// //   // Check if data is loaded
// //   const isDataLoaded = subjects.length > 0 || affiliations.length > 0 || regulationTypes.length > 0 || academicYears.length > 0;

// //   return (
// //     <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 overflow-hidden">
// //       {!isDataLoaded && (
// //         <div className="text-center py-4 text-muted-foreground">
// //           Loading dropdown data...
// //         </div>
// //       )}
// //       {/* Cascading dropdowns */}
// //       <CascadingDropdowns
// //         control={control}
// //         affiliations={affiliations}
// //         academicYears={academicYears}
// //         regulationTypes={regulationTypes}
// //         subjects={subjects}
// //         selectedAffiliationId={selectedAffiliationId}
// //         selectedAcademicYearId={selectedAcademicYearId}
// //         selectedRegulationTypeId={selectedRegulationTypeId}
// //         onAffiliationChange={setSelectedAffiliationId}
// //         onAcademicYearChange={setSelectedAcademicYearId}
// //         onRegulationTypeChange={setSelectedRegulationTypeId}
// //         onSubjectChange={() => {
// //           // Handle subject change if needed
// //         }}
// //         onAddPaper={isDataLoaded ? addPaperRow : undefined}
// //       />
      
// //       {/* Error messages for cascading dropdowns */}
// //       {errors.affiliationId && (
// //         <p className="text-sm text-red-500">{errors.affiliationId.message}</p>
// //       )}
// //       {errors.academicYearId && (
// //         <p className="text-sm text-red-500">{errors.academicYearId.message}</p>
// //       )}
// //       {errors.regulationTypeId && (
// //         <p className="text-sm text-red-500">{errors.regulationTypeId.message}</p>
// //       )}
// //       {errors.subjectId && (
// //         <p className="text-sm text-red-500">{errors.subjectId.message}</p>
// //       )}

// //       {/* Papers Table */}
// //       <div className="overflow-hidden">
// //         <div className="h-[calc(100vh-269px)] overflow-y-auto border border-black rounded-none">
// //           {/* Sticky Header */}
// //           <div className="sticky top-0 z-50 bg-white border-b border-black">
// //             {/* Main header row */}
// //             <div className="flex border-b border-black bg-[#f3f4f6]">
// //               <div className="w-32 p-2 border-r border-black font-medium flex items-center justify-center">Subject Type</div>
// //               <div className="w-48 p-2 border-r border-black font-medium flex items-center justify-center">Applicable Course</div>
// //               <div className="w-24 p-2 border-r border-black font-medium flex items-center justify-center">Semester</div>
// //               <div className="w-32 p-2 border-r border-black font-medium flex items-center justify-center">Paper Name</div>
// //               <div className="w-32 p-2 border-r border-black font-medium flex items-center justify-center">Paper Code</div>
// //               <div className="w-20 p-2 border-r border-black font-medium flex items-center justify-center">Is Optional</div>
// //               <div className="flex-1 p-2 border-r border-black font-medium flex items-center justify-center">Paper Component & Marks</div>
// //               <div className="w-20 p-2 font-medium flex items-center justify-center">Actions</div>
// //             </div>
            
// //             {/* Component headers row */}
// //             <div className="flex border-b border-black bg-[#f3f4f6]">
// //               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-48 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-24 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-20 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="flex-1 border-r border-black">
// //                 <div className="flex">
// //                   {examComponents.map((component) => (
// //                     <div key={component.id} className="flex-1 p-1 text-center text-sm border-r border-black flex items-center justify-center">
// //                       {component.code}
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //               <div className="w-20 flex items-center justify-center bg-[#f3f4f6]"></div>
// //             </div>
            
// //             {/* Marks/Credit headers row */}
// //             <div className="flex border-b border-black bg-[#f3f4f6]">
// //               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-48 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-24 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="w-20 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
// //               <div className="flex-1 border-r border-black">
// //                 <div className="flex">
// //                   {examComponents.map((component) => (
// //                     <React.Fragment key={component.id}>
// //                       <div className="flex-1 p-1 text-center text-xs border-r border-black flex items-center justify-center">Marks</div>
// //                       <div className="flex-1 p-1 text-center text-xs border-r border-black flex items-center justify-center">Credit</div>
// //                     </React.Fragment>
// //                   ))}
// //                 </div>  
// //               </div>
// //               <div className="w-20 flex items-center justify-center bg-[#f3f4f6]"></div>
// //             </div>
// //           </div>

// //           {/* Table Body */}
// //           <div className="bg-white">
// //             {fields.map((field, paperIndex) => (
// //               <div key={field.id} className="flex border-b border-black hover:bg-gray-50">
// //                 {/* Subject Type */}
// //                 <div className="w-32 p-2 border-r border-black flex items-center justify-center">
// //                   <Select
// //                     value={field.subjectTypeId.toString()}
// //                     onValueChange={(value) => {
// //                       update(paperIndex, { ...field, subjectTypeId: Number(value) });
// //                     }}
// //                   >
// //                     <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
// //                       <SelectValue placeholder="Select Type" />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       {subjectTypes.map((subjectType) => (
// //                         <SelectItem key={subjectType.id} value={subjectType.id!.toString()}>
// //                           {subjectType.code}
// //                         </SelectItem>
// //                       ))}
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 {/* Applicable Course */}
// //                 <div className="w-48 p-2 border-r border-black">
// //                   <Select
// //                     value={field.applicableCourses[0]?.toString() || ''}
// //                     onValueChange={(value) => {
// //                       update(paperIndex, { ...field, applicableCourses: [Number(value)] });
// //                     }}
// //                   >
// //                     <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
// //                       <SelectValue placeholder="Select Course" />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       {courses.map((course) => (
// //                         <SelectItem key={course.id} value={course.id.toString()}>
// //                           {course.name}
// //                         </SelectItem>
// //                       ))}
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 {/* Semester */}
// //                 <div className="w-24 p-2 border-r border-black flex items-center justify-center">
// //                   <Select
// //                     value={field.semester}
// //                     onValueChange={(value) => {
// //                       update(paperIndex, { ...field, semester: value });
// //                     }}
// //                   >
// //                     <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
// //                       <SelectValue placeholder="Select Semester" />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       {classes.map((classItem) => (
// //                         <SelectItem key={classItem.id} value={classItem.name}>
// //                           {classItem.name.split(' ')[1]}
// //                         </SelectItem>
// //                       ))}
// //                     </SelectContent>
// //                   </Select>
// //                 </div>

// //                 {/* Paper Name */}
// //                 <div className="w-32 p-2 border-r border-black flex items-center justify-center">
// //                   <Input
// //                     key={`paper-name-${field.id}-${paperIndex}`}
// //                     value={getInputValue(`paper-name-${field.id}-${paperIndex}`, field.paperName)}
// //                     onChange={(e) => {
// //                       const value = e.target.value;
// //                       updateInputValue(`paper-name-${field.id}-${paperIndex}`, value);
// //                       // Update form state after a small delay to prevent focus loss
// //                       setTimeout(() => {
// //                         update(paperIndex, { ...field, paperName: value });
// //                       }, 0);
// //                     }}
// //                     placeholder="Paper Name"
// //                     className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
// //                   />
// //                 </div>

// //                 {/* Paper Code */}
// //                 <div className="w-32 p-2 border-r border-black flex items-center justify-center">
// //                   <Input
// //                     key={`paper-code-${field.id}-${paperIndex}`}
// //                     value={getInputValue(`paper-code-${field.id}-${paperIndex}`, field.paperCode)}
// //                     onChange={(e) => {
// //                       const value = e.target.value;
// //                       updateInputValue(`paper-code-${field.id}-${paperIndex}`, value);
// //                       // Update form state after a small delay to prevent focus loss
// //                       setTimeout(() => {
// //                         update(paperIndex, { ...field, paperCode: value });
// //                       }, 0);
// //                     }}
// //                     placeholder="Paper Code"
// //                     className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
// //                   />
// //                 </div>

// //                 {/* Is Optional */}
// //                 <div className="w-20 p-2 border-r border-black flex items-center justify-center">
// //                   <Checkbox
// //                     checked={field.isOptional}
// //                     onCheckedChange={(checked) => {
// //                       update(paperIndex, { ...field, isOptional: checked as boolean });
// //                     }}
// //                   />
// //                 </div>

// //                 {/* Exam Components */}
// //                 <div className="flex-1 border-r border-black">
// //                   <div className="flex h-full">
// //                     {examComponents.map((examComponent) => {
// //                       const component = field.components.find(c => c.examComponentId === examComponent.id);
// //                       const componentIndex = field.components.findIndex(c => c.examComponentId === examComponent.id);
                      
// //                       const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //                         const value = e.target.value;
// //                         if (value === '' || /^\d+$/.test(value)) {
// //                           const numericValue = Number(value) || 0;
// //                           if (component?.fullMarks !== numericValue) {
// //                             updatePaperComponent(paperIndex, componentIndex, 'fullMarks', numericValue);
// //                           }
// //                         }
// //                       };

// //                       const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //                         const value = e.target.value;
// //                         if (value === '' || /^\d+$/.test(value)) {
// //                           const numericValue = Number(value) || 0;
// //                           if (component?.credit !== numericValue) {
// //                             updatePaperComponent(paperIndex, componentIndex, 'credit', numericValue);
// //                           }
// //                         }
// //                       };
                      
// //                       return (
// //                         <div key={examComponent.id} className='flex h-full'>
// //                           <div className="flex-1 p-1 border-r border-black h-full">
// //                             <Input
// //                               key={`marks-${field.id}-${paperIndex}-${examComponent.id}`}
// //                               type="text"
// //                               value={component?.fullMarks || 0}
// //                               onChange={handleMarksChange}
// //                               placeholder="0"
// //                               className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
// //                             />
// //                           </div>
// //                           <div className={`flex-1 p-1 border-r border-black h-full ${componentIndex === examComponents.length - 1 ? 'border-r-0' : ''}`}>
// //                             <Input
// //                               key={`credit-${field.id}-${paperIndex}-${examComponent.id}`}
// //                               type="text"
// //                               value={component?.credit || 0}
// //                               onChange={handleCreditChange}
// //                               placeholder="0"
// //                               className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
// //                             />
// //                           </div>
// //                         </div>
// //                       );
// //                     })}
// //                   </div>
// //                 </div>

// //                 {/* Actions */}
// //                 <div className="w-20 p-2 flex items-center justify-center">
// //                   <Button
// //                     type="button"
// //                     variant="ghost"
// //                     size="sm"
// //                     onClick={() => removePaperRow(paperIndex)}
// //                     disabled={fields.length <= 1}
// //                     className="h-8 w-8 p-0"
// //                   >
// //                     <Trash2 className="h-4 w-4" />
// //                   </Button>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Form validation errors */}
// //       {errors.papers && errors.papers.message && (
// //         <p className="text-sm text-red-500">{errors.papers.message}</p>
// //       )}

// //       {/* Form actions */}
// //       <div className="flex justify-end space-x-2 pt-4">
// //         <Button type="button" variant="outline" onClick={onCancel}>
// //           Cancel
// //         </Button>
// //         <Button type="submit" disabled={isLoading}>
// //           {isLoading ? 'Saving...' : 'Save Mapping'}
// //         </Button>
// //       </div>
// //     </form>
// //   );
// // };



















// import React, { useState } from 'react';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Checkbox } from '@/components/ui/checkbox';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Trash2 } from 'lucide-react';
// import { Subject, Affiliation, RegulationType, SubjectType, PaperWithDetails } from '@/types/course-design';
// import { createSubjectPaperWithPapers, checkSubjectPaperDuplicate } from '@/services/course-design.api';
// import { toast } from 'sonner';
// import { CascadingDropdowns } from './components/cascading-dropdowns';
// // import { AxiosError } from 'axios';

// interface ApiExamComponent {
//   id?: number;
//   name: string;
//   code: string;
//   description?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// const paperRowSchema = z.object({
//   subjectTypeId: z.number(),
//   applicableCourses: z.array(z.number()),
//   semester: z.string(),
//   paperName: z.string(),
//   paperCode: z.string(),
//   isOptional: z.boolean(),
//   components: z.array(z.object({
//     examComponentId: z.number(),
//     fullMarks: z.number(),
//     credit: z.number(),
//   })),
// });

// const subjectPaperMappingSchema = z.object({
//   subjectId: z.number(),
//   affiliationId: z.number(),
//   regulationTypeId: z.number(),
//   academicYearId: z.number(),
//   papers: z.array(paperRowSchema),
// });

// type SubjectPaperMappingFormData = z.infer<typeof subjectPaperMappingSchema>;
// type PaperRow = z.infer<typeof paperRowSchema>;

// interface SubjectPaperMappingFormProps {
//   onSubmit: (data: SubjectPaperMappingFormData) => void;
//   onCancel: () => void;
//   isLoading?: boolean;
//   subjects: Subject[];
//   affiliations: Affiliation[];
//   regulationTypes: RegulationType[];
//   subjectTypes: SubjectType[];
//   examComponents: ApiExamComponent[];
//   academicYears: { id: number; year: string; isActive?: boolean }[];
//   courses: { id: number; name: string; shortName?: string | null }[];
//   classes: { id: number; name: string; type: string }[];
//   editData?: PaperWithDetails;
// }

// export const SubjectPaperMappingForm: React.FC<SubjectPaperMappingFormProps> = ({
//   onSubmit,
//   onCancel,
//   isLoading = false,
//   subjects,
//   affiliations,
//   regulationTypes,
//   subjectTypes,
//   examComponents,
//   academicYears,
//   courses,
//   classes,
//   editData,
// }) => {
//   const [selectedAffiliationId, setSelectedAffiliationId] = useState<number | undefined>();
//   const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | undefined>();
//   const [selectedRegulationTypeId, setSelectedRegulationTypeId] = useState<number | undefined>();

//   const {
//     handleSubmit,
//     control,
//     formState: { errors },
//     // watch,
//     setValue,
//   } = useForm<SubjectPaperMappingFormData>({
//     resolver: zodResolver(subjectPaperMappingSchema),
//     defaultValues: {
//       subjectId: 0,
//       affiliationId: 0,
//       regulationTypeId: 0,
//       academicYearId: 0,
//       papers: [{
//         subjectTypeId: 0,
//         applicableCourses: [],
//         semester: '',
//         paperName: '',
//         paperCode: '',
//         isOptional: false,
//         components: examComponents.map(component => ({
//           examComponentId: component.id!,
//           fullMarks: 0,
//           credit: 0,
//         })),
//       }],
//     },
//   });

//   const { fields, append, remove, update } = useFieldArray({
//     control,
//     name: 'papers',
//   });

//   React.useEffect(() => {
//     if (subjects.length > 0) {
//       setValue('subjectId', subjects[0].id!);
//     }
//     if (affiliations.length > 0) {
//       setValue('affiliationId', affiliations[0].id!);
//     }
//     if (regulationTypes.length > 0) {
//       setValue('regulationTypeId', regulationTypes[0].id!);
//     }
//     if (academicYears.length > 0) {
//       setValue('academicYearId', academicYears[0].id);
//     }
//   }, [subjects, affiliations, regulationTypes, academicYears, setValue]);

//   const updatePaperComponent = React.useCallback((paperIndex: number, componentIndex: number, field: 'fullMarks' | 'credit', value: number) => {
//     const currentPaper = fields[paperIndex];
//     if (currentPaper && currentPaper.components[componentIndex]) {
//       const currentComponent = currentPaper.components[componentIndex];
//       if (currentComponent[field] !== value) {
//         const updatedComponents = [...currentPaper.components];
//         updatedComponents[componentIndex] = { ...currentComponent, [field]: value };
        
//         update(paperIndex, {
//           ...currentPaper,
//           components: updatedComponents,
//         });
//       }
//     }
//   }, [fields, update]);

//   const addPaperRow = () => {
//     const newPaper: PaperRow = {
//       subjectTypeId: 0,
//       applicableCourses: [],
//       semester: classes.length > 0 ? classes[0].name : '',
//       paperName: '',
//       paperCode: '',
//       isOptional: false,
//       components: examComponents.map(component => ({
//         examComponentId: component.id!,
//         fullMarks: 0,
//         credit: 0,
//       })),
//     };
//     append(newPaper);
//   };

//   const removePaperRow = (index: number) => {
//     if (fields.length > 1) {
//       remove(index);
//     }
//   };

//   const handleFormSubmit = async (data: SubjectPaperMappingFormData) => {
//     try {
//       if (!data.subjectId || !data.affiliationId || !data.regulationTypeId || !data.academicYearId) {
//         toast.error('Please fill in all required fields (Subject, Affiliation, Regulation Type, Academic Year)');
//         return;
//       }

//       for (let i = 0; i < data.papers.length; i++) {
//         const paper = data.papers[i];
//         if (!paper.subjectTypeId || !paper.applicableCourses.length || !paper.semester || !paper.paperName || !paper.paperCode) {
//           toast.error(`Please fill in all required fields for paper ${i + 1}`);
//           return;
//         }
//       }

//       if (editData) {
//         toast.success('Subject paper mapping updated successfully!');
//       } else {
//         const checkData = {
//           subjectId: data.subjectId,
//           affiliationId: data.affiliationId,
//           regulationTypeId: data.regulationTypeId,
//           academicYearId: data.academicYearId,
//           papers: data.papers.map(paper => ({
//             code: paper.paperCode,
//           })),
//         };

//         try {
//           const duplicateCheck = await checkSubjectPaperDuplicate(checkData);
//           const duplicateResult = duplicateCheck.data.payload;

//           if (duplicateResult.isNewSubjectPaper) {
//             console.log('Creating new subject paper mapping');
//           } else if (duplicateResult.subjectPaperExists) {
//             if (duplicateResult.duplicatePaperCodes.length > 0) {
//               toast.error(
//                 `The following paper codes already exist in this subject paper mapping: ${duplicateResult.duplicatePaperCodes.join(', ')}. Please use different paper codes.`
//               );
//               return;
//             }
//             console.log('Adding papers to existing subject paper mapping');
//           }

//           const apiData = {
//             subjectId: data.subjectId,
//             affiliationId: data.affiliationId,
//             regulationTypeId: data.regulationTypeId,
//             academicYearId: data.academicYearId,
//             papers: data.papers.map(paper => ({
//               subjectTypeId: paper.subjectTypeId,
//               courseId: paper.applicableCourses[0],
//               classId: classes.find(cls => cls.name === paper.semester)?.id || 1,
//               name: paper.paperName,
//               code: paper.paperCode,
//               isOptional: paper.isOptional,
//               components: paper.components.filter(component => 
//                 component.fullMarks > 0 && component.credit > 0
//               ),
//             })),
//           };

//           console.log('Sending API data:', apiData);
//           const result = await createSubjectPaperWithPapers(apiData);
//           console.log('API response:', result);
          
//           const responseData = result.data.payload;
//           console.log('Response data:', responseData);
          
//           if (responseData.isNewSubjectPaper) {
//             toast.success('New subject paper mapping created successfully!');
//           } else {
//             toast.success('Papers added to existing subject paper mapping successfully!');
//           }
          
//           onSubmit(data);
//         } catch {
//           // console.error('Error checking for duplicates or creating subject paper mapping:', error);
//           // const errorMessage = error.response?.data?.message || error.message || 'Failed to create subject paper mapping';
//           toast.error('Failed to create subject paper mapping');
//         }
//       }
//     } catch (error: unknown) {
//       console.error('Error in form submission:', error);
//       // const errorMessage = error.response?.data?.message || error.message || 'Failed to process form submission';
//       toast.error('Failed to process form submission');
//     }
//   };

//   const isDataLoaded = subjects.length > 0 || affiliations.length > 0 || regulationTypes.length > 0 || academicYears.length > 0;

//   return (
//     <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 overflow-hidden">
//       {!isDataLoaded && (
//         <div className="text-center py-4 text-muted-foreground">
//           Loading dropdown data...
//         </div>
//       )}
      
//       <CascadingDropdowns
//         control={control}
//         affiliations={affiliations}
//         academicYears={academicYears}
//         regulationTypes={regulationTypes}
//         subjects={subjects}
//         selectedAffiliationId={selectedAffiliationId}
//         selectedAcademicYearId={selectedAcademicYearId}
//         selectedRegulationTypeId={selectedRegulationTypeId}
//         onAffiliationChange={setSelectedAffiliationId}
//         onAcademicYearChange={setSelectedAcademicYearId}
//         onRegulationTypeChange={setSelectedRegulationTypeId}
//         onSubjectChange={() => {}}
//         onAddPaper={isDataLoaded ? addPaperRow : undefined}
//       />
      
//       {errors.affiliationId && <p className="text-sm text-red-500">{errors.affiliationId.message}</p>}
//       {errors.academicYearId && <p className="text-sm text-red-500">{errors.academicYearId.message}</p>}
//       {errors.regulationTypeId && <p className="text-sm text-red-500">{errors.regulationTypeId.message}</p>}
//       {errors.subjectId && <p className="text-sm text-red-500">{errors.subjectId.message}</p>}

//       <div className="overflow-hidden">
//         <div className="h-[calc(100vh-269px)] overflow-y-auto border border-black rounded-none">
//           <div className="sticky top-0 z-50 bg-white border-b border-black">
//             <div className="flex border-b border-black bg-[#f3f4f6]">
//               <div className="w-32 p-2 border-r border-black font-medium flex items-center justify-center">Subject Type</div>
//               <div className="w-48 p-2 border-r border-black font-medium flex items-center justify-center">Applicable Course</div>
//               <div className="w-24 p-2 border-r border-black font-medium flex items-center justify-center">Semester</div>
//               <div className="w-32 p-2 border-r border-black font-medium flex items-center justify-center">Paper Name</div>
//               <div className="w-32 p-2 border-r border-black font-medium flex items-center justify-center">Paper Code</div>
//               <div className="w-20 p-2 border-r border-black font-medium flex items-center justify-center">Is Optional</div>
//               <div className="flex-1 p-2 border-r border-black font-medium flex items-center justify-center">Paper Component & Marks</div>
//               <div className="w-20 p-2 font-medium flex items-center justify-center">Actions</div>
//             </div>
            
//             <div className="flex border-b border-black bg-[#f3f4f6]">
//               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-48 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-24 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-20 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="flex-1 border-r border-black">
//                 <div className="flex">
//                   {examComponents.map((component) => (
//                     <div key={component.id} className="flex-1 p-1 text-center text-sm border-r border-black flex items-center justify-center">
//                       {component.code}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div className="w-20 flex items-center justify-center bg-[#f3f4f6]"></div>
//             </div>
            
//             <div className="flex border-b border-black bg-[#f3f4f6]">
//               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-48 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-24 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-32 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="w-20 border-r border-black flex items-center justify-center bg-[#f3f4f6]"></div>
//               <div className="flex-1 border-r border-black">
//                 <div className="flex">
//                   {examComponents.map((component) => (
//                     <React.Fragment key={component.id}>
//                       <div className="flex-1 p-1 text-center text-xs border-r border-black flex items-center justify-center">Marks</div>
//                       <div className="flex-1 p-1 text-center text-xs border-r border-black flex items-center justify-center">Credit</div>
//                     </React.Fragment>
//                   ))}
//                 </div>  
//               </div>
//               <div className="w-20 flex items-center justify-center bg-[#f3f4f6]"></div>
//             </div>
//           </div>

//           <div className="bg-white">
//             {fields.map((field, paperIndex) => (
//               <div key={field.id} className="flex border-b border-black hover:bg-gray-50">
//                 <div className="w-32 p-2 border-r border-black flex items-center justify-center">
//                   <Select
//                     value={field.subjectTypeId.toString()}
//                     onValueChange={(value) => {
//                       update(paperIndex, { ...field, subjectTypeId: Number(value) });
//                     }}
//                   >
//                     <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
//                       <SelectValue placeholder="Select Type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {subjectTypes.map((subjectType) => (
//                         <SelectItem key={subjectType.id} value={subjectType.id!.toString()}>
//                           {subjectType.code}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="w-48 p-2 border-r border-black">
//                   <Select
//                     value={field.applicableCourses[0]?.toString() || ''}
//                     onValueChange={(value) => {
//                       update(paperIndex, { ...field, applicableCourses: [Number(value)] });
//                     }}
//                   >
//                     <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
//                       <SelectValue placeholder="Select Course" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {courses.map((course) => (
//                         <SelectItem key={course.id} value={course.id.toString()}>
//                           {course.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="w-24 p-2 border-r border-black flex items-center justify-center">
//                   <Select
//                     value={field.semester}
//                     onValueChange={(value) => {
//                       update(paperIndex, { ...field, semester: value });
//                     }}
//                   >
//                     <SelectTrigger className="w-full border-0 p-1 h-8 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
//                       <SelectValue placeholder="Select Semester" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {classes.map((classItem) => (
//                         <SelectItem key={classItem.id} value={classItem.name}>
//                           {classItem.name.split(' ')[1]}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="w-32 p-2 border-r border-black flex items-center justify-center">
//                   <Input
//                     value={field.paperName}
//                     onChange={(e) => {
//                       update(paperIndex, { ...field, paperName: e.target.value });
//                     }}
//                     placeholder="Paper Name"
//                     className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div className="w-32 p-2 border-r border-black flex items-center justify-center">
//                   <Input
//                     value={field.paperCode}
//                     onChange={(e) => {
//                       update(paperIndex, { ...field, paperCode: e.target.value });
//                     }}
//                     placeholder="Paper Code"
//                     className="w-full border-0 p-1 h-8 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div className="w-20 p-2 border-r border-black flex items-center justify-center">
//                   <Checkbox
//                     checked={field.isOptional}
//                     onCheckedChange={(checked) => {
//                       update(paperIndex, { ...field, isOptional: checked as boolean });
//                     }}
//                   />
//                 </div>

//                 <div className="flex-1 border-r border-black">
//                   <div className="flex h-full">
//                     {examComponents.map((examComponent) => {
//                       const component = field.components.find(c => c.examComponentId === examComponent.id);
//                       const componentIndex = field.components.findIndex(c => c.examComponentId === examComponent.id);
                      
//                       const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//                         const value = e.target.value;
//                         if (value === '' || /^\d+$/.test(value)) {
//                           const numericValue = Number(value) || 0;
//                           if (component?.fullMarks !== numericValue) {
//                             updatePaperComponent(paperIndex, componentIndex, 'fullMarks', numericValue);
//                           }
//                         }
//                       };

//                       const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//                         const value = e.target.value;
//                         if (value === '' || /^\d+$/.test(value)) {
//                           const numericValue = Number(value) || 0;
//                           if (component?.credit !== numericValue) {
//                             updatePaperComponent(paperIndex, componentIndex, 'credit', numericValue);
//                           }
//                         }
//                       };
                      
//                       return (
//                         <div key={examComponent.id} className='flex h-full'>
//                           <div className="flex-1 p-1 border-r border-black h-full">
//                             <Input
//                               type="text"
//                               value={component?.fullMarks || 0}
//                               onChange={handleMarksChange}
//                               placeholder="0"
//                               className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
//                             />
//                           </div>
//                           <div className={`flex-1 p-1 border-r border-black h-full ${componentIndex === examComponents.length - 1 ? 'border-r-0' : ''}`}>
//                             <Input
//                               type="text"
//                               value={component?.credit || 0}
//                               onChange={handleCreditChange}
//                               placeholder="0"
//                               className="w-full h-full text-center border-0 p-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
//                             />
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 <div className="w-20 p-2 flex items-center justify-center">
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => removePaperRow(paperIndex)}
//                     disabled={fields.length <= 1}
//                     className="h-8 w-8 p-0"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {errors.papers && errors.papers.message && (
//         <p className="text-sm text-red-500">{errors.papers.message}</p>
//       )}

//       <div className="flex justify-end space-x-2 pt-4">
//         <Button type="button" variant="outline" onClick={onCancel}>
//           Cancel
//         </Button>
//         <Button type="submit" disabled={isLoading}>
//           {isLoading ? 'Saving...' : 'Save Mapping'}
//         </Button>
//       </div>
//     </form>
//   );
// };



// import React from 'react'

export default function SPForm() {
  return (
    <div>SPForm</div>
  )
}

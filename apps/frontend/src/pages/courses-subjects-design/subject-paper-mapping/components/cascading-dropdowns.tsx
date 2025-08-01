// import React from 'react';
// import { Controller, Control } from 'react-hook-form';
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import { Plus } from 'lucide-react';
// import { Affiliation, RegulationType, Subject } from '@/types/course-design';
// // import { 
// //   getAcademicYearsByAffiliation,
// //   getRegulationTypesByAffiliationAndAcademicYear,
// //   getSubjectsByAffiliationAcademicYearAndRegulation
// // } from '@/services/cascading-dropdowns.api';
// // import { useAuth } from '@/hooks/useAuth';

// // Types for cascading dropdowns
// interface CascadingDropdownsProps {
//   control: Control<any>;
//   affiliations: Affiliation[];
//   academicYears: { id: number; year: string; isActive?: boolean }[];
//   regulationTypes: RegulationType[];
//   subjects: Subject[];
//   selectedAffiliationId?: number;
//   selectedAcademicYearId?: number;
//   selectedRegulationTypeId?: number;
//   onAffiliationChange: (affiliationId: number) => void;
//   onAcademicYearChange: (academicYearId: number) => void;
//   onRegulationTypeChange: (regulationTypeId: number) => void;
//   onSubjectChange: (subjectId: number) => void;
//   onAddPaper?: () => void;
// }

// // Affiliation Dropdown Component
// export const AffiliationDropdown: React.FC<{
//   control: Control<any>;
//   affiliations: Affiliation[];
//   onAffiliationChange: (affiliationId: number) => void;
// }> = ({ control, affiliations, onAffiliationChange }) => {
//   console.log('AffiliationDropdown received affiliations:', affiliations);
//   return (
//     <div className="space-y-2">
//       <Label htmlFor="affiliationId">Affiliation</Label>
//       <Controller
//         name="affiliationId"
//         control={control}
//         render={({ field }) => (
//           <Select 
//             value={field.value ? field.value.toString() : ''} 
//             onValueChange={(value) => {
//               const affiliationId = Number(value);
//               field.onChange(affiliationId);
//               onAffiliationChange(affiliationId);
//             }}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select affiliation" />
//             </SelectTrigger>
//             <SelectContent>
//               {affiliations && affiliations.length > 0 ? (
//                 affiliations.map((affiliation) => (
//                   <SelectItem key={affiliation.id} value={affiliation.id?.toString() || ''}>
//                     {affiliation.name}
//                   </SelectItem>
//                 ))
//               ) : null}
//             </SelectContent>
//           </Select>
//         )}
//       />
//     </div>
//   );
// };

// // Academic Year Dropdown Component
// export const AcademicYearDropdown: React.FC<{
//   control: Control<any>;
//   academicYears: { id: number; year: string; isActive?: boolean }[];
//   onAcademicYearChange: (academicYearId: number) => void;
// }> = ({ control, academicYears, onAcademicYearChange }) => {
//   console.log('AcademicYearDropdown received academicYears:', academicYears);

//   return (
//     <div className="space-y-2">
//       <Label htmlFor="academicYearId">Academic Year</Label>
//       <Controller
//         name="academicYearId"
//         control={control}
//         render={({ field }) => (
//           <Select 
//             value={field.value ? field.value.toString() : ''} 
//             onValueChange={(value) => {
//               const academicYearId = Number(value);
//               field.onChange(academicYearId);
//               onAcademicYearChange(academicYearId);
//             }}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select academic year" />
//             </SelectTrigger>
//             <SelectContent>
//               {academicYears && academicYears.length > 0 ? (
//                 academicYears.map((academicYear) => (
//                   <SelectItem key={academicYear.id} value={academicYear.id.toString()}>
//                     {academicYear.year}
//                   </SelectItem>
//                 ))
//               ) : null}
//             </SelectContent>
//           </Select>
//         )}
//       />
//     </div>
//   );
// };

// // Regulation Type Dropdown Component
// export const RegulationTypeDropdown: React.FC<{
//   control: Control<any>;
//   regulationTypes: RegulationType[];
//   onRegulationTypeChange: (regulationTypeId: number) => void;
// }> = ({ control, regulationTypes, onRegulationTypeChange }) => {
//   console.log('RegulationTypeDropdown received regulationTypes:', regulationTypes);

//   return (
//     <div className="space-y-2">
//       <Label htmlFor="regulationTypeId">Regulation Type</Label>
//       <Controller
//         name="regulationTypeId"
//         control={control}
//         render={({ field }) => (
//           <Select 
//             value={field.value ? field.value.toString() : ''} 
//             onValueChange={(value) => {
//               const regulationTypeId = Number(value);
//               field.onChange(regulationTypeId);
//               onRegulationTypeChange(regulationTypeId);
//             }}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select regulation type" />
//             </SelectTrigger>
//             <SelectContent>
//               {regulationTypes && regulationTypes.length > 0 ? (
//                 regulationTypes.map((regulationType) => (
//                   <SelectItem key={regulationType.id} value={regulationType.id?.toString() || ''}>
//                     {regulationType.name}
//                   </SelectItem>
//                 ))
//               ) : null}
//             </SelectContent>
//           </Select>
//         )}
//       />
//     </div>
//   );
// };

// // Subject Dropdown Component
// export const SubjectDropdown: React.FC<{
//   control: Control<any>;
//   subjects: Subject[];
//   onSubjectChange: (subjectId: number) => void;
// }> = ({ control, subjects, onSubjectChange }) => {
//   console.log('SubjectDropdown received subjects:', subjects);

//   return (
//     <div className="space-y-2">
//       <Label htmlFor="subjectId">Subject</Label>
//       <Controller
//         name="subjectId"
//         control={control}
//         render={({ field }) => (
//           <Select 
//             value={field.value ? field.value.toString() : ''} 
//             onValueChange={(value) => {
//               const subjectId = Number(value);
//               field.onChange(subjectId);
//               onSubjectChange(subjectId);
//             }}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select subject" />
//             </SelectTrigger>
//             <SelectContent>
//               {subjects && subjects.length > 0 ? (
//                 subjects.map((subject) => (
//                   <SelectItem key={subject.id} value={subject.id?.toString() || ''}>
//                     {subject.name}
//                   </SelectItem>
//                 ))
//               ) : null}
//             </SelectContent>
//           </Select>
//         )}
//       />
//     </div>
//   );
// };

// // Main Cascading Dropdowns Component - Now Non-Cascading
// export const CascadingDropdowns: React.FC<CascadingDropdownsProps> = ({
//   control,
//   affiliations,
//   academicYears,
//   regulationTypes,
//   subjects,
//   // selectedAffiliationId,
//   // selectedAcademicYearId,
//   // selectedRegulationTypeId,
//   onAffiliationChange,
//   onAcademicYearChange,
//   onRegulationTypeChange,
//   onSubjectChange,
//   onAddPaper,
// }) => {
//   console.log('CascadingDropdowns received subjects:', subjects);
//   console.log('CascadingDropdowns received affiliations:', affiliations);
//   console.log('CascadingDropdowns received regulationTypes:', regulationTypes);
//   console.log('CascadingDropdowns received academicYears:', academicYears);
//   return (
//     <div className="flex gap-4 items-end">
//       <div className="flex-1">
//         <SubjectDropdown
//           control={control}
//           subjects={subjects}
//           onSubjectChange={onSubjectChange}
//         />
//       </div>

//       <div className="flex-1">
//         <AffiliationDropdown
//           control={control}
//           affiliations={affiliations}
//           onAffiliationChange={onAffiliationChange}
//         />
//       </div>

//       <div className="flex-1">
//         <RegulationTypeDropdown
//           control={control}
//           regulationTypes={regulationTypes}
//           onRegulationTypeChange={onRegulationTypeChange}
//         />
//       </div>

//       <div className="flex-1">
//         <AcademicYearDropdown
//           control={control}
//           academicYears={academicYears}
//           onAcademicYearChange={onAcademicYearChange}
//         />
//       </div>

//       {onAddPaper && (
//         <div className="flex-shrink-0">
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={onAddPaper}
//             className="flex items-center gap-2"
//           >
//             <Plus className="h-4 w-4" />
//             Add Paper
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// }; 



// // import React from 'react'

export default function CascadingDropdowns() {
  return (
    <div></div>
  )
}

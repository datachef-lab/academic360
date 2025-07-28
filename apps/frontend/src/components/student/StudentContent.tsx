
import AcademicHistory from "./AcademicHistoryForm";
import AcademicIdentifier from "./AcademicIdentifierForm";
import Accommodation from "./AccommodationForm";
import EmergencyContact from "./EmergencyContactForm";
import HealthDetails from "./HealthDetails";
import OverviewTab from "./OverviewTab";
import TransportDetails from "./TransportDetails";
import FamilyDetails from "./FamilyDetails";
import Marksheet from "../GradeMarks/Marksheet";
import PersonalDetails from "./PersonalDetails";
import { TabsContent } from "../ui/tabs";

type StudentContentProps = {
  studentId: number;
  activeTab: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
};

export default function StudentContent({ activeTab, studentId }: StudentContentProps) {
  const handleContent = () => {
    switch (activeTab.label) {
      case "Overview":
        return <OverviewTab />;
      case "Personal":
        return <PersonalDetails studentId={studentId}/>;  
      case "Family":
        return <FamilyDetails studentId={studentId} />;
      case "Health":
        return <HealthDetails studentId={studentId} />;
      case "Emergency":
        return <EmergencyContact studentId={studentId} />;
      case "History":
        return <AcademicHistory studentId={studentId} />;
      case "Identifiers":
        return <AcademicIdentifier studentId={studentId} onSubmit={() => {}} />;
      case "Accommodation":
        return <Accommodation studentId={studentId} />;
      case "Transport":
        return <TransportDetails />;
      case "Marksheet":
        return <Marksheet />;
      default:
        return <p>No Content!</p>;
    }
  };

  return (
      <TabsContent value={activeTab.label}>
        <div className="my-5">{handleContent()}</div>
      </TabsContent>
  )
}

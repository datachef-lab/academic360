import AcademicHistory from "./AcademicHistoryForm";
import AcademicIdentifier from "./AcademicIdentifierForm";
import Accommodation from "./AccommodationForm";
import EmergencyContact from "./EmergencyContactForm";
import HealthDetails from "./HealthDetails";
import OverviewTab from "./OverviewTab";
import PersonalDetails from "./PersonalDetails";
import TransportDetails from "./TransportDetails";
import FamilyDetails from "./FamilyDetails";

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
      case "Personal Details":
        return <PersonalDetails studentId={studentId} />;
      case "Family Details":
        return <FamilyDetails studentId={studentId} />;
      case "Health Details":
        return <HealthDetails studentId={studentId} />;
      case "Emergency Contact":
        return <EmergencyContact studentId={studentId} />;
      case "Academic History":
        return <AcademicHistory />;
      case "Academic Identifiers":
        return <AcademicIdentifier />;
      case "Accommodation":
        return <Accommodation />;
      case "Transport Details":
        return <TransportDetails />;
      default:
        return <p>No Content!</p>;
    }
  };

  return <div className="my-5">{handleContent()}</div>;
}

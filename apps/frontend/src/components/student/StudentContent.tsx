import AcademicHistory from "./AcademicHistory";
import AcademicIdentifier from "./AcademicIdentifier";
import Accommodation from "./Accommodation";
import EmergencyContact from "./EmergencyContact";
import GuardianDetails from "./GuardianDetails";
import HealthDetails from "./HealthDetails";
import OverviewTab from "./OverviewTab";
import ParentDetails from "./ParentDetails";
import PersonalDetails from "./PersonalDetails";
import TransportDetails from "./TransportDetails";

type StudentContentProps = {
  activeTab: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
};

export default function StudentContent({ activeTab }: StudentContentProps) {
  const handleContent = () => {
    switch (activeTab.label) {
      case "Overview":
        return <OverviewTab />;
      case "Personal Details":
        return <PersonalDetails />;
      case "Parent Details":
        return <ParentDetails />;
      case "Guardian Details":
        return <GuardianDetails />;
      case "Health Details":
        return <HealthDetails />;
      case "Emergency Contact":
        return <EmergencyContact />;
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

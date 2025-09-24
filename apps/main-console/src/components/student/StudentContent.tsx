// import AcademicHistory from "./AcademicHistoryForm";
// import AcademicIdentifier from "./AcademicIdentifierForm";
import Accommodation from "./AccommodationForm";
import EmergencyContact from "./EmergencyContactForm";
import HealthDetails from "./HealthDetails";
import OverviewTab from "./OverviewTab";
import FamilyDetails from "./FamilyDetails";
import Marksheet from "../GradeMarks/Marksheet";
import AcademicDetails from "./AcademicDetails";
import PersonalDetailsReadOnly from "./PersonalDetails";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "@/services/student";
import { TabsContent } from "../ui/tabs";

type StudentContentProps = {
  studentId: number;
  userId?: number;
  personalEmail?: string | null;
  activeTab: {
    label: string;
    icon: JSX.Element;
    endpoint: string;
  };
};

export default function StudentContent({ activeTab, studentId, userId, personalEmail }: StudentContentProps) {
  const { data: profile } = useQuery({
    queryKey: ["user-profile", userId || studentId],
    queryFn: async () => {
      const idToUse = userId || studentId;
      if (!idToUse) return undefined;
      return fetchUserProfile(idToUse);
    },
    enabled: (userId || studentId) > 0,
  });
  const handleContent = () => {
    switch (activeTab.label) {
      case "Overview":
        return <OverviewTab />;
      case "Personal":
        // Prefer profile API payload when available; it contains personalDetails
        return (
          <PersonalDetailsReadOnly
            studentId={studentId}
            initialData={profile?.personalDetails ?? null}
            personalEmail={personalEmail ?? null}
          />
        );
      case "Family":
        return <FamilyDetails studentId={studentId} initialData={profile?.familyDetails ?? null} />;
      case "Health":
        return (
          <HealthDetails
            healthId={profile?.healthDetails?.id ?? undefined}
            initialData={profile?.healthDetails ?? null}
          />
        );
      case "Emergency":
        return (
          <EmergencyContact
            emergencyId={profile?.emergencyContactDetails?.id ?? undefined}
            initialData={profile?.emergencyContactDetails ?? null}
          />
        );

      case "Accommodation":
        return (
          <Accommodation
            accommodationId={profile?.accommodationDetails?.id ?? undefined}
            initialData={profile?.accommodationDetails ?? null}
          />
        );
      case "Academic":
        return (
          <AcademicDetails
            applicationAcademicInfo={profile?.applicationFormDto?.academicInfo ?? null}
            studentId={studentId}
            userId={userId}
          />
        );
      case "Marksheet":
        return <Marksheet />;
      default:
        return <p>No Content!</p>;
    }
  };

  return (
    <TabsContent value={activeTab.label}>
      <div className="my-5 h-full overflow-auto pb-10">{handleContent()}</div>
    </TabsContent>
  );
}

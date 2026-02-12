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
import type { AddressDto, FamilyDto, PersonDto, PersonalDetailsDto } from "@repo/db/dtos";

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
  // Shape helpers to adapt Profile API payload to UI components' expected props (no "any")
  const getShapedPersonalDetails = ():
    | (PersonalDetailsDto & {
        residentialAddress?: AddressDto;
        mailingAddress?: AddressDto;
      })
    | null => {
    const pd = profile?.personalDetails as PersonalDetailsDto | undefined;
    if (!pd) return null;
    const addresses = (pd.address ?? []).filter(Boolean) as AddressDto[];
    const residential = addresses.find((a) => a.type === "RESIDENTIAL");
    const mailing = addresses.find((a) => a.type === "MAILING");
    return {
      ...pd,
      residentialAddress: residential,
      mailingAddress: mailing,
      // Ensure userDetails is preserved
      userDetails: pd.userDetails,
    };
  };

  const getShapedFamilyDetails = ():
    | (FamilyDto & {
        father?: PersonDto;
        mother?: PersonDto;
        guardian?: PersonDto;
      })
    | null => {
    const fam = profile?.studentFamily as FamilyDto | undefined;
    if (!fam) return null;
    const members = (fam.members ?? []).filter(Boolean) as PersonDto[];
    const father = members.find((m) => m.type === "FATHER");
    const mother = members.find((m) => m.type === "MOTHER");
    const guardian = members.find((m) => m.type === "GUARDIAN");
    return {
      ...fam,
      father,
      mother,
      guardian,
    };
  };
  const handleContent = () => {
    switch (activeTab.label) {
      case "Overview":
        return <OverviewTab studentId={studentId} userId={userId} />;
      case "Personal":
        // Prefer profile API payload when available; it contains personalDetails
        return (
          <PersonalDetailsReadOnly
            studentId={studentId}
            initialData={getShapedPersonalDetails()}
            personalEmail={personalEmail ?? null}
          />
        );
      case "Family":
        return <FamilyDetails studentId={studentId} initialData={getShapedFamilyDetails()} />;
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
            studentAcademicDetails={profile?.academicInfo ?? null}
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
      <div className="my-3 sm:my-5 h-full overflow-auto pb-6 sm:pb-10">{handleContent()}</div>
    </TabsContent>
  );
}

import UnderConstructionPage from "@/pages/under-construction-page";

/**
 * Document Issuance landing screen.
 *
 * The student search / issuance flow is still mock-data backed, so the home
 * screen reuses the shared under-construction page instead. The working screens
 * in this module are reachable from the right-hand nav (Certificate Type,
 * Certificate Fields, Declaration Masters).
 */
const DocumentIssuanceHomePage = () => {
  return (
    <UnderConstructionPage
      title="Document Issuance is under construction"
      description="This module is being built. In the meantime you can manage its masters from the panel on the right — Certificate Type, Certificate Fields and Declaration Masters are live."
    />
  );
};

export default DocumentIssuanceHomePage;

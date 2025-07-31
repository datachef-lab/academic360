const BASE = '/api/course-design/cascading-dropdowns';

// Get available affiliations
export const getAvailableAffiliations = async (accessToken: string) => {
  
  const response = await fetch(`${BASE}/affiliations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Get academic years by affiliation
export const getAcademicYearsByAffiliation = async (affiliationId: number, accessToken: string) => {
  
  const response = await fetch(`${BASE}/academic-years/${affiliationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Get regulation types by affiliation and academic year
export const getRegulationTypesByAffiliationAndAcademicYear = async (affiliationId: number, academicYearId: number, accessToken: string) => {
  
  const response = await fetch(`${BASE}/regulation-types/${affiliationId}/${academicYearId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
};

// Get subjects by affiliation, academic year, and regulation type
export const getSubjectsByAffiliationAcademicYearAndRegulation = async (
  affiliationId: number, 
  academicYearId: number, 
  regulationTypeId: number,
  accessToken: string
) => {
  
  const response = await fetch(`${BASE}/subjects/${affiliationId}/${academicYearId}/${regulationTypeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}; 
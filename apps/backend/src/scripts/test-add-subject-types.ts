import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const testAddSubjectTypes = async () => {
  try {
    console.log('Testing subject types API...');
    
    // First, let's check if there are any existing subject types
    const getResponse = await axios.get(`${BASE_URL}/api/course-design/subject-types`);
    console.log('GET response:', getResponse.data);
    
    // Add some test subject types
    const subjectTypes = [
      {
        name: 'Theory',
        code: 'TH',
        sequence: 1,
        disabled: false,
      },
      {
        name: 'Practical',
        code: 'PR',
        sequence: 2,
        disabled: false,
      },
      {
        name: 'Project',
        code: 'PJ',
        sequence: 3,
        disabled: false,
      },
    ];

    for (const subjectType of subjectTypes) {
      console.log(`Adding subject type: ${subjectType.name}`);
      const postResponse = await axios.post(`${BASE_URL}/api/course-design/subject-types`, subjectType);
      console.log('POST response:', postResponse.data);
    }

    // Check again to see if they were added
    const finalGetResponse = await axios.get(`${BASE_URL}/api/course-design/subject-types`);
    console.log('Final GET response:', finalGetResponse.data);
    
  } catch (error: unknown) {
    // console.error('Error:', (error instanceof Error).response?.data || error.message);
    console.log(error)
  }
};

testAddSubjectTypes(); 
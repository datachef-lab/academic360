import { db } from "@/db";
import { subjectTypeModel } from "../features/course-design/models/subject-type.model";

const seedSubjectTypes = async () => {
  try {
    console.log('Seeding subject types...');
    
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
      {
        name: 'Viva',
        code: 'VV',
        sequence: 4,
        disabled: false,
      },
      {
        name: 'Assignment',
        code: 'AS',
        sequence: 5,
        disabled: false,
      },
    ];

    for (const subjectType of subjectTypes) {
      await db.insert(subjectTypeModel).values(subjectType);
      console.log(`Added subject type: ${subjectType.name}`);
    }

    console.log('Subject types seeded successfully!');
  } catch (error) {
    console.error('Error seeding subject types:', error);
  }
};

// Run the seed function
seedSubjectTypes().then(() => {
  console.log('Seeding completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
}); 
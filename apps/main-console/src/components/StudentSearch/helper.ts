// import { Student } from "@/types/user/student";
// import { StudentSearchType } from "../tables/users/student-search-column";
// import { Religion } from "@/types/resources/religion";
// import { Category } from "@/types/resources/category";
// import { Specialization } from "@/types/resources/specialization";

// export function formattedStudent(content: Student[]) {
//     const formattedArr: StudentSearchType[] = [];
//     for (let i = 0; i < content.length; i++) {
//         const { academicIdentifier, personalDetails, specialization, ...props } = content[i];

//         let obj: StudentSearchType = {
//             ...props,
//             registrationNumber: null,
//             rollNumber: null,
//             uid: null,
//             nationality: null,
//             gender: null,
//             religion: null,
//             category: null,
//             stream: null,
//             specialization: null,
//         };

//         if (academicIdentifier) {
//             const { registrationNumber, rollNumber, uid, stream } = academicIdentifier;
//             obj = { ...obj, registrationNumber, rollNumber, uid, stream };
//         }

//         if (personalDetails) {
//             const { religion, gender, category } = personalDetails;
//             obj = { ...obj, religion: religion as Religion, gender, category: category as Category };
//         }

//         if (specialization) {
//             obj = { ...obj, specialization: specialization as Specialization };
//         }

//         formattedArr.push(obj);
//     }

//     return formattedArr;
// }

import { Student } from "@/types/user/student";
import { StudentSearchType } from "../tables/users/student-search-column";
import { Religion } from "@/types/resources/religion.types";
import { Category } from "@/types/resources/category.types";
import { Specialization } from "@/types/resources/specialization";

export function formattedStudent(content: Student[]) {
    const formattedArr: StudentSearchType[] = [];
    const profileBaseUrl = import.meta.env.VITE_STUDENT_PROFILE_URL || 'https://74.207.233.48:8443/hrclIRP/studentimages';
    
    //console.log("Profile base URL being used:", profileBaseUrl);

    for (let i = 0; i < content.length; i++) {
        const { academicIdentifier, personalDetails, specialization, ...props } = content[i];

        let obj: StudentSearchType = {
            ...props,
            registrationNumber: null,
            rollNumber: null,
            uid: null,
            nationality: null,
            gender: null,
            religion: null,
            category: null,
            // stream: null,
            specialization: null,
            avatar: undefined,
        };

        if (academicIdentifier) {
            const { registrationNumber, rollNumber, uid } = academicIdentifier;
            obj = { ...obj, registrationNumber, rollNumber, uid };
        }

        if (personalDetails) {
            const { religion, gender, category } = personalDetails;
            obj = { ...obj, religion: religion as Religion, gender, category: category as Category };
        }

        if (specialization) {
            obj = { ...obj, specialization: specialization as Specialization };
        }

        if (obj.uid) {
            const avatarUrl = `${profileBaseUrl}/Student_Image_${obj.uid}.jpg`;
            obj.avatar = avatarUrl;
            //console.log(`Generated avatar URL for student ${props.name} (UID: ${obj.uid}):`, avatarUrl);
        } else if (props.id) {
            const avatarUrl = `${profileBaseUrl}/Student_Image_${props.id}.jpg`;
            obj.avatar = avatarUrl;
            //console.log(`Generated avatar URL for student ${props.name} (ID: ${props.id}):`, avatarUrl);
        } else {
            obj.avatar = `${profileBaseUrl}/default.jpg`;
            //console.log(`Using default avatar for student ${props.name} (no ID or UID)`);
        }

        formattedArr.push(obj);
    }

    return formattedArr;
}
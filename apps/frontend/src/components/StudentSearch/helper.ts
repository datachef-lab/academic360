import { Student } from "@/types/user/student";
import { StudentSearchType } from "../tables/users/student-search-column";
import { Religion } from "@/types/resources/religion";
import { Category } from "@/types/resources/category";
import { Specialization } from "@/types/resources/specialization";

export function formattedStudent(content: Student[]) {
    const formattedArr: StudentSearchType[] = [];
    for (let i = 0; i < content.length; i++) {
        const { academicIdentifier, personalDetails, specialization, ...props } = content[i];
        console.log(academicIdentifier?.rollNumber);
        let obj: StudentSearchType = {
            ...props,
            registrationNumber: null,
            rollNumber: academicIdentifier?.rollNumber ? academicIdentifier?.rollNumber : null,
            uid: null,
            nationality: null,
            gender: null,
            religion: null,
            category: null,
            stream: null,
            specialization: null,
        };

        if (academicIdentifier) {
            const { registrationNumber, uid, stream } = academicIdentifier;
            obj = {
                ...obj,
                registrationNumber,
                rollNumber: academicIdentifier?.rollNumber ? academicIdentifier?.rollNumber : null,
                uid,
                stream
            };
        }

        if (personalDetails) {
            const { religion, gender, category } = personalDetails;
            obj = { ...obj, religion: religion as Religion, gender, category: category as Category };
        }

        if (specialization) {
            obj = { ...obj, specialization: specialization as Specialization };
        }

        formattedArr.push(obj);
    }

    return formattedArr;
}
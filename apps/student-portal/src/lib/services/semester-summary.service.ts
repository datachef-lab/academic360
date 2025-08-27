import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MarksheetSummary } from "@/types/academics/marksheet-summary";

export async function getSemesterSummary(uid: string) {
    console.log("process.env.ACADEMIC_360_URL", process.env.ACADEMIC_360_URL);
    console.log("uid", uid);
    try {
        const response = await fetch(`http://13.235.168.107:5000/api/marksheets/summary?uid=${uid}`);
        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        let summary = data.payload as MarksheetSummary[];
        summary = summary.map(item => {
            if (item.year2 === null) {
                item.result = "FAILED";
            }
            else {
                item.result = "PASSED";
            }

            return item;
        })

        return summary;

    } catch (error) {
        console.log(error);
        return null;
    }
}
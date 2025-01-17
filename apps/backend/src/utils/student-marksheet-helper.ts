import { ExcelRow } from "@/types/excel-row.ts";

export type Stream = {
    id: number;
    name: string;
    level: "UNDER_GRADUATE" | "POST_GRADUATE";
    duration: number;
    numberOfSemesters: number;
};

export function sortData(arr: ExcelRow[] = [], streams: Stream[]) {
    let sortedArr: ExcelRow[] = [];
    for (let y = 2017; y <= new Date().getFullYear(); y++) {
        for (let s = 0; s < streams.length; s++) {
            for (let sem = 1; sem <= 6; sem++) {
                let tmpArr = [];
                if (streams[s].name == "BCOM") {
                    tmpArr = arr.filter(ele => (
                        ele.year2 == y &&
                        ele.stream.toUpperCase() == "BCOM" &&
                        ele.semester == sem
                    ));
                }
                else {
                    tmpArr = arr.filter(ele => (
                        ele.year1 == y &&
                        ele.stream.toUpperCase() == streams[s].name &&
                        ele.semester == sem
                    ));
                }

                sortedArr = [...sortedArr, ...tmpArr];
            }
        }
    }

    return sortedArr;
}

export function filterData(arr: ExcelRow[], year: number, stream: string, semester: number) {
    if (stream.toUpperCase() == "BCOM") {
        return arr.filter(ele => (
            ele.year2 == year &&
            ele.stream.toUpperCase() == "BCOM" &&
            ele.semester == semester
        ));
    }
    else if (stream.toUpperCase() == "BA" || stream.toUpperCase() == "BSC") {
        return arr.filter(ele => (
            ele.year1 == year &&
            ele.stream.toUpperCase() == stream &&
            ele.semester == semester
        ));
    }
    else {
        return [];
    }
}
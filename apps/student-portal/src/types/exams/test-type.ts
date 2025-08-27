export interface DbTestType {
    readonly id?: number;
    shortName: string;
    testName: string;
    description: string | null;
    carry: string | null;
    isboardexam: boolean | null;
    passmarks: number;
    fullmarks: number;
    weightage: number;
    evaluationType: number;
    writtenfullmarks: number | null;
    writtenpassmarks: number | null;
    oralmarks: number | null;
    review: boolean;
    formativetest1: boolean;
    formativetest2: boolean;
    formativetest3: boolean;
    formativetest4: boolean;
    summativeassessment1: boolean;
    summativeassessment2: boolean;
    flag: string | null;
}
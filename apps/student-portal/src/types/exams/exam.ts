export interface DbExam {
    readonly id?: number;
    testid: number;
    classid: number;
    examdate: Date;
    frmhr: number;
    frmmnt: number;
    tohr: Date;
    tomnt: Date;
    subjecttypeid: number;
    entrydate: Date;
    sessid: number;
    ordertp: string
    setno: number;
    paperid: number;
}

export interface Exam extends DbExam {
    testName: string;
    className: string;
    subjectTypeName: string;
    sessionName: string;
    paperName: string;
    room: string;
}
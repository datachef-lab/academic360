export interface DbStudentAccessControl {
    readonly id: number;
    student_id_fk: number;
    status: 'alumni' | 'active' | 'dropped_out' | 'supplementary' | 'suspended' | null;
    access_course: boolean;
    access_library: boolean;
    access_exams: boolean;
    access_documents: boolean;
    created_at: Date;
    updated_at: Date | null;
}

export interface StudentAccessControl extends DbStudentAccessControl {
    univregno: string | null;
    imgFile: string | null;
    univlstexmrollno: string | null;
    active: boolean;
    alumni: boolean;
    leavingdate: Date | string | null;
    codeNumber: string;
    institutionalemail: string | null;
    cuformno: string | null;
    name: string;
    whatsappno: string | null;
}
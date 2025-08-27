export interface DbCourseMaterial {
    id?: number;
    subject_id_fk: number;
    title: string;
    url: string;
    type: "file" | "link";
    file_path: string | null;
    created_at?: Date;
    updated_at?: Date;
}
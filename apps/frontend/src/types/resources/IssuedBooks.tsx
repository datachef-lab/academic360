export type IssuedBook = {
    id: number;
    title: string;
    author: string;
    isbn: string;
    category: string;
    issueDate: string;  
    dueDate: string;    
    status: "Pending" | "Returned";
    fine: number;
    canRenew: boolean;
};
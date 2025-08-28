export interface Bank {
    readonly id: number;
    bankName: string;
}

export interface BankBranch {
    id: number;
    bankid: number;
    name: string;
}
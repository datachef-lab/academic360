export type FeesComponent = {
    id: number;
    feesStructureId: number;
    feesHeadId: number;
    isConcessionApplicable: boolean;
    amount: number;
    concessionAmount: number;
    sequence: number;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
};

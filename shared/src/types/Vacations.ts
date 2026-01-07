export enum VacationRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELED = 'CANCELED',
    COMPLETED = 'COMPLETED',
    PROCESSING = 'PROCESSING',
}

export enum VacationType {
    INDIVIDUAL = 'INDIVIDUAL',
    COLLECTIVE = 'COLLECTIVE',
}

export interface VacationPolicy {
    id: string;
    companyId: string;
    name: string;
    minDaysAntecedence: number;
    allowFractioning: boolean;
    maxPeriods: number;
    minDaysPerPeriod: Record<string, any>; // JSON rule
    allowCashAllowance: boolean;
    sellingLimitDays: number;
    sellingTiming: string;
    allow13thAdvance: boolean;
    approvalFlow: string;
    approvalSlaDays: number;
    accrualLogic: string;
    createdAt: string;
    updatedAt: string;
}

export interface VacationBalance {
    id: string;
    userId: string;
    periodStart: string;
    periodEnd: string;
    concessiveLimitDate: string;
    daysVested: number;
    daysTaken: number;
    daysSold: number;
    balanceTotal: number;
    createdAt: string;
    updatedAt: string;
}

export interface VacationRequest {
    id: string;
    userId: string;
    startDate: string;
    endDate: string;
    soldDays: number;
    request13th: boolean;
    type: VacationType;
    status: VacationRequestStatus;
    approvalFlowSnapshot?: Record<string, any>;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        name: string;
        avatar?: string;
    }
}

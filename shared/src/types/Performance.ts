export enum PerformanceCycleStatus {
    SETUP = 'SETUP',
    ACTIVE = 'ACTIVE',
    CALIBRATION = 'CALIBRATION',
    CLOSED = 'CLOSED',
}

export enum AssessmentType {
    SELF = 'SELF',
    MANAGER = 'MANAGER',
    PEER = 'PEER',
}

export enum AssessmentStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
}

export enum GoalType {
    COMPANY = 'COMPANY',
    TEAM = 'TEAM',
    INDIVIDUAL = 'INDIVIDUAL',
}

export enum PDIStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED',
}

export interface PerformanceCycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: PerformanceCycleStatus;
    participantsFilter: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface AssessmentForm {
    id: string;
    cycleId: string;
    targetUserId: string;
    evaluatorUserId: string;
    type: AssessmentType;
    status: AssessmentStatus;
    createdAt: string;
    updatedAt: string;
}

export interface AssessmentAnswer {
    id: string;
    formId: string;
    questionId: string;
    score?: number;
    textAnswer?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Competence {
    id: string;
    name: string;
    category: string;
    createdAt: string;
    updatedAt: string;
}

export interface Goal {
    id: string;
    userId: string;
    parentGoalId?: string;
    title: string;
    weight: number;
    progress: number;
    type: GoalType;
    createdAt: string;
    updatedAt: string;
}

export interface KeyResult {
    id: string;
    goalId: string;
    targetValue: number;
    currentValue: number;
    metricUnit: string;
    createdAt: string;
    updatedAt: string;
}

export interface PDI {
    id: string;
    userId: string;
    title: string;
    status: PDIStatus;
    deadline: string;
    createdAt: string;
    updatedAt: string;
}

export interface PDIAction {
    id: string;
    pdiId: string;
    description: string;
    dueDate: string;
    status: PDIStatus;
    createdAt: string;
    updatedAt: string;
}

export enum OneOnOneStatus {
    SCHEDULED = 'SCHEDULED',
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED',
}

export interface OneOnOne {
    id: string;
    organizerUserId: string;
    participantUserId: string;
    scheduledDate: string;
    status: OneOnOneStatus;
    talkingPoints: Array<{ id: string, text: string, checked: boolean, addedBy: string }>;
    actionItems: Array<{ id: string, text: string, status: string }>;
    privateNotes?: string;
    createdAt: string;
    updatedAt: string;
}

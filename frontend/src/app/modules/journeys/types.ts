export type JourneyStep = {
    id: string
    title: string
    type: 'article' | 'video' | 'quiz' | 'poll' | 'form'
    time?: string
    delayDays?: number
    orderIndex?: number
    contentPayload?: any
    contentType?: string
    releaseTime?: string
    mediaType?: 'NONE' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    mediaUrl?: string
    videoConfig?: any
    requireAck?: boolean
    smartFields?: any
}

export type JourneyDay = {
    day: number
    steps: JourneyStep[]
}

export type Journey = {
    id: string
    title: string
    description?: string
    triggerType: 'GLOBAL' | 'GROUP' | 'ONBOARDING' | 'DATE_BASED' | 'MANUAL'
    targetGroupId?: string
    targetAudience?: any
    startDate?: string
    endDate?: string
    gamificationId?: string
    restartPolicy: 'RESUME' | 'RESTART'
    active: boolean
    isNr1?: boolean
    steps: JourneyStep[]
    createdAt: string
    updatedAt: string
}


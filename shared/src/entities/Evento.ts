export interface Evento {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    organizerId: string;
    attendees: string[];
    maxCapacity?: number;
    isVirtual: boolean;
    meetingLink?: string;
  }
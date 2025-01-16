import { z } from 'zod';
import { Role, ComunicadoType } from '../types';

const UserEngagementSchema = z.object({
  totalLogins: z.number().nonnegative(),
  lastActivityDate: z.date(),
  contentViewed: z.number().nonnegative(),
  commentsPosted: z.number().nonnegative(),
  likesGiven: z.number().nonnegative(),
  eventsAttended: z.number().nonnegative(),
});

const ContentEngagementSchema = z.object({
  views: z.number().nonnegative(),
  uniqueViews: z.number().nonnegative(),
  likes: z.number().nonnegative(),
  comments: z.number().nonnegative(),
  shares: z.number().nonnegative(),
  averageTimeSpent: z.number().nonnegative(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  department: z.string(),
  position: z.string(),
  hireDate: z.date(),
  isActive: z.boolean(),
  lastLogin: z.date().optional(),
  engagementMetrics: UserEngagementSchema,
});

export const ComunicadoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  type: z.nativeEnum(ComunicadoType),
  authorId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  targetAudience: z.array(z.string()),
  isPublished: z.boolean(),
  attachments: z.array(z.string()).optional(),
  engagementMetrics: ContentEngagementSchema,
});

export const VideoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string(),
  url: z.string().url(),
  duration: z.number().positive(),
  uploaderId: z.string().uuid(),
  uploadDate: z.date(),
  categories: z.array(z.string()),
  isPublic: z.boolean(),
  engagementMetrics: ContentEngagementSchema,
});

export const EventoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string(),
  organizerId: z.string().uuid(),
  attendees: z.array(z.string().uuid()),
  maxCapacity: z.number().positive().optional(),
  isVirtual: z.boolean(),
  meetingLink: z.string().url().optional()
});
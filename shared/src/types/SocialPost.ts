export enum SocialPostStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface SocialPostMedia {
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string; // for videos
}

export interface SocialPost {
    id: string;
    companyId: string;
    channelId: string;
    authorId: string;
    content: string;
    media: SocialPostMedia[];
    status: SocialPostStatus;

    // Denormalized counts
    reactionsCount: number;
    commentsCount: number;

    createdAt: string;
    updatedAt: string;
    publishedAt?: string;

    // Relations (optional/populated)
    author?: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
}

export interface SocialComment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: string;

    author?: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
}

// Interaction types for Analytics
export type SocialInteractionType = 'VIEW' | 'LIKE' | 'COMMENT' | 'SHARE' | 'SAVE';

export interface SocialReaction {
    id: string;
    postId: string;
    userId: string;
    type: string; // 'LIKE' main one for now
    createdAt: string;
}

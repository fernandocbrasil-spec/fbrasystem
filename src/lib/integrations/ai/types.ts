// =============================================================================
// AI Adapter — Types
// Abstraction for AI-powered features (meeting summarization, etc.)
// =============================================================================

export type MeetingSummaryInput = {
    meetingId: string;
    title: string;
    transcript: string;
    participants?: string[];
};

export type MeetingSummaryResult = {
    summary: string;
    keyPoints: string[];
    actionItems: { description: string; assignee?: string }[];
    nextSteps: string[];
};

export type AIAdapter = {
    /** Summarize a meeting transcript */
    summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummaryResult>;
};

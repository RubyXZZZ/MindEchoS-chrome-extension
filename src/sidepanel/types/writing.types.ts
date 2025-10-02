// types/writing.types.ts
// Writing Task 类型定义 - 使用 Prompt API

export type WritingTaskType = 'summary' | 'outline' | 'memo' | 'email';

export interface WritingTask {
    id: WritingTaskType;
    label: string;
    description: string;
    icon: string;
    prompt: string;
}

// 统一的格式要求 - 强调简洁性
const FORMAT_REQUIREMENTS = `

Output Requirements:
- Maximum 2-3 sentences per paragraph
- Use bullet points (not long prose)
- Bold key terms only
- Headers (##) for sections
- No decorative language
- No repetition
- Direct and actionable`;

export const WRITING_TASKS: Record<WritingTaskType, WritingTask> = {
    summary: {
        id: 'summary',
        label: 'Summary',
        description: 'Concise overview of key points',
        icon: '📝',
        prompt: `Create a summary in 150 words or less. Include: 1) Core thesis/main point (one sentence), 2) 3-5 key facts as bullets, 3) One actionable takeaway. Skip background info and examples.${FORMAT_REQUIREMENTS}`
    },

    outline: {
        id: 'outline',
        label: 'Outline',
        description: 'Structured framework with sections',
        icon: '📋',
        prompt: `Create a hierarchical outline using numbered sections (1, 1.1, 1.2). Maximum 3 levels deep. Focus on structure, not explanation. Each line should be a topic/concept only, no full sentences.${FORMAT_REQUIREMENTS}`
    },

    memo: {
        id: 'memo',
        label: 'Memo',
        description: 'Brief update or communication',
        icon: '📄',
        prompt: `Write a business memo. Format: SUBJECT: (clear topic) | PURPOSE: (one sentence) | KEY POINTS: (3-5 bullets) | ACTION: (next steps). Maximum 200 words. No preamble or closing pleasantries.${FORMAT_REQUIREMENTS}`
    },

    email: {
        id: 'email',
        label: 'Email',
        description: 'Professional email draft',
        icon: '✉️',
        prompt: `Draft a professional email. Include: SUBJECT: (specific topic) | Body with 2-3 short paragraphs | Clear ask or next step. Maximum 150 words. Skip lengthy greetings and generic closings.${FORMAT_REQUIREMENTS}`
    }
};
// types/writing.types.ts
// Writing Task 类型定义

export type WritingTaskType = 'summary' | 'outline' | 'draft';

export interface WritingTask {
    id: WritingTaskType;
    label: string;
    description: string;
    icon: string;
    prompt: string;
}

// 统一格式要求
const FORMAT_REQUIREMENTS = `

Output Requirements:
- Maximum 2-3 sentences per paragraph
- Use bullet points for clarity
- Bold key terms only
- Headers (##) for sections
- No decorative language
- Direct and actionable`;

export const WRITING_TASKS: Record<WritingTaskType, WritingTask> = {
    summary: {
        id: 'summary',
        label: 'Summary',
        description: 'Executive summary of key points',
        icon: '📝',
        prompt: `Create an executive summary in 150 words or less. Include: 1) Main thesis (one sentence), 2) 3-5 critical points as bullets, 3) Key takeaway or recommendation. Focus on what decision-makers need to know.${FORMAT_REQUIREMENTS}`
    },

    outline: {
        id: 'outline',
        label: 'Outline',
        description: 'Structural framework',
        icon: '📋',
        prompt: `Create a hierarchical outline framework. Output ONLY section headings and bullet points - no full sentences or explanatory text. Use numbered sections (1, 1.1, 1.2). Maximum 3 levels deep. This is a structural skeleton that will be filled in later.${FORMAT_REQUIREMENTS}`
    },

    draft: {
        id: 'draft',
        label: 'Report Draft',
        description: 'Initial version for editing',
        icon: '📄',
        prompt: `Generate a rough draft with complete paragraphs. This is an initial version requiring human editing and refinement. Include: 1) Brief introduction, 2) Main body with 2-3 key sections, 3) Preliminary conclusion. Maximum 300 words. Prioritize structure and completeness over polish.${FORMAT_REQUIREMENTS}`
    }
};
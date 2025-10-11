// Writing Task

import { FUNCTION_PROMPTS } from '../services/ai/promptAI';

export type WritingTaskType = 'summary' | 'outline' | 'draft';

export interface WritingTask {
    id: WritingTaskType;
    label: string;
    description: string;
    icon: string;
    prompt: string;
}

export const WRITING_TASKS: Record<WritingTaskType, WritingTask> = {
    summary: {
        id: 'summary',
        label: 'Summary',
        description: 'Key points overview',
        icon: '📝',
        prompt: FUNCTION_PROMPTS.write.summary
    },

    outline: {
        id: 'outline',
        label: 'Outline',
        description: 'Structural framework',
        icon: '📋',
        prompt: FUNCTION_PROMPTS.write.outline
    },

    draft: {
        id: 'draft',
        label: 'Report Draft',
        description: 'Initial version',
        icon: '📄',
        prompt: FUNCTION_PROMPTS.write.draft
    }
};
export interface BaseManageState {
    isManageMode: boolean;
}

// Cards 视图的管理状态（需要选择卡片）
export interface CardsManageState extends BaseManageState {
    view: 'cards';
    selectedCards: string[];
}

// Chat 视图的管理状态（不需要选择，直接操作对话）
export interface ChatManageState extends BaseManageState {
    view: 'chat';
    // Chat 视图不需要选择卡片，但可能需要其他状态
}


export type ManageState = CardsManageState | ChatManageState;
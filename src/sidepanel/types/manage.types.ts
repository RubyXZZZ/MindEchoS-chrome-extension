export interface BaseManageState {
    isManageMode: boolean;
}

// Cards
export interface CardsManageState extends BaseManageState {
    view: 'cards';
    selectedCards: string[];
}

// Chat
export interface ChatManageState extends BaseManageState {
    view: 'chat';
}


export type ManageState = CardsManageState | ChatManageState;
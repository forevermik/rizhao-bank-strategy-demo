export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  failed?: boolean;
  sources?: Array<{ title: string; route?: string; section?: string }>;
};

export type ChatApiResponse = {
  answer: string;
  sources?: ChatMessage['sources'];
};

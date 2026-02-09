/**
 * DuckDuckGo Search Chat Integration for MikuGPT Frontend
 * 
 * This example shows how to integrate /api/miku/search-chat endpoint
 * with immediate "thinking..." message feedback in the chat UI.
 * 
 * Usage:
 * const searchChat = new DuckSearchChat(apiClient, emotionRenderer);
 * await searchChat.send(query, personality, emotionSet);
 */

import axios, { AxiosInstance } from 'axios';

interface SearchChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  emotionSet?: string;
  source?: 'duckduckgo_ai' | 'miku_gpt';
  isThinking?: boolean;
  isError?: boolean;
  timestamp?: Date;
}

interface SearchChatResponse {
  response: string;
  emotion: string;
  emotion_set: string;
  source: 'duckduckgo_ai' | 'miku_gpt';
  fallback: boolean;
  error?: string;
}

/**
 * DuckDuckGo Search Chat Handler
 * Manages sending search queries and displaying real-time thinking feedback
 */
export class DuckSearchChat {
  private apiClient: AxiosInstance;
  private messages: SearchChatMessage[] = [];
  private isLoading = false;

  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }

  /**
   * Send a search query with immediate "thinking..." feedback
   * 
   * @param query - The search query text
   * @param personality - MikuGPT personality (Дередере, Цундере, etc.)
   * @param emotionSet - Emotion set (A or B)
   * @param onUpdate - Callback when message updates (for real-time UI updates)
   * @returns The final response message
   */
  async send(
    query: string,
    personality: string = 'Дередере',
    emotionSet: string = 'A',
    onUpdate?: (messages: SearchChatMessage[]) => void
  ): Promise<SearchChatMessage> {
    if (this.isLoading) {
      throw new Error('Search already in progress');
    }

    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    this.isLoading = true;

    try {
      // Step 1: Add user message to history
      const userMessage: SearchChatMessage = {
        id: this.generateId(),
        role: 'user',
        content: query,
        timestamp: new Date(),
        source: 'duckduckgo_ai'
      };
      this.messages.push(userMessage);
      onUpdate?.(this.messages);

      // Step 2: Add thinking message immediately
      const thinkingMessage: SearchChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: 'думаю.....  🔍',
        isThinking: true,
        timestamp: new Date(),
        source: 'duckduckgo_ai'
      };
      this.messages.push(thinkingMessage);
      onUpdate?.(this.messages);

      // Step 3: Send search request
      const response = await this.apiClient.post<SearchChatResponse>(
        '/api/miku/search-chat',
        {
          message: query,
          personality,
          emotion_set: emotionSet,
          model: 'gpt-4o-mini',
          flirt_enabled: false,
          nsfw_enabled: false
        }
      );

      const data = response.data;

      // Step 4: Replace thinking message with actual response
      const responseMessage: SearchChatMessage = {
        id: thinkingMessage.id,
        role: 'assistant',
        content: data.response,
        emotion: data.emotion,
        emotionSet: data.emotion_set,
        source: data.source as 'duckduckgo_ai' | 'miku_gpt',
        isThinking: false,
        isError: data.fallback,
        timestamp: new Date()
      };

      // Replace thinking message with response
      const thinkingIndex = this.messages.findIndex(m => m.id === thinkingMessage.id);
      if (thinkingIndex !== -1) {
        this.messages[thinkingIndex] = responseMessage;
      } else {
        this.messages.push(responseMessage);
      }

      onUpdate?.(this.messages);
      return responseMessage;
    } catch (error) {
      // Step 5: Handle error
      const errorMessage: SearchChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: `Вибач, щось пішло не так 😔\n\nДеталь: ${this.getErrorMessage(error)}`,
        isThinking: false,
        isError: true,
        timestamp: new Date(),
        source: 'duckduckgo_ai'
      };

      // Find and replace thinking message with error
      const thinkingIndex = this.messages.findIndex(
        m => m.isThinking && m.role === 'assistant'
      );
      if (thinkingIndex !== -1) {
        this.messages[thinkingIndex] = errorMessage;
      } else {
        this.messages.push(errorMessage);
      }

      onUpdate?.(this.messages);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get current message history
   */
  getHistory(): SearchChatMessage[] {
    return [...this.messages];
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messages = [];
  }

  /**
   * Check if search is in progress
   */
  isSearching(): boolean {
    return this.isLoading;
  }

  /**
   * Get the last assistant message
   */
  getLastResponse(): SearchChatMessage | undefined {
    // Use slice().reverse().find() for compatibility (findLast requires ES2023)
    return [...this.messages].reverse().find((m: SearchChatMessage) => m.role === 'assistant');
  }

  // Helpers

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return 'Не авторизовано. Увійти заново.';
      }
      if (error.response?.status === 429) {
        return 'Занадто багато запитів. Спробуйте пізніше.';
      }
      if (error.response?.status === 503) {
        return 'Сервіс недоступний. Спробуйте пізніше.';
      }
      if (error.code === 'ECONNABORTED') {
        return 'Запит перевищив ліміт часу (60с). Спробуйте простіший запит.';
      }
      return `Помилка сервера (${error.response?.status}): ${error.message}`;
    }
    return error?.message || 'Unknown error';
  }
}

/**
 * Example React Hook for DuckSearch Chat
 * 
 * Usage in a React component:
 * const { messages, send, isLoading } = useDuckSearchChat(apiClient);
 * 
 * return (
 *   <div>
 *     {messages.map(msg => (
 *       <ChatBubble key={msg.id} message={msg} />
 *     ))}
 *     <input 
 *       onEnter={(text) => send(text, 'Дередере', 'A')} 
 *       disabled={isLoading}
 *     />
 *   </div>
 * );
 */
export function useDuckSearchChat(apiClient: AxiosInstance) {
  const [messages, setMessages] = React.useState<SearchChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const searchChat = React.useRef<DuckSearchChat | null>(null);

  React.useEffect(() => {
    searchChat.current = new DuckSearchChat(apiClient);
  }, [apiClient]);

  const send = async (
    query: string,
    personality: string = 'Дередере',
    emotionSet: string = 'A'
  ) => {
    if (!searchChat.current) return;
    setIsLoading(true);
    try {
      await searchChat.current.send(query, personality, emotionSet, setMessages);
    } catch (error) {
      console.error('Search chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    searchChat.current?.clearHistory();
    setMessages([]);
  };

  return {
    messages,
    send,
    isLoading,
    clearHistory,
    history: searchChat.current?.getHistory() || []
  };
}

// Import React for the hook (if using in a React context)
import React from 'react';

export default DuckSearchChat;

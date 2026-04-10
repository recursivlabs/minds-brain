type ChatNavListener = (event: { type: 'open' | 'new'; conversationId?: string }) => void;

class ChatNavigationEvent {
  private listeners: ChatNavListener[] = [];

  subscribe(listener: ChatNavListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(event: { type: 'open' | 'new'; conversationId?: string }) {
    this.listeners.forEach((l) => l(event));
  }
}

export const chatNavigationEvent = new ChatNavigationEvent();

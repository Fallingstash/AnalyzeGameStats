export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(event, list.filter(h => h !== handler));
  }

  emit(event, payload) {
    const list = this.listeners.get(event);
    if (!list) return;
    for (const handler of list) {
      handler(payload);
    }
  }
}
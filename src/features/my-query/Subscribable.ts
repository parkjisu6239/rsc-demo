interface Function {
  readonly name: string;
}

export class Subscribable<TListener extends Function> {
  private listeners: Set<TListener> = new Set();

  constructor() {
    this.subscribe = this.subscribe.bind(this);
  }

  subscribe = (listener: TListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

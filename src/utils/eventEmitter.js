export default class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
  }

  emit(event, data) {
    if (!this._events[event]) return;
    for (let i = 0; i < this._events[event].length; i++) {
      this._events[event][i](data);
    }
  }

  off(event, callback) {
    if (this._events && this._events[event]) {
      if (!callback) {
        delete this._events[event];
      } else {
        let index = -1;
        for (let i = 0; i < this._events[event].length; i++) {
          if (this._events[event][i] === callback) {
            index = i;
            break;
          }
        }
        if (index !== -1) {
          this._events[event].splice(index, 1);
        }
      }
    }
  }
}

let globalEvent;
export function getGlobalEvent() {
  if (!globalEvent) {
    globalEvent = new EventEmitter();
  }
  return globalEvent;
}

(function(){
  class GameLogger {
    constructor() {
      this.endpoint = '/api/upload-log';
      this.batchSize = 20;
      this.flushInterval = 5000; // ms
      this.buffer = [];
      this._loadPersisted();
      this._timer = setInterval(() => this.flush(), this.flushInterval);
    }

    init(cfg = {}) {
      this.endpoint = cfg.endpoint || this.endpoint;
      this.batchSize = cfg.batchSize || this.batchSize;
      this.flushInterval = cfg.flushInterval || this.flushInterval;
      if (this._timer) clearInterval(this._timer);
      this._timer = setInterval(() => this.flush(), this.flushInterval);
    }

    enqueue(state) {
      try {
        // add metadata
        const rec = Object.assign({ ts: Date.now(), id: this._makeId() }, state);
        this.buffer.push(rec);
        if (this.buffer.length >= this.batchSize) this.flush();
      } catch (e) {
        console.error('GameLogger.enqueue error', e);
      }
    }

    _makeId() { return Math.random().toString(36).slice(2, 10); }

    flush() {
      if (this.buffer.length === 0) return;
      const batch = this.buffer.splice(0, this.batchSize);
      this._sendBatch(batch).catch(err => {
        console.warn('GameLogger: send failed, persisting locally', err);
        // re-insert to buffer head
        this.buffer = batch.concat(this.buffer);
        this._persistBuffer();
      });
    }

    async _sendBatch(batch) {
      const payload = { records: batch };
      // try navigator.sendBeacon first (fire-and-forget)
      try {
        if (navigator && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          const ok = navigator.sendBeacon(this.endpoint, blob);
          if (ok) return;
          // fallthrough to fetch if sendBeacon returned false
        }
      } catch (e) {
        // ignore and fall back to fetch
      }

      // fetch fallback with keepalive
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // success -> clear persisted buffer
      this._clearPersisted();
    }

    _persistBuffer() {
      try {
        const prev = JSON.parse(localStorage.getItem('ws_logger_buffer') || '[]');
        const merged = prev.concat(this.buffer).slice(-5000); // keep limit
        localStorage.setItem('ws_logger_buffer', JSON.stringify(merged));
      } catch (e) {
        console.warn('GameLogger persist failed', e);
      }
    }

    _loadPersisted() {
      try {
        const stored = JSON.parse(localStorage.getItem('ws_logger_buffer') || '[]');
        if (Array.isArray(stored) && stored.length) this.buffer = stored.concat(this.buffer);
        localStorage.removeItem('ws_logger_buffer');
      } catch (e) {
        // ignore
      }
    }

    _clearPersisted() { localStorage.removeItem('ws_logger_buffer'); }
  }

  window.GameLogger = new GameLogger();
})();
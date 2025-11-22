class HitmapRecorder {
  constructor(opts = {}) {
    this.hits = []; // {x,y,timestamp}
    this.windowMs = opts.windowMs || 1000 * 60 * 60; // keep last 60 minutes by default
    this.endpoint = opts.endpoint || 'http://localhost:5000/api/upload-hitmap';
    this.autoFlushInterval = opts.autoFlushInterval || 60 * 1000; // 60s
    this._autoTimer = null;
    this._maxBatch = opts.maxBatch || 500;
  }

  record(x, y) {
    const t = Date.now();
    this.hits.push({ x, y, t });
    this._garbageCollect();
    // auto flush if huge
    if (this.hits.length >= this._maxBatch) this.flushNow();
  }

  _garbageCollect() {
    const cutoff = Date.now() - this.windowMs;
    this.hits = this.hits.filter(h => h.t >= cutoff);
  }

  // Returns number of hits within radius of (x,y)
  countNear(x, y, radius) {
    const r2 = radius * radius;
    let c = 0;
    for (const h of this.hits) {
      const dx = h.x - x;
      const dy = h.y - y;
      if (dx * dx + dy * dy <= r2) c++;
    }
    return c;
  }

  // Start periodic flush to server
  startAutoFlush(intervalMs) {
    if (intervalMs) this.autoFlushInterval = intervalMs;
    if (this._autoTimer) return;
    this._autoTimer = setInterval(() => this.flushNow(), this.autoFlushInterval);
  }

  stopAutoFlush() {
    if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
  }

  // Immediately send collected hits to server (batched)
  async flushNow() {
    if (!this.hits || this.hits.length === 0) return;
    const toSend = this.hits.slice();
    // clear local store immediately to avoid duplicate sends on next flush
    this.hits = [];
    try {
      const payload = { records: toSend };
      // try sendBeacon first
      if (navigator && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok = navigator.sendBeacon(this.endpoint, blob);
        if (ok) return true;
        // fallthrough to fetch
      }
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (e) {
      console.warn('HitmapRecorder.flushNow failed, persisting locally', e);
      // on failure, requeue the toSend back to hits (prepend)
      this.hits = toSend.concat(this.hits).slice(-5000);
      return false;
    }
  }
}

window.HitmapRecorder = HitmapRecorder;
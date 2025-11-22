class HitmapRecorder {
  constructor() {
    this.hits = []; // {x,y,timestamp}
    this.windowMs = 1000 * 60 * 5; // keep last 5 minutes
  }

  record(x, y) {
    const t = Date.now();
    this.hits.push({ x, y, t });
    this._garbageCollect();
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
}

window.HitmapRecorder = HitmapRecorder;
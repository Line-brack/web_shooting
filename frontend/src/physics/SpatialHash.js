class SpatialHash {
  constructor(cellSize = 128) {
    this.cellSize = cellSize;
    this.buckets = new Map();
  }

  _key(x, y) {
    const xi = Math.floor(x / this.cellSize);
    const yi = Math.floor(y / this.cellSize);
    return `${xi},${yi}`;
  }

  insert(id, x, y, meta = null) {
    const key = this._key(x, y);
    if (!this.buckets.has(key)) this.buckets.set(key, new Map());
    this.buckets.get(key).set(id, { x, y, meta });
  }

  remove(id, x, y) {
    const key = this._key(x, y);
    const bucket = this.buckets.get(key);
    if (!bucket) return;
    bucket.delete(id);
    if (bucket.size === 0) this.buckets.delete(key);
  }

  update(id, oldX, oldY, x, y, meta = null) {
    const oldKey = this._key(oldX, oldY);
    const newKey = this._key(x, y);
    if (oldKey === newKey) {
      const bucket = this.buckets.get(newKey);
      if (bucket && bucket.has(id)) {
        bucket.set(id, { x, y, meta });
      }
    } else {
      this.remove(id, oldX, oldY);
      this.insert(id, x, y, meta);
    }
  }

  queryRadius(x, y, radius) {
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);
    const results = [];
    for (let xi = minX; xi <= maxX; xi++) {
      for (let yi = minY; yi <= maxY; yi++) {
        const key = `${xi},${yi}`;
        const bucket = this.buckets.get(key);
        if (!bucket) continue;
        for (const [id, obj] of bucket.entries()) {
          const dx = obj.x - x;
          const dy = obj.y - y;
          if (dx * dx + dy * dy <= radius * radius) results.push({ id, x: obj.x, y: obj.y, meta: obj.meta });
        }
      }
    }
    return results;
  }
}

window.SpatialHash = SpatialHash;
class BulletManager {
  constructor(scene) {
    this.scene = scene;
    this.bullets = new Map(); // id -> {x,y,vx,vy}
    this.nextId = 1;
    this.spatial = new SpatialHash(96);
  }

  spawn(x, y, vx, vy, meta = null) {
    const id = this.nextId++;
    this.bullets.set(id, { x, y, vx, vy, meta });
    this.spatial.insert(id, x, y, meta);
    return id;
  }

  remove(id) {
    const b = this.bullets.get(id);
    if (!b) return;
    this.spatial.remove(id, b.x, b.y);
    this.bullets.delete(id);
  }

  update(dt) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    for (const [id, b] of Array.from(this.bullets.entries())) {
      const oldX = b.x, oldY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      this.spatial.update(id, oldX, oldY, b.x, b.y, null);
      if (b.y > h + 50 || b.x < -100 || b.x > w + 100) this.remove(id);
    }
  }

  draw(graphics) {
    for (const b of this.bullets.values()) {
      // color by owner meta
      if (b.meta === 'player') graphics.fillStyle(0x66ff66, 1);
      else if (b.meta === 'enemy') graphics.fillStyle(0xff6666, 1);
      else graphics.fillStyle(0xff4444, 1);
      graphics.fillCircle(b.x, b.y, 5);
    }
  }

  queryNearby(x, y, radius) {
    return this.spatial.queryRadius(x, y, radius).map(r => {
      const b = this.bullets.get(r.id);
      return { id: r.id, x: r.x, y: r.y, meta: b ? b.meta : null };
    });
  }
}

window.BulletManager = BulletManager;
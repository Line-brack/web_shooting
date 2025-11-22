class BulletManager {
  constructor(scene) {
    this.scene = scene;
    this.bullets = new Map(); // id -> {x,y,vx,vy}
    this.nextId = 1;
    this.spatial = new SpatialHash(96);
  }

  spawn(x, y, vx, vy) {
    const id = this.nextId++;
    this.bullets.set(id, { x, y, vx, vy });
    this.spatial.insert(id, x, y, null);
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
    graphics.fillStyle(0xff4444, 1);
    for (const b of this.bullets.values()) {
      graphics.fillCircle(b.x, b.y, 5);
    }
  }

  queryNearby(x, y, radius) {
    return this.spatial.queryRadius(x, y, radius).map(r => ({ id: r.id, x: r.x, y: r.y }));
  }
}

window.BulletManager = BulletManager;
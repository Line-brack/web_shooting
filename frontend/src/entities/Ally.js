class AllyEntity {
  constructor(scene, x, y, bulletManager, targetPlayer) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.bulletManager = bulletManager;
    this.target = targetPlayer; // PlayerEntity instance
    this.movement = new MovementComponent(this, 220);
    this.shootTimer = 0.5; // seconds between support shots
    this.followOffset = { x: -40, y: 20 }; // relative to player
  }

  update(dt) {
    // Desired position: follow behind the player with offset rotated by player's input direction
    const targetX = this.target.x + this.followOffset.x;
    const targetY = this.target.y + this.followOffset.y;
    // Smoothly move towards desired position
    this.movement.moveTowards(targetX, targetY, dt);

    // Simple support shooting: aim at nearest enemy
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = 0.4 + Math.random() * 0.6; // jitter
      // find nearest enemy
      let nearest = null;
      let nd = Infinity;
      for (const e of (this.scene.enemies || [])) {
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (d < nd) { nd = d; nearest = e; }
      }
      if (nearest && nd < 400) {
        // shoot a directed bullet towards enemy
        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const speed = 320;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        this.bulletManager.spawn(this.x, this.y, vx, vy, 'ally');
      } else {
        // occasional forward support shot
        this.bulletManager.spawn(this.x, this.y - 8, 0, -260, 'ally');
      }
    }
  }

  draw(graphics) {
    // simple triangular ally
    graphics.fillStyle(0x66ccff, 1);
    graphics.fillTriangle(this.x - 8, this.y + 8, this.x + 8, this.y + 8, this.x, this.y - 10);
  }
}

window.AllyEntity = AllyEntity;

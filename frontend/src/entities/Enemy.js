class EnemyEntity {
  constructor(scene, x, y, bulletManager) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 40 + Phaser.Math.Between(0, 40);
    this.bulletManager = bulletManager;
    this.shootTimer = Phaser.Math.FloatBetween(0.8, 2.0);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // simple boundary behaviour
    const w = this.scene.scale.width;
    if (this.x < 20) { this.x = 20; this.vx = -this.vx; }
    if (this.x > w - 20) { this.x = w - 20; this.vx = -this.vx; }

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      // shoot downwards
      this.bulletManager.spawn(this.x, this.y + 8, 0, 180, 'enemy');
      this.shootTimer = Phaser.Math.FloatBetween(0.6, 1.5);
    }
  }

  draw(graphics) {
    graphics.fillStyle(0x8888ff, 1);
    graphics.fillRect(this.x - 12, this.y - 10, 24, 20);
  }
}

window.EnemyEntity = EnemyEntity;
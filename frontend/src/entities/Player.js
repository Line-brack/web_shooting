class PlayerEntity {
  constructor(scene, x, y, bulletManager) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.speed = 300;
    this.bulletManager = bulletManager;
    this.shootTimer = 0;
  }

  update(dt, cursors) {
    if (cursors.left.isDown) this.x -= this.speed * dt;
    if (cursors.right.isDown) this.x += this.speed * dt;
    if (cursors.up.isDown) this.y -= this.speed * dt;
    if (cursors.down.isDown) this.y += this.speed * dt;
    // clamp
    this.x = Phaser.Math.Clamp(this.x, 20, this.scene.scale.width - 20);
    this.y = Phaser.Math.Clamp(this.y, 20, this.scene.scale.height - 20);

    // simple shooting
    this.shootTimer -= dt;
    if (this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), 0)) {
      // use throttled shooting
    }

    // auto-fire for prototype
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.bulletManager.spawn(this.x, this.y - 12, 0, -300);
      this.shootTimer = 0.18;
    }
  }

  draw(graphics) {
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillCircle(this.x, this.y, 8);
  }
}

window.PlayerEntity = PlayerEntity;
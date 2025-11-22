class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.debugMode = false;
    this.debugTextEl = null;
  }

  preload() {
    // No external assets yet; using Graphics for simple shapes.
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Managers
    this.worldGraphics = this.add.graphics();
    this.debugGraphics = this.add.graphics();
    this.debugTextEl = document.getElementById('debug-json');

    // Bullet manager + spatial
    this.bulletManager = new BulletManager(this);

    // Player and enemies
    this.playerEntity = new PlayerEntity(this, w / 2, h - 80, this.bulletManager);
    this.enemies = [];

    // Spawn some enemies
    for (let i = 0; i < 5; i++) {
      const ex = 80 + i * 120;
      const ey = 80 + Phaser.Math.Between(-40, 40);
      this.enemies.push(new EnemyEntity(this, ex, ey, this.bulletManager));
    }
  }

  spawnBullet(randomX = false) {
    const w = this.scale.width;
    const x = randomX ? Phaser.Math.Between(40, w - 40) : Phaser.Math.Between(0, w);
    const y = -10;
    const vx = Phaser.Math.FloatBetween(-30, 30);
    const vy = Phaser.Math.FloatBetween(80, 160);
    this.bulletManager.spawn(x, y, vx, vy);
  }

  update(time, delta) {
    const dt = delta / 1000;
    const w = this.scale.width;
    const h = this.scale.height;

    // Toggle debug mode on key press (on down)
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.debugMode = !this.debugMode;
      this.debugTextEl.style.display = this.debugMode ? 'block' : 'none';
    }

    // Update entities
    this.playerEntity.update(dt, this.cursors);
    for (const e of this.enemies) e.update(dt);
    this.bulletManager.update(dt);

    // Draw world
    this.worldGraphics.clear();
    // Player
    this.playerEntity.draw(this.worldGraphics);
    // Enemies
    for (const e of this.enemies) e.draw(this.worldGraphics);
    // Bullets
    this.bulletManager.draw(this.worldGraphics);

    // Debug overlay: StateCollector & visualize nearest bullet
    this.debugGraphics.clear();
    if (this.debugMode) {
      const state = this.collectState();
      // Show JSON text
      this.debugTextEl.textContent = JSON.stringify(state, null, 2);

      // Draw line to nearest bullet
      if (state.nearest_bullets && state.nearest_bullets.length > 0) {
        const nb = state.nearest_bullets[0];
        const bx = nb.x * w;
        const by = nb.y * h;
        this.debugGraphics.lineStyle(2, 0xffff00, 1);
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(this.playerEntity.x, this.playerEntity.y);
        this.debugGraphics.lineTo(bx, by);
        this.debugGraphics.closePath();
        this.debugGraphics.strokePath();
        // mark nearest bullet
        this.debugGraphics.fillStyle(0xffff00, 1);
        this.debugGraphics.fillCircle(bx, by, 6);
      }
    }
  }

  collectState() {
    // Minimal StateCollector for prototype (normalizes by width/height)
    const w = this.scale.width;
    const h = this.scale.height;

    // Nearest bullets (by distance)
    const arr = this.bullets.map(b => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy }));
    arr.sort((a, b) => {
      const da = Phaser.Math.Distance.Between(a.x, a.y, this.player.x, this.player.y);
      const db = Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y);
      return da - db;
    });
    const nearest = arr.slice(0, 5).map(b => ({ x: b.x / w, y: b.y / h, vx: b.vx / 200, vy: b.vy / 200 }));

    // Player input flags (simple)
    const inputFlags = {
      left: !!this.cursors.left.isDown,
      right: !!this.cursors.right.isDown,
      up: !!this.cursors.up.isDown,
      down: !!this.cursors.down.isDown
    };

    const state = {
      player_pos: { x: this.player.x / w, y: this.player.y / h },
      ally_pos: { x: 0.5, y: 0.8 }, // placeholder for now
      nearest_enemies: [], // not implemented in this prototype
      nearest_bullets: nearest,
      player_input_flags: inputFlags
    };

    return state;
  }
}

// Expose to global for index.html loader
window.GameScene = GameScene;
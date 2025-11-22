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

    // HUD
    this.score = 0;
    this.lives = 3;
    this.scoreText = this.add.text(12, 12, 'Score: 0', { fontFamily: 'monospace', fontSize: '16px', color: '#fff' }).setDepth(50);
    this.livesText = this.add.text(12, 34, 'Lives: 3', { fontFamily: 'monospace', fontSize: '16px', color: '#fff' }).setDepth(50);

    // Hitmap recorder
    this.hitmapRecorder = new HitmapRecorder();

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
    // Collisions: enemy hit by player bullets
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const enemy = this.enemies[ei];
      const nearby = this.bulletManager.queryNearby(enemy.x, enemy.y, 18);
      for (const nb of nearby) {
        if (nb.meta === 'player') {
          // destroy bullet and enemy
          this.bulletManager.remove(nb.id);
          this.enemies.splice(ei, 1);
          this.score += 100;
          this.scoreText.setText(`Score: ${this.score}`);
          break;
        }
      }
    }

    // Collisions: player hit by enemy bullets
    const pNearby = this.bulletManager.queryNearby(this.playerEntity.x, this.playerEntity.y, 16);
    for (const nb of pNearby) {
      if (nb.meta === 'enemy') {
        this.bulletManager.remove(nb.id);
        this.lives -= 1;
        this.livesText.setText(`Lives: ${this.lives}`);
        // record hit coordinate to hitmap
        this.hitmapRecorder.record(nb.x, nb.y);
        // simple player flash
        this.tweens.addCounter({ from: 0, to: 100, duration: 120, onUpdate: (tween) => {
          const v = Math.floor(tween.getValue());
          this.playerEntityTint = (v % 2 === 0) ? 0xffffff : 0xffaaaa;
        }});
        if (this.lives <= 0) {
          // game over - simple restart
          this.scene.restart();
          return;
        }
        break;
      }
    }

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

    // Nearest bullets (by distance) - use BulletManager storage
    const allBullets = Array.from(this.bulletManager.bullets.values()).map(b => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, meta: b.meta }));
    allBullets.sort((a, b) => {
      const da = Phaser.Math.Distance.Between(a.x, a.y, this.playerEntity.x, this.playerEntity.y);
      const db = Phaser.Math.Distance.Between(b.x, b.y, this.playerEntity.x, this.playerEntity.y);
      return da - db;
    });
    const nearest = allBullets.slice(0, 5).map(b => ({ x: b.x / w, y: b.y / h, vx: b.vx / 200, vy: b.vy / 200, meta: b.meta }));

    // Player input flags (simple)
    const inputFlags = {
      left: !!this.cursors.left.isDown,
      right: !!this.cursors.right.isDown,
      up: !!this.cursors.up.isDown,
      down: !!this.cursors.down.isDown
    };

    const state = {
      player_pos: { x: this.playerEntity.x / w, y: this.playerEntity.y / h },
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
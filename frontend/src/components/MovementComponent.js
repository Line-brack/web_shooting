class MovementComponent {
  constructor(entity, speed = 200) {
    this.entity = entity;
    this.speed = speed;
  }

  moveTowards(targetX, targetY, dt) {
    const dx = targetX - this.entity.x;
    const dy = targetY - this.entity.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const nx = dx / dist;
    const ny = dy / dist;
    this.entity.x += nx * this.speed * dt;
    this.entity.y += ny * this.speed * dt;
  }
}

window.MovementComponent = MovementComponent;
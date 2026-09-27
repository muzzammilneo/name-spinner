// High-performance Canvas Particle & Confetti celebration engine
class CelebrationEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.ambientParticles = [];
    this.animId = null;
    this.width = 0;
    this.height = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initAmbient();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initAmbient() {
    this.ambientParticles = [];
    const count = Math.min(30, Math.floor(window.innerWidth / 40));
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        color: Math.random() > 0.5 ? 'rgba(0, 242, 254, ' : 'rgba(217, 70, 239, ',
        alpha: Math.random() * 0.4 + 0.1,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulseVal: Math.random() * Math.PI
      });
    }
  }

  // Trigger celebration explosion centered around the slot machine
  fireConfetti(originX = window.innerWidth / 2, originY = window.innerHeight * 0.38) {
    const colors = [
      '#FFD700', // Gold
      '#00f2fe', // Electric Cyan
      '#d946ef', // Neon Magenta
      '#8b5cf6', // Electric Violet
      '#38ef7d', // Bright Emerald
      '#ff007f', // Deep Pink
      '#ffffff'  // Pure White spark
    ];

    // Blast 120 confetti pieces + 60 high-velocity spark rays
    for (let i = 0; i < 110; i++) {
      const angle = (Math.PI * 2 * i) / 110 + (Math.random() - 0.5) * 0.5;
      const speed = 7 + Math.random() * 14;
      const size = 6 + Math.random() * 6;

      this.particles.push({
        type: 'confetti',
        x: originX + (Math.random() - 0.5) * 160,
        y: originY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.7 + Math.random() * 0.4) - 5,
        sizeX: size,
        sizeY: size * (0.4 + Math.random() * 0.6),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        tilt: Math.random() * Math.PI,
        tiltSpeed: 0.05 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.007 + Math.random() * 0.008,
        gravity: 0.28
      });
    }

    // Spark rays
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      this.particles.push({
        type: 'spark',
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.3 ? '#FFD700' : '#00f2fe',
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        gravity: 0.08
      });
    }

    if (!this.animId) {
      this.render();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update and draw ambient background dust
    for (const p of this.ambientParticles) {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      p.pulseVal += p.pulseSpeed;
      const currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.15;

      this.ctx.fillStyle = `${p.color}${Math.max(0.05, currentAlpha)})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Update and draw celebratory particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'confetti') {
        p.rotation += p.rotationSpeed;
        p.tilt += p.tiltSpeed;
        const width = p.sizeX * Math.cos(p.tilt);

        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-width / 2, -p.sizeY / 2, width, p.sizeY);
      } else {
        // Glowing spark
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // Keep loop active as long as there are particles, or always lightly update ambient
    this.animId = requestAnimationFrame(() => this.render());
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

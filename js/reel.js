// Slot Machine Reel Engine for NameRoll
// Handles physics-based spinning, dynamic velocity, motion blur, ticks, and landing

class SlotReel {
  constructor(options) {
    this.container = options.container; // The scrolling strip element
    this.viewport = options.viewport;   // Outer masked frame
    this.chassis = options.chassis;     // Entire slot machine housing for shake
    this.centerOverlay = options.centerOverlay;
    
    this.itemHeight = 92; // Standard item height in px (responsive-aware)
    this.visibleRows = 3;  // 3 or 5 rows
    this.isRolling = false;
    this.duration = 3500; // ms default
    this.currentNames = [];
    this.selectedWinner = null;
    this.lastWinnerSlotIndex = null;
    this.onRollStart = options.onRollStart || (() => {});
    this.onRollComplete = options.onRollComplete || (() => {});

    this.updateDimensions();
    window.addEventListener('resize', () => {
      this.updateDimensions();
      this.recenterCurrent();
    });
  }

  updateDimensions() {
    if (!this.viewport) return;
    const isMobile = window.innerWidth <= 640;
    this.itemHeight = isMobile ? 74 : 92;
    
    // Set viewport height dynamically based on visible rows
    const vpHeight = this.itemHeight * this.visibleRows;
    this.viewport.style.height = `${vpHeight}px`;
    
    // Position target guide line exactly at the center row
    const centerRowOffset = Math.floor(this.visibleRows / 2);
    const centerOffset = centerRowOffset * this.itemHeight;
    if (this.centerOverlay) {
      this.centerOverlay.style.top = `${centerOffset}px`;
      this.centerOverlay.style.height = `${this.itemHeight}px`;
    }
  }

  setVisibleRows(rows) {
    this.visibleRows = rows;
    this.updateDimensions();
    this.renderInitial(this.currentNames);
  }

  setDuration(ms) {
    this.duration = ms;
  }

  // Populate reel at rest with names, centering the first name in the target window
  renderInitial(names) {
    this.currentNames = names.slice();
    this.lastWinnerSlotIndex = null;
    this.container.innerHTML = '';
    this.container.style.transform = 'translate3d(0, 0px, 0)';
    this.container.style.filter = 'none';

    if (!names || names.length === 0) {
      return;
    }

    const centerRowOffset = Math.floor(this.visibleRows / 2);
    const padCount = Math.max(names.length * 3, 24);
    const fragment = document.createDocumentFragment();
    
    // Offset so names[0] sits directly at centerRowOffset inside the target reticle
    for (let i = 0; i < padCount; i++) {
      const nameIndex = (i - centerRowOffset + names.length * 1000) % names.length;
      const name = names[nameIndex];
      const slot = this.createSlotElement(name, nameIndex);
      fragment.appendChild(slot);
    }

    this.container.appendChild(fragment);
  }

  recenterCurrent() {
    if (!this.isRolling && this.container.children.length > 0) {
      if (this.lastWinnerSlotIndex !== null) {
        const centerRowOffset = Math.floor(this.visibleRows / 2);
        const finalY = (this.lastWinnerSlotIndex - centerRowOffset) * this.itemHeight;
        this.container.style.transition = 'none';
        this.container.style.transform = `translate3d(0, -${finalY}px, 0)`;
      } else {
        this.container.style.transition = 'none';
        this.container.style.transform = 'translate3d(0, 0px, 0)';
      }
    }
  }

  createSlotElement(name, originalIndex = 0) {
    const div = document.createElement('div');
    div.className = 'reel-slot-item';
    div.style.height = `${this.itemHeight}px`;
    div.dataset.name = name;
    div.dataset.index = originalIndex;

    const inner = document.createElement('div');
    inner.className = 'reel-slot-content';

    const text = document.createElement('span');
    text.className = 'slot-name-text';
    text.textContent = name;
    
    // Scale text if name is exceptionally long
    if (name.length > 18) {
      text.classList.add('text-compact');
    } else if (name.length > 28) {
      text.classList.add('text-micro');
    }

    inner.appendChild(text);
    div.appendChild(inner);
    return div;
  }

  // Execute the roll with physics deceleration
  roll(names, forcedWinnerIndex = null) {
    if (this.isRolling || !names || names.length < 2) return;

    this.isRolling = true;
    this.onRollStart();

    // Pick random winner
    const winnerIndex = forcedWinnerIndex !== null 
      ? forcedWinnerIndex 
      : Math.floor(Math.random() * names.length);
    const winnerName = names[winnerIndex];
    this.selectedWinner = { name: winnerName, index: winnerIndex };

    // Determine how many items to roll through based on duration
    const speedMultiplier = this.duration / 3500;
    const baseCycles = Math.round(50 * speedMultiplier);
    const sequenceCount = Math.max(35, baseCycles);

    // Build the dynamic reel strip
    this.container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    const sequence = [];
    // Populate spinning sequence leading up to the winner
    for (let i = 0; i < sequenceCount; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      sequence.push(name);
    }

    // The winning name is placed at winnerSlotIndex
    const winnerSlotIndex = sequenceCount;
    sequence.push(winnerName);

    // Pad items after the winner so all lower visible rows are fully populated
    for (let i = 1; i <= this.visibleRows + 2; i++) {
      sequence.push(names[(winnerIndex + i) % names.length]);
    }

    sequence.forEach((name, i) => {
      const slot = this.createSlotElement(name, i);
      fragment.appendChild(slot);
    });

    this.container.appendChild(fragment);
    this.lastWinnerSlotIndex = winnerSlotIndex;

    // Calculate total scroll distance:
    // To place winnerSlotIndex exactly in the center row target (at centerRowOffset * itemHeight):
    // Position of slot in viewport = winnerSlotIndex * itemHeight - finalY = centerRowOffset * itemHeight
    // Therefore: finalY = (winnerSlotIndex - centerRowOffset) * itemHeight
    const centerRowOffset = Math.floor(this.visibleRows / 2);
    const finalY = (winnerSlotIndex - centerRowOffset) * this.itemHeight;
    const overshootDistance = 14; // Subtle mechanical bounce in px

    const startTime = performance.now();
    let lastTickPosition = 0;
    let lastFrameTime = startTime;
    let hasPlayedLockIn = false;

    // Quintic ease out for authentic momentum and gradual deceleration
    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      lastFrameTime = currentTime;

      let currentY;
      let blurAmount = 0;

      if (progress < 0.92) {
        // Main spinning phase with smooth deceleration
        const phaseProgress = progress / 0.92;
        const eased = easeOutQuint(phaseProgress);
        currentY = eased * (finalY + overshootDistance);

        // Velocity-based motion blur
        const remainingProgress = 1 - phaseProgress;
        const velocity = (finalY / this.duration) * Math.pow(remainingProgress, 2.8) * 12;
        blurAmount = Math.min(Math.max(0, velocity * 0.18), 7);
      } else {
        // Rebound/overshoot settlement phase (last 8% of time)
        const bounceProgress = (progress - 0.92) / 0.08;
        // Ease back from overshoot to exact final landing position
        const bounceEase = Math.sin(bounceProgress * (Math.PI / 2));
        currentY = (finalY + overshootDistance) - (overshootDistance * bounceEase);
        blurAmount = 0;

        if (!hasPlayedLockIn && bounceProgress > 0.5) {
          hasPlayedLockIn = true;
          window.soundEngine.playLockIn();
          if (this.chassis) {
            this.chassis.classList.remove('reel-lock-shake');
            void this.chassis.offsetWidth; // Force DOM reflow
            this.chassis.classList.add('reel-lock-shake');
          }
        }
      }

      // Trigger ratchet tick sound as items pass through the center line
      const passedItems = Math.floor(currentY / this.itemHeight);
      if (passedItems > lastTickPosition) {
        const speedRatio = Math.max(0.1, 1 - progress);
        window.soundEngine.playTick(speedRatio);
        lastTickPosition = passedItems;
      }

      // Apply transform & directional blur
      this.container.style.transform = `translate3d(0, -${currentY.toFixed(2)}px, 0)`;
      this.container.style.filter = blurAmount > 0.4 ? `blur(${blurAmount.toFixed(1)}px)` : 'none';

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Landed precisely at the center target!
        this.container.style.transform = `translate3d(0, -${finalY}px, 0)`;
        this.container.style.filter = 'none';

        // Highlight the winning slot element inside the center reticle
        const winningElement = this.container.children[winnerSlotIndex];
        if (winningElement) {
          winningElement.classList.add('winning-slot-highlight');
        }

        setTimeout(() => {
          this.isRolling = false;
          this.onRollComplete(this.selectedWinner);
        }, 120);
      }
    };

    requestAnimationFrame(animate);
  }
}

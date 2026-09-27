// NameRoll — Main Application Logic
// Orchestrates Reel, Audio, Celebrations, State, and UI

document.addEventListener('DOMContentLoaded', () => {
  // Preset libraries
  const PRESETS = {
    friends: [
      'Afif',
      'Bulla',
      'Farooque',
      'Muzzammil',
      'Islam Khan',
      'Mujahid',
      'Sahidulla',
      'Sajid',
      'Sartaj',
      'Washim',
      'Khurseed',
      'Zamil',
      'Asker'
    ],
    standup: [
      'Alex Rivera',
      'Jordan Lee',
      'Sarah Jenkins',
      'Muzammil Khan',
      'Elena Rostova',
      'David Chen',
      'Priya Patel',
      'Marcus Vance'
    ],
    classroom: [
      'Aisha Khan',
      'Rahul Sharma',
      'Sarah Ali',
      'Daniel Joseph',
      'Liam Chen',
      'Maya Patel',
      'Noah Smith',
      'Olivia Davis'
    ],
    secretSanta: [
      'Alice Cooper',
      'Bob Miller',
      'Charlie Brown',
      'Diana Prince',
      'Ethan Hunt',
      'Fiona Gallagher',
      'George Clark',
      'Hannah Abbott'
    ],
    lunch: [
      'Sushi Express',
      'Taco Fiesta',
      'Artisan Burger Lab',
      'Tokyo Ramen House',
      'Fresh Green Bowls',
      'Woodfired Pizza Co.'
    ],
    giveaway: [
      'Emma Watson',
      'Lucas Taylor',
      'Sophia Rodriguez',
      'Mason Brooks',
      'Isabella Kim',
      'James Miller',
      'Amelia Moore',
      'Benjamin Hayes'
    ]
  };

  // State
  let names = [];
  let history = [];
  let settings = {
    duration: 3500,
    visibleRows: 3,
    autoRemoveWinner: false,
    allowDuplicates: true
  };
  let currentWinner = null;

  // DOM Elements
  const reelViewport = document.getElementById('reelViewport');
  const reelStrip = document.getElementById('reelStrip');
  const reelCenterTarget = document.getElementById('reelCenterTarget');
  const slotMachineChassis = document.getElementById('slotMachineChassis');
  const machineStatusPill = document.getElementById('machineStatusPill');
  const reelEmptyState = document.getElementById('reelEmptyState');
  const emptySampleBtn = document.getElementById('emptySampleBtn');

  const rollBtn = document.getElementById('rollBtn');
  const rollBtnText = document.getElementById('rollBtnText');

  const winnerRevealCard = document.getElementById('winnerRevealCard');
  const winnerNameDisplay = document.getElementById('winnerNameDisplay');
  const copyWinnerBtn = document.getElementById('copyWinnerBtn');
  const removeWinnerBtn = document.getElementById('removeWinnerBtn');
  const rollAgainBtn = document.getElementById('rollAgainBtn');

  const namesTextarea = document.getElementById('namesTextarea');
  const namesChipsContainer = document.getElementById('namesChipsContainer');
  const textareaWrapper = document.getElementById('textareaWrapper');
  const tabTextarea = document.getElementById('tabTextarea');
  const tabChips = document.getElementById('tabChips');

  const namesCountBadge = document.getElementById('namesCountBadge');
  const duplicateWarning = document.getElementById('duplicateWarning');

  const quickAddForm = document.getElementById('quickAddForm');
  const quickAddInput = document.getElementById('quickAddInput');

  const presetsBtn = document.getElementById('presetsBtn');
  const presetsMenu = document.getElementById('presetsMenu');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const sortBtn = document.getElementById('sortBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  const historyList = document.getElementById('historyList');
  const historyCountBadge = document.getElementById('historyCountBadge');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const modalSoundToggle = document.getElementById('modalSoundToggle');
  const autoRemoveToggle = document.getElementById('autoRemoveToggle');
  const allowDuplicatesToggle = document.getElementById('allowDuplicatesToggle');
  const speedSegmented = document.getElementById('speedSegmented');
  const rowsSegmented = document.getElementById('rowsSegmented');

  const toastContainer = document.getElementById('toastContainer');

  // Initialize Engines
  const celebration = new CelebrationEngine('celebrationCanvas');
  const reel = new SlotReel({
    container: reelStrip,
    viewport: reelViewport,
    chassis: slotMachineChassis,
    centerOverlay: reelCenterTarget,
    onRollStart: () => {
      rollBtn.disabled = true;
      rollBtn.classList.add('is-rolling');
      rollBtnText.textContent = 'ROLLING...';
      slotMachineChassis.classList.add('is-rolling');
      slotMachineChassis.classList.remove('has-winner');
      machineStatusPill.textContent = 'SPINNING';
      winnerRevealCard.classList.remove('show');
    },
    onRollComplete: (winnerObj) => {
      rollBtn.disabled = false;
      rollBtn.classList.remove('is-rolling');
      rollBtnText.textContent = 'ROLL';
      slotMachineChassis.classList.remove('is-rolling');
      slotMachineChassis.classList.add('has-winner');
      machineStatusPill.textContent = 'WINNER!';

      currentWinner = winnerObj;
      handleWinnerSelected(winnerObj);
    }
  });

  // Load Saved State or Default
  function loadPersistedState() {
    try {
      const savedNames = localStorage.getItem('nameroll_names');
      if (savedNames) {
        names = JSON.parse(savedNames);
      } else {
        // High-quality initial default
        names = PRESETS.classroom.slice();
      }

      const savedHistory = localStorage.getItem('nameroll_history');
      if (savedHistory) {
        history = JSON.parse(savedHistory);
      }

      const savedSettings = localStorage.getItem('nameroll_settings');
      if (savedSettings) {
        settings = Object.assign(settings, JSON.parse(savedSettings));
      }
    } catch (e) {
      names = PRESETS.classroom.slice();
    }
  }

  function saveState() {
    localStorage.setItem('nameroll_names', JSON.stringify(names));
    localStorage.setItem('nameroll_history', JSON.stringify(history));
    localStorage.setItem('nameroll_settings', JSON.stringify(settings));
  }

  // Update UI Elements
  function syncUI() {
    // Sync textarea text
    namesTextarea.value = names.join('\n');

    // Update count badge
    const count = names.length;
    namesCountBadge.textContent = `${count} ${count === 1 ? 'name' : 'names'}`;

    // Update empty states & roll button state
    if (count < 2) {
      reelEmptyState.style.display = 'flex';
      rollBtn.disabled = true;
      rollBtn.title = 'Add at least 2 names to roll';
      machineStatusPill.textContent = count === 0 ? 'EMPTY' : 'NEED 2+';
    } else {
      reelEmptyState.style.display = 'none';
      if (!reel.isRolling) {
        rollBtn.disabled = false;
        rollBtn.title = 'Press to roll or hit Spacebar';
        if (!currentWinner) {
          machineStatusPill.textContent = 'READY';
        }
      }
    }

    // Check duplicates
    checkForDuplicates();

    // Render chips
    renderChips();

    // Render history
    renderHistory();

    // Render reel at rest
    if (!reel.isRolling) {
      reel.renderInitial(names);
    }

    // Sync settings in modal
    updateSettingsUI();
  }

  function checkForDuplicates() {
    if (!settings.allowDuplicates) {
      // deduplicate
      const unique = Array.from(new Set(names));
      if (unique.length !== names.length) {
        names = unique;
        namesTextarea.value = names.join('\n');
        showToast('Duplicates removed automatically');
      }
      duplicateWarning.classList.remove('show');
      return;
    }

    const seen = new Set();
    const hasDups = names.some(n => seen.size === seen.add(n.toLowerCase().trim()).size);
    if (hasDups) {
      duplicateWarning.classList.add('show');
    } else {
      duplicateWarning.classList.remove('show');
    }
  }

  function renderChips() {
    namesChipsContainer.innerHTML = '';
    if (names.length === 0) {
      namesChipsContainer.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem;">No names yet. Add names using the input below or switch to Text view.</span>';
      return;
    }

    names.forEach((name, index) => {
      const chip = document.createElement('div');
      chip.className = 'name-chip';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-chip-delete';
      delBtn.setAttribute('aria-label', `Remove ${name}`);
      delBtn.innerHTML = '&times;';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        removeNameByIndex(index);
      };

      chip.appendChild(nameSpan);
      chip.appendChild(delBtn);
      namesChipsContainer.appendChild(chip);
    });
  }

  function renderHistory() {
    historyCountBadge.textContent = history.length;
    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-empty-text">No picks yet. Roll the reel to make your first pick!</div>';
      return;
    }

    historyList.innerHTML = '';
    history.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'history-item';

      const wrap = document.createElement('div');
      wrap.className = 'history-name-wrap';

      const rank = document.createElement('span');
      rank.className = 'history-rank';
      rank.textContent = `#${history.length - idx}`;

      const name = document.createElement('span');
      name.className = 'history-name';
      name.textContent = item.name;

      wrap.appendChild(rank);
      wrap.appendChild(name);

      const time = document.createElement('span');
      time.className = 'history-time';
      time.textContent = item.time;

      el.appendChild(wrap);
      el.appendChild(time);
      historyList.appendChild(el);
    });
  }

  function updateSettingsUI() {
    const isMuted = window.soundEngine.isMuted();
    soundToggleBtn.classList.toggle('active', !isMuted);
    soundOnIcon.style.display = isMuted ? 'none' : 'block';
    soundOffIcon.style.display = isMuted ? 'block' : 'none';
    modalSoundToggle.checked = !isMuted;

    autoRemoveToggle.checked = settings.autoRemoveWinner;
    allowDuplicatesToggle.checked = settings.allowDuplicates;

    // Speed segments
    Array.from(speedSegmented.children).forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.speed, 10) === settings.duration);
    });

    // Visible rows segments
    Array.from(rowsSegmented.children).forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.rows, 10) === settings.visibleRows);
    });

    reel.setDuration(settings.duration);
    reel.setVisibleRows(settings.visibleRows);
  }

  // Winner Selection Handler
  function handleWinnerSelected(winner) {
    if (!winner) return;

    // Sound and visual celebration
    window.soundEngine.playWinnerChime();
    celebration.fireConfetti();

    // Reveal winner card
    winnerNameDisplay.textContent = winner.name;
    winnerRevealCard.classList.add('show');

    // Add to History
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    history.unshift({
      name: winner.name,
      time: timeString,
      timestamp: Date.now()
    });
    // Keep last 30 picks
    if (history.length > 30) history.pop();

    saveState();
    renderHistory();

    // Auto-remove if enabled
    if (settings.autoRemoveWinner) {
      setTimeout(() => {
        removeWinnerFromNames(false);
      }, 1200);
    }
  }

  function removeWinnerFromNames(showNotification = true) {
    if (!currentWinner) return;
    const idx = names.findIndex(n => n.trim().toLowerCase() === currentWinner.name.trim().toLowerCase());
    if (idx !== -1) {
      const removed = names.splice(idx, 1)[0];
      currentWinner = null;
      winnerRevealCard.classList.remove('show');
      slotMachineChassis.classList.remove('has-winner');
      saveState();
      syncUI();
      if (showNotification) {
        showToast(`"${removed}" removed from list`);
      }
    }
  }

  function removeNameByIndex(index) {
    if (index >= 0 && index < names.length) {
      const removed = names.splice(index, 1)[0];
      saveState();
      syncUI();
      showToast(`Removed "${removed}"`);
    }
  }

  // Toast Notification System
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  // Clipboard Helper
  function copyWinner() {
    if (!currentWinner) return;
    navigator.clipboard.writeText(currentWinner.name)
      .then(() => {
        showToast(`Copied "${currentWinner.name}" to clipboard`);
      })
      .catch(() => {
        showToast(`Selected: ${currentWinner.name}`);
      });
  }

  // Primary ROLL trigger
  function doRoll() {
    if (reel.isRolling) return;
    if (names.length < 2) {
      showToast('Add at least 2 names to roll');
      window.soundEngine.playClick();
      return;
    }
    window.soundEngine.playClick();
    reel.roll(names);
  }

  // Event Listeners

  // Textarea input
  namesTextarea.addEventListener('input', () => {
    const lines = namesTextarea.value.split('\n');
    names = lines
      .map(l => l.trim())
      .filter(l => l.length > 0);

    saveState();
    const count = names.length;
    namesCountBadge.textContent = `${count} ${count === 1 ? 'name' : 'names'}`;

    if (count < 2) {
      reelEmptyState.style.display = 'flex';
      rollBtn.disabled = true;
    } else {
      reelEmptyState.style.display = 'none';
      rollBtn.disabled = false;
    }
    checkForDuplicates();
    renderChips();
    reel.renderInitial(names);
  });

  // Quick Add Single Form
  quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = quickAddInput.value.trim();
    if (!val) return;

    if (!settings.allowDuplicates && names.some(n => n.toLowerCase() === val.toLowerCase())) {
      showToast(`"${val}" already in list!`);
      return;
    }

    names.push(val);
    quickAddInput.value = '';
    saveState();
    syncUI();
    showToast(`Added "${val}"`);
    window.soundEngine.playClick();
  });

  // Roll Button
  rollBtn.addEventListener('click', doRoll);

  // Winner Actions
  copyWinnerBtn.addEventListener('click', () => {
    window.soundEngine.playClick();
    copyWinner();
  });

  removeWinnerBtn.addEventListener('click', () => {
    window.soundEngine.playClick();
    removeWinnerFromNames(true);
  });

  rollAgainBtn.addEventListener('click', () => {
    window.soundEngine.playClick();
    doRoll();
  });

  // Tab Switching
  tabTextarea.addEventListener('click', () => {
    tabTextarea.classList.add('active');
    tabChips.classList.remove('active');
    textareaWrapper.style.display = 'block';
    namesChipsContainer.classList.remove('active');
  });

  tabChips.addEventListener('click', () => {
    tabChips.classList.add('active');
    tabTextarea.classList.remove('active');
    textareaWrapper.style.display = 'none';
    namesChipsContainer.classList.add('active');
    renderChips();
  });

  // Toolbar Actions
  presetsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    presetsMenu.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    presetsMenu.classList.remove('open');
  });

  presetsMenu.querySelectorAll('.preset-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const presetKey = item.dataset.preset;
      if (PRESETS[presetKey]) {
        names = PRESETS[presetKey].slice();
        currentWinner = null;
        winnerRevealCard.classList.remove('show');
        slotMachineChassis.classList.remove('has-winner');
        saveState();
        syncUI();
        presetsMenu.classList.remove('open');
        showToast(`Loaded ${item.textContent.trim()} list`);
        window.soundEngine.playClick();
      }
    });
  });

  emptySampleBtn.addEventListener('click', () => {
    names = PRESETS.classroom.slice();
    saveState();
    syncUI();
    showToast('Loaded classroom sample names');
    window.soundEngine.playClick();
  });

  // Shuffle
  shuffleBtn.addEventListener('click', () => {
    if (names.length < 2) return;
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    saveState();
    syncUI();
    showToast('Names shuffled!');
    window.soundEngine.playClick();
  });

  // Sort A-Z
  sortBtn.addEventListener('click', () => {
    if (names.length < 2) return;
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    saveState();
    syncUI();
    showToast('Names sorted A-Z');
    window.soundEngine.playClick();
  });

  // Clear All
  clearAllBtn.addEventListener('click', () => {
    if (names.length === 0) return;
    if (confirm('Are you sure you want to clear all names?')) {
      names = [];
      currentWinner = null;
      winnerRevealCard.classList.remove('show');
      slotMachineChassis.classList.remove('has-winner');
      saveState();
      syncUI();
      showToast('All names cleared');
      window.soundEngine.playClick();
    }
  });

  // History Clear
  clearHistoryBtn.addEventListener('click', () => {
    if (history.length === 0) return;
    history = [];
    saveState();
    renderHistory();
    showToast('History cleared');
    window.soundEngine.playClick();
  });

  // Sound Toggle (Header)
  soundToggleBtn.addEventListener('click', () => {
    const newMuted = !window.soundEngine.isMuted();
    window.soundEngine.setMuted(newMuted);
    updateSettingsUI();
    if (!newMuted) {
      window.soundEngine.playClick();
    }
    showToast(newMuted ? 'Sound muted' : 'Sound enabled');
  });

  // Modal Settings
  openSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('open');
    window.soundEngine.playClick();
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('open');
    window.soundEngine.playClick();
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('open');
    }
  });

  modalSoundToggle.addEventListener('change', () => {
    window.soundEngine.setMuted(!modalSoundToggle.checked);
    updateSettingsUI();
    if (modalSoundToggle.checked) {
      window.soundEngine.playClick();
    }
  });

  autoRemoveToggle.addEventListener('change', () => {
    settings.autoRemoveWinner = autoRemoveToggle.checked;
    saveState();
    window.soundEngine.playClick();
  });

  allowDuplicatesToggle.addEventListener('change', () => {
    settings.allowDuplicates = allowDuplicatesToggle.checked;
    saveState();
    syncUI();
    window.soundEngine.playClick();
  });

  // Speed segmented buttons
  speedSegmented.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed, 10);
      settings.duration = speed;
      saveState();
      updateSettingsUI();
      window.soundEngine.playClick();
    });
  });

  // Visible rows segmented buttons
  rowsSegmented.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rows = parseInt(btn.dataset.rows, 10);
      settings.visibleRows = rows;
      saveState();
      updateSettingsUI();
      window.soundEngine.playClick();
    });
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // If modal is open, Escape closes it
    if (e.key === 'Escape') {
      settingsModal.classList.remove('open');
      presetsMenu.classList.remove('open');
      return;
    }

    // Spacebar or Enter to roll, provided user is not actively typing in an input or textarea
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.tagName === 'INPUT' ||
      activeEl.isContentEditable
    );

    if (!isTyping && (e.code === 'Space' || e.key === 'Enter')) {
      e.preventDefault();
      doRoll();
    }
  });

  // Initial Boot
  loadPersistedState();
  syncUI();
});

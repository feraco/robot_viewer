export class FloatingMotionControls {
  constructor(motionController) {
    this.motionController = motionController;
    this.container = null;
    this.elements = {};
    this.isVisible = false;

    this.createControls();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  createControls() {
    this.container = document.createElement('div');
    this.container.id = 'floating-motion-controls';
    this.container.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%) translateY(150px);
      z-index: 500;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 50px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(20px);
      opacity: 0;
      transition: all 0.4s var(--spring);
      pointer-events: none;
    `;

    this.container.innerHTML = `
      <button id="floating-play-btn" style="
        width: 56px;
        height: 56px;
        padding: 0;
        background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s var(--spring);
        box-shadow: 0 4px 16px rgba(76, 175, 80, 0.4);
      " title="Play/Pause (Space)">
        Play
      </button>

      <div style="
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 200px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span id="floating-current-time" style="
            color: var(--text-primary);
            font-size: 14px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
          ">0.0s</span>
          <span id="floating-duration" style="
            color: var(--text-tertiary);
            font-size: 12px;
            font-variant-numeric: tabular-nums;
          ">0.0s</span>
        </div>

        <div id="floating-timeline-container" style="
          position: relative;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
        ">
          <div id="floating-timeline-progress" style="
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: linear-gradient(90deg, var(--accent) 0%, #2196f3 100%);
            width: 0%;
            transition: width 0.05s linear;
            border-radius: 4px;
          "></div>
          <div id="floating-timeline-handle" style="
            position: absolute;
            left: 0;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            background: white;
            border: 2px solid var(--accent);
            border-radius: 50%;
            cursor: grab;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: transform 0.1s;
          "></div>
        </div>
      </div>

      <div style="
        display: flex;
        gap: 8px;
        align-items: center;
        padding-left: 8px;
        border-left: 1px solid var(--glass-border);
      ">
        <button id="floating-stop-btn" style="
          width: 40px;
          height: 40px;
          padding: 0;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        " title="Stop">
          Stop
        </button>

        <label style="
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          user-select: none;
        ">
          <input type="checkbox" id="floating-loop" checked style="
            cursor: pointer;
            width: 16px;
            height: 16px;
          " />
          Loop
        </label>

        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
        ">
          <span style="
            color: var(--text-secondary);
            font-size: 11px;
          ">Speed:</span>
          <input
            type="range"
            id="floating-speed"
            min="0.1"
            max="3"
            step="0.1"
            value="1"
            style="width: 80px; cursor: pointer;"
          />
          <span id="floating-speed-value" style="
            color: var(--text-primary);
            font-size: 12px;
            font-weight: 600;
            min-width: 38px;
            font-variant-numeric: tabular-nums;
          ">1.0x</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.elements = {
      playBtn: this.container.querySelector('#floating-play-btn'),
      stopBtn: this.container.querySelector('#floating-stop-btn'),
      currentTime: this.container.querySelector('#floating-current-time'),
      duration: this.container.querySelector('#floating-duration'),
      timeline: this.container.querySelector('#floating-timeline-container'),
      timelineProgress: this.container.querySelector('#floating-timeline-progress'),
      timelineHandle: this.container.querySelector('#floating-timeline-handle'),
      loopCheckbox: this.container.querySelector('#floating-loop'),
      speedSlider: this.container.querySelector('#floating-speed'),
      speedValue: this.container.querySelector('#floating-speed-value')
    };
  }

  setupEventListeners() {
    this.elements.playBtn.addEventListener('click', () => {
      this.togglePlayPause();
    });

    this.elements.playBtn.addEventListener('mouseenter', () => {
      this.elements.playBtn.style.transform = 'scale(1.1)';
      this.elements.playBtn.style.boxShadow = '0 6px 24px rgba(76, 175, 80, 0.6)';
    });

    this.elements.playBtn.addEventListener('mouseleave', () => {
      this.elements.playBtn.style.transform = 'scale(1)';
      this.elements.playBtn.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.4)';
    });

    this.elements.stopBtn.addEventListener('click', () => {
      this.motionController.stop();
    });

    this.elements.stopBtn.addEventListener('mouseenter', () => {
      this.elements.stopBtn.style.background = 'rgba(255, 255, 255, 0.15)';
      this.elements.stopBtn.style.transform = 'scale(1.1)';
    });

    this.elements.stopBtn.addEventListener('mouseleave', () => {
      this.elements.stopBtn.style.background = 'rgba(255, 255, 255, 0.08)';
      this.elements.stopBtn.style.transform = 'scale(1)';
    });

    this.elements.loopCheckbox.addEventListener('change', (e) => {
      this.motionController.setLoop(e.target.checked);
    });

    this.elements.speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      this.motionController.setPlaybackSpeed(speed);
      this.elements.speedValue.textContent = `${speed.toFixed(1)}x`;
    });

    let isDragging = false;
    const updateTimelineFromMouse = (e) => {
      const rect = this.elements.timeline.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const progress = x / rect.width;

      if (this.motionController.motionData) {
        const frame = Math.floor(progress * this.motionController.motionData.frameCount);
        this.motionController.setFrame(frame);

        this.elements.timelineProgress.style.width = `${progress * 100}%`;
        this.elements.timelineHandle.style.left = `${progress * 100}%`;
      }
    };

    this.elements.timeline.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.elements.timelineHandle.style.cursor = 'grabbing';
      updateTimelineFromMouse(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        updateTimelineFromMouse(e);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.elements.timelineHandle.style.cursor = 'grab';
      }
    });

    this.elements.timelineHandle.addEventListener('mouseenter', () => {
      if (!isDragging) {
        this.elements.timelineHandle.style.transform = 'translate(-50%, -50%) scale(1.2)';
      }
    });

    this.elements.timelineHandle.addEventListener('mouseleave', () => {
      if (!isDragging) {
        this.elements.timelineHandle.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    });

    this.motionController.on('onFrameChange', () => {
      this.updateTimeDisplay();
    });

    this.motionController.on('onPlayStateChange', (isPlaying) => {
      this.updatePlayButton(isPlaying);
    });

    this.motionController.on('onMotionLoad', () => {
      this.show();
      this.updateTimeDisplay();
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.isVisible) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          this.togglePlayPause();
        }
      }
    });
  }

  togglePlayPause() {
    if (this.motionController.isPlaying) {
      this.motionController.pause();
    } else {
      this.motionController.play();
    }
  }

  updatePlayButton(isPlaying) {
    this.elements.playBtn.textContent = isPlaying ? 'Pause' : 'Play';
    if (isPlaying) {
      this.elements.playBtn.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
      this.elements.playBtn.style.boxShadow = '0 4px 16px rgba(255, 152, 0, 0.4)';
    } else {
      this.elements.playBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
      this.elements.playBtn.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.4)';
    }
  }

  updateTimeDisplay() {
    const currentTime = this.motionController.getCurrentTime();
    const duration = this.motionController.getDuration();
    const progress = this.motionController.getProgress();

    this.elements.currentTime.textContent = `${currentTime.toFixed(1)}s`;
    this.elements.duration.textContent = `${duration.toFixed(1)}s`;

    this.elements.timelineProgress.style.width = `${progress * 100}%`;
    this.elements.timelineHandle.style.left = `${progress * 100}%`;
  }

  show() {
    if (this.isVisible) return;
    this.isVisible = true;
    this.container.style.opacity = '1';
    this.container.style.transform = 'translateX(-50%) translateY(0)';
    this.container.style.pointerEvents = 'auto';
  }

  hide() {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(-50%) translateY(150px)';
    this.container.style.pointerEvents = 'none';
  }

  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

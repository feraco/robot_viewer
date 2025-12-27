import { ROBOT_CONFIGS } from '../loaders/CSVMotionLoader.js';
import { SequenceBuilderUI } from './SequenceBuilderUI.js';
import { MotionPresetLibrary } from '../models/MotionPresetLibrary.js';

export class CSVMotionUI {
  constructor(container, motionController, sequenceManager = null) {
    this.container = container;
    this.motionController = motionController;
    this.sequenceManager = sequenceManager;
    this.elements = {};
    this.isDraggingTimeline = false;
    this.presetLibrary = new MotionPresetLibrary();
    this.sequenceBuilderUI = null;

    this.init();
    this.setupEventListeners();
  }

  init() {
    const panel = document.createElement('div');
    panel.className = 'csv-motion-panel';
    panel.style.cssText = `
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
    `;

    panel.innerHTML = `
      <div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input
            type="file"
            id="csv-motion-file"
            accept=".csv"
            style="display: none;"
          />
          <button
            id="csv-load-btn"
            style="
              flex: 1;
              padding: 8px 12px;
              background: var(--accent);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
              transition: all 0.2s;
            "
          >
            Load CSV
          </button>

          <select
            id="csv-robot-type"
            style="
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.08);
              color: var(--text-primary);
              border: 1px solid var(--glass-border);
              border-radius: 8px;
              font-size: 12px;
              cursor: pointer;
            "
          >
            <option value="auto">Auto-detect</option>
            <option value="G1">G1</option>
            <option value="H1_2">H1_2</option>
            <option value="H1">H1</option>
          </select>
        </div>

        <div id="csv-motion-info" style="
          color: var(--text-tertiary);
          font-size: 11px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          margin-bottom: 12px;
          display: none;
        "></div>
      </div>

      <div id="csv-sequence-builder-container" style="
        margin-bottom: 12px;
      "></div>

      <div id="csv-playback-controls" style="display: none; flex: 1; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="csv-play-btn" style="
            padding: 8px 16px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
          ">▶ Play</button>

          <button id="csv-stop-btn" style="
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-primary);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
          ">■ Stop</button>

          <label style="
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-secondary);
            font-size: 11px;
            margin-left: auto;
            cursor: pointer;
          ">
            <input type="checkbox" id="csv-loop" checked style="cursor: pointer;" />
            Loop
          </label>
        </div>

        <div>
          <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            color: var(--text-tertiary);
            font-size: 11px;
          ">
            <span id="csv-current-time">0.0s</span>
            <span id="csv-duration">0.0s</span>
          </div>

          <div id="csv-timeline-container" style="
            position: relative;
            height: 32px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            cursor: pointer;
            overflow: hidden;
          ">
            <div id="csv-timeline-progress" style="
              position: absolute;
              left: 0;
              top: 0;
              height: 100%;
              background: var(--accent);
              width: 0%;
              transition: width 0.05s linear;
              opacity: 0.3;
            "></div>
            <div id="csv-timeline-handle" style="
              position: absolute;
              left: 0;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 14px;
              height: 14px;
              background: var(--accent);
              border: 2px solid white;
              border-radius: 50%;
              cursor: grab;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          </div>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <label style="color: var(--text-secondary); font-size: 11px; font-weight: 500;">Speed:</label>
          <input
            type="range"
            id="csv-speed"
            min="0.1"
            max="3"
            step="0.1"
            value="1"
            style="flex: 1; cursor: pointer;"
          />
          <span id="csv-speed-value" style="
            color: var(--text-primary);
            font-size: 11px;
            min-width: 38px;
            font-weight: 500;
          ">1.0x</span>
        </div>
      </div>
    `;

    this.container.appendChild(panel);

    this.elements = {
      fileInput: panel.querySelector('#csv-motion-file'),
      loadBtn: panel.querySelector('#csv-load-btn'),
      robotType: panel.querySelector('#csv-robot-type'),
      motionInfo: panel.querySelector('#csv-motion-info'),
      sequenceBuilderContainer: panel.querySelector('#csv-sequence-builder-container'),
      playbackControls: panel.querySelector('#csv-playback-controls'),
      playBtn: panel.querySelector('#csv-play-btn'),
      stopBtn: panel.querySelector('#csv-stop-btn'),
      loopCheckbox: panel.querySelector('#csv-loop'),
      currentTime: panel.querySelector('#csv-current-time'),
      duration: panel.querySelector('#csv-duration'),
      timeline: panel.querySelector('#csv-timeline-container'),
      timelineProgress: panel.querySelector('#csv-timeline-progress'),
      timelineHandle: panel.querySelector('#csv-timeline-handle'),
      speedSlider: panel.querySelector('#csv-speed'),
      speedValue: panel.querySelector('#csv-speed-value')
    };

    if (this.sequenceManager && this.elements.sequenceBuilderContainer) {
      this.sequenceBuilderUI = new SequenceBuilderUI(
        this.elements.sequenceBuilderContainer,
        this.sequenceManager,
        this.presetLibrary
      );
    }
  }

  setupEventListeners() {
    this.elements.loadBtn.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    this.elements.fileInput.addEventListener('change', (e) => {
      this.handleFileLoad(e.target.files[0]);
    });

    this.elements.playBtn.addEventListener('click', () => {
      this.togglePlayPause();
    });

    this.elements.stopBtn.addEventListener('click', () => {
      this.motionController.stop();
    });

    this.elements.loopCheckbox.addEventListener('change', (e) => {
      this.motionController.setLoop(e.target.checked);
    });

    this.elements.speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      this.motionController.setPlaybackSpeed(speed);
      this.elements.speedValue.textContent = `${speed.toFixed(1)}x`;
    });

    this.elements.timeline.addEventListener('mousedown', (e) => {
      this.isDraggingTimeline = true;
      this.updateTimelineFromMouse(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingTimeline) {
        this.updateTimelineFromMouse(e);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDraggingTimeline = false;
    });

    this.motionController.on('onFrameChange', (frame) => {
      this.updateTimeDisplay();
    });

    this.motionController.on('onPlayStateChange', (isPlaying) => {
      this.updatePlayButton(isPlaying);
    });

    this.motionController.on('onMotionLoad', (motionData) => {
      this.showMotionInfo(motionData);
    });
  }

  async handleFileLoad(file) {
    if (!file) return;

    try {
      const { CSVMotionLoader } = await import('../loaders/CSVMotionLoader.js');

      const robotType = this.elements.robotType.value === 'auto'
        ? null
        : this.elements.robotType.value;

      const motionData = await CSVMotionLoader.loadFromFile(file, robotType);
      this.motionController.resetAccumulatedTransforms();
      this.motionController.loadMotion(motionData, false);

      this.elements.playbackControls.style.display = 'block';
      this.updateTimeDisplay();
    } catch (error) {
      console.error('Failed to load CSV motion:', error);
      alert(`Failed to load CSV: ${error.message}`);
    }
  }

  showMotionInfo(motionData) {
    this.elements.motionInfo.style.display = 'block';
    this.elements.motionInfo.textContent =
      `${motionData.robotType} • ${motionData.frameCount} frames • ${motionData.duration.toFixed(2)}s @ ${motionData.fps}fps`;
  }

  togglePlayPause() {
    if (this.motionController.isPlaying) {
      this.motionController.pause();
    } else {
      this.motionController.play();
    }
  }

  updatePlayButton(isPlaying) {
    this.elements.playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    this.elements.playBtn.style.background = isPlaying ? '#ff9800' : '#4caf50';
  }

  updateTimeDisplay() {
    const currentTime = this.motionController.getCurrentTime();
    const duration = this.motionController.getDuration();
    const progress = this.motionController.getProgress();

    this.elements.currentTime.textContent = `${currentTime.toFixed(2)}s`;
    this.elements.duration.textContent = `${duration.toFixed(2)}s`;

    if (!this.isDraggingTimeline) {
      this.elements.timelineProgress.style.width = `${progress * 100}%`;
      this.elements.timelineHandle.style.left = `${progress * 100}%`;
    }
  }

  updateTimelineFromMouse(e) {
    const rect = this.elements.timeline.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const progress = x / rect.width;

    if (this.motionController.motionData) {
      const frame = Math.floor(progress * this.motionController.motionData.frameCount);
      this.motionController.setFrame(frame);

      this.elements.timelineProgress.style.width = `${progress * 100}%`;
      this.elements.timelineHandle.style.left = `${progress * 100}%`;
    }
  }

  update() {
    this.motionController.update();
  }

  dispose() {
    if (this.sequenceBuilderUI) {
      this.sequenceBuilderUI.dispose();
    }
    this.container.innerHTML = '';
  }
}

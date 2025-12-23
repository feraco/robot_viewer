import { ROBOT_CONFIGS } from '../loaders/CSVMotionLoader.js';

export class CSVMotionUI {
  constructor(container, motionController) {
    this.container = container;
    this.motionController = motionController;
    this.elements = {};
    this.isDraggingTimeline = false;

    this.init();
    this.setupEventListeners();
  }

  init() {
    const panel = document.createElement('div');
    panel.className = 'csv-motion-panel';
    panel.style.cssText = `
      background: #2a2a2a;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #fff; font-size: 14px;">CSV Motion</h3>

        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
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
              padding: 8px;
              background: #4a90e2;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            "
          >
            Load CSV
          </button>

          <select
            id="csv-robot-type"
            style="
              padding: 8px;
              background: #3a3a3a;
              color: white;
              border: 1px solid #555;
              border-radius: 4px;
              font-size: 12px;
            "
          >
            <option value="auto">Auto-detect</option>
            <option value="G1">G1</option>
            <option value="H1_2">H1_2</option>
            <option value="H1">H1</option>
          </select>
        </div>

        <div id="csv-motion-info" style="
          color: #999;
          font-size: 11px;
          margin-bottom: 10px;
          display: none;
        "></div>
      </div>

      <div id="csv-playback-controls" style="display: none;">
        <div style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center;">
          <button id="csv-play-btn" style="
            padding: 8px 16px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">▶ Play</button>

          <button id="csv-stop-btn" style="
            padding: 8px 16px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">■ Stop</button>

          <label style="
            display: flex;
            align-items: center;
            gap: 5px;
            color: #ccc;
            font-size: 11px;
            margin-left: auto;
          ">
            <input type="checkbox" id="csv-loop" checked />
            Loop
          </label>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            color: #999;
            font-size: 11px;
          ">
            <span id="csv-current-time">0.0s</span>
            <span id="csv-duration">0.0s</span>
          </div>

          <div id="csv-timeline-container" style="
            position: relative;
            height: 30px;
            background: #1a1a1a;
            border-radius: 4px;
            cursor: pointer;
            overflow: hidden;
          ">
            <div id="csv-timeline-progress" style="
              position: absolute;
              left: 0;
              top: 0;
              height: 100%;
              background: #4a90e2;
              width: 0%;
              transition: width 0.05s linear;
            "></div>
            <div id="csv-timeline-handle" style="
              position: absolute;
              left: 0;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
              cursor: grab;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="color: #ccc; font-size: 11px;">Speed:</label>
          <input
            type="range"
            id="csv-speed"
            min="0.1"
            max="3"
            step="0.1"
            value="1"
            style="flex: 1;"
          />
          <span id="csv-speed-value" style="
            color: #ccc;
            font-size: 11px;
            min-width: 35px;
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
      this.motionController.loadMotion(motionData);

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
    this.container.innerHTML = '';
  }
}

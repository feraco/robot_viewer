export class CSVPhysicsMotionUI {
  constructor(mujocoSimulationManager) {
    this.simulationManager = mujocoSimulationManager;
    this.panel = null;
    this.elements = {};
    this.isVisible = false;
    this.updateInterval = null;
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      background: rgba(18, 18, 24, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      display: none;
    `;

    this.panel.innerHTML = `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <h3 style="
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        ">Physics Motion Control</h3>
        <button id="csv-physics-close-btn" style="
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        ">×</button>
      </div>

      <div style="margin-bottom: 16px;">
        <input
          type="file"
          id="csv-physics-file"
          accept=".csv"
          style="display: none;"
        />
        <button
          id="csv-physics-load-btn"
          style="
            width: 100%;
            padding: 10px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
          "
        >
          Load CSV Motion
        </button>
      </div>

      <div id="csv-physics-motion-info" style="
        display: none;
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      ">
        <div style="margin-bottom: 6px;">
          <strong>Motion:</strong> <span id="csv-physics-filename">-</span>
        </div>
        <div style="margin-bottom: 6px;">
          <strong>Duration:</strong> <span id="csv-physics-duration">-</span>s
        </div>
        <div>
          <strong>Joints Mapped:</strong> <span id="csv-physics-joints">-</span>
        </div>
      </div>

      <div id="csv-physics-quick-motions" style="
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      ">
        <div style="
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 10px;
        ">Quick Load</div>
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        ">
          <button class="csv-physics-quick-btn" data-url="./g1_walk_forward.csv" style="
            padding: 8px;
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
            border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
          ">Walk Fwd</button>
          <button class="csv-physics-quick-btn" data-url="./g1_walk_backward.csv" style="
            padding: 8px;
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
            border: 1px solid rgba(255, 152, 0, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
          ">Walk Back</button>
          <button class="csv-physics-quick-btn" data-url="./g1_sidestep_left.csv" style="
            padding: 8px;
            background: rgba(156, 39, 176, 0.2);
            color: #9c27b0;
            border: 1px solid rgba(156, 39, 176, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
          ">Side L</button>
          <button class="csv-physics-quick-btn" data-url="./g1_sidestep_right.csv" style="
            padding: 8px;
            background: rgba(156, 39, 176, 0.2);
            color: #9c27b0;
            border: 1px solid rgba(156, 39, 176, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
          ">Side R</button>
        </div>
      </div>

      <div id="csv-physics-controls" style="
        display: none;
        flex-direction: column;
        gap: 12px;
      ">
        <div style="display: flex; gap: 8px;">
          <button id="csv-physics-play-btn" style="
            flex: 1;
            padding: 10px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
          ">▶ Play</button>
          <button id="csv-physics-stop-btn" style="
            flex: 1;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
          ">■ Stop</button>
        </div>

        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        ">
          <label style="
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
          ">
            <input type="checkbox" id="csv-physics-loop" style="cursor: pointer;">
            Loop
          </label>
        </div>

        <div style="
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
        ">
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span>Time:</span>
            <span><span id="csv-physics-current-time">0.0</span>s / <span id="csv-physics-total-time">0.0</span>s</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Status:</span>
            <span id="csv-physics-status" style="color: #4caf50;">Ready</span>
          </div>
        </div>

        <div>
          <label style="
            display: block;
            margin-bottom: 6px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.8);
          ">Speed: <span id="csv-physics-speed-value">1.0x</span></label>
          <input
            type="range"
            id="csv-physics-speed"
            min="0.1"
            max="3"
            step="0.1"
            value="1"
            style="width: 100%; cursor: pointer;"
          />
        </div>

        <div>
          <details style="
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 8px;
          ">
            <summary style="
              cursor: pointer;
              font-size: 11px;
              color: rgba(255, 255, 255, 0.8);
              font-weight: 500;
            ">PD Controller Gains</summary>
            <div style="margin-top: 10px;">
              <label style="
                display: block;
                margin-bottom: 6px;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.7);
              ">Kp: <span id="csv-physics-kp-value">100</span></label>
              <input
                type="range"
                id="csv-physics-kp"
                min="1"
                max="500"
                step="1"
                value="100"
                style="width: 100%; cursor: pointer;"
              />
            </div>
            <div style="margin-top: 8px;">
              <label style="
                display: block;
                margin-bottom: 6px;
                font-size: 11px;
                color: rgba(255, 255, 255, 0.7);
              ">Kd: <span id="csv-physics-kd-value">10</span></label>
              <input
                type="range"
                id="csv-physics-kd"
                min="0.1"
                max="100"
                step="0.1"
                value="10"
                style="width: 100%; cursor: pointer;"
              />
            </div>
          </details>
        </div>
      </div>
    `;

    this.elements = {
      closeBtn: this.panel.querySelector('#csv-physics-close-btn'),
      fileInput: this.panel.querySelector('#csv-physics-file'),
      loadBtn: this.panel.querySelector('#csv-physics-load-btn'),
      motionInfo: this.panel.querySelector('#csv-physics-motion-info'),
      filename: this.panel.querySelector('#csv-physics-filename'),
      duration: this.panel.querySelector('#csv-physics-duration'),
      joints: this.panel.querySelector('#csv-physics-joints'),
      controls: this.panel.querySelector('#csv-physics-controls'),
      playBtn: this.panel.querySelector('#csv-physics-play-btn'),
      stopBtn: this.panel.querySelector('#csv-physics-stop-btn'),
      loopCheckbox: this.panel.querySelector('#csv-physics-loop'),
      currentTime: this.panel.querySelector('#csv-physics-current-time'),
      totalTime: this.panel.querySelector('#csv-physics-total-time'),
      status: this.panel.querySelector('#csv-physics-status'),
      speedSlider: this.panel.querySelector('#csv-physics-speed'),
      speedValue: this.panel.querySelector('#csv-physics-speed-value'),
      kpSlider: this.panel.querySelector('#csv-physics-kp'),
      kpValue: this.panel.querySelector('#csv-physics-kp-value'),
      kdSlider: this.panel.querySelector('#csv-physics-kd'),
      kdValue: this.panel.querySelector('#csv-physics-kd-value'),
      quickButtons: this.panel.querySelectorAll('.csv-physics-quick-btn')
    };

    this.setupEventListeners();
    return this.panel;
  }

  setupEventListeners() {
    this.elements.closeBtn.addEventListener('click', () => this.hide());

    this.elements.loadBtn.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    this.elements.fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.loadCSVFile(e.target.files[0]);
      }
    });

    this.elements.quickButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        this.loadCSVFromURL(url);
      });
    });

    this.elements.playBtn.addEventListener('click', () => {
      this.togglePlayPause();
    });

    this.elements.stopBtn.addEventListener('click', () => {
      this.stopMotion();
    });

    this.elements.loopCheckbox.addEventListener('change', (e) => {
      if (this.simulationManager?.csvMotionPlayer) {
        this.simulationManager.csvMotionPlayer.setLoop(e.target.checked);
      }
    });

    this.elements.speedSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      this.elements.speedValue.textContent = `${speed.toFixed(1)}x`;
      if (this.simulationManager?.csvMotionPlayer) {
        this.simulationManager.csvMotionPlayer.setPlaybackSpeed(speed);
      }
    });

    this.elements.kpSlider.addEventListener('input', (e) => {
      const kp = parseFloat(e.target.value);
      this.elements.kpValue.textContent = kp;
      this.updatePDGains();
    });

    this.elements.kdSlider.addEventListener('input', (e) => {
      const kd = parseFloat(e.target.value);
      this.elements.kdValue.textContent = kd;
      this.updatePDGains();
    });
  }

  updatePDGains() {
    if (this.simulationManager?.csvMotionPlayer) {
      const kp = parseFloat(this.elements.kpSlider.value);
      const kd = parseFloat(this.elements.kdSlider.value);
      this.simulationManager.csvMotionPlayer.setPDGains(kp, kd);
    }
  }

  async loadCSVFile(file) {
    try {
      this.elements.status.textContent = 'Loading...';
      this.elements.status.style.color = '#ff9800';

      const player = this.simulationManager?.csvMotionPlayer;
      if (!player) {
        throw new Error('CSV motion player not available');
      }

      const motionData = await player.loadFromFile(file);

      this.elements.filename.textContent = file.name;
      this.elements.duration.textContent = motionData.duration.toFixed(2);
      this.elements.totalTime.textContent = motionData.duration.toFixed(1);
      this.elements.joints.textContent = player.jointMapping.size;

      this.elements.motionInfo.style.display = 'block';
      this.elements.controls.style.display = 'flex';

      this.elements.status.textContent = 'Ready';
      this.elements.status.style.color = '#4caf50';

      console.log('CSV motion loaded for physics simulation');
    } catch (error) {
      console.error('Failed to load CSV:', error);
      this.elements.status.textContent = 'Error';
      this.elements.status.style.color = '#f44336';
      alert(`Failed to load CSV: ${error.message}`);
    }
  }

  async loadCSVFromURL(url) {
    try {
      this.elements.status.textContent = 'Loading...';
      this.elements.status.style.color = '#ff9800';

      const player = this.simulationManager?.csvMotionPlayer;
      if (!player) {
        throw new Error('CSV motion player not available');
      }

      const motionData = await player.loadFromURL(url);

      const filename = url.split('/').pop();
      this.elements.filename.textContent = filename;
      this.elements.duration.textContent = motionData.duration.toFixed(2);
      this.elements.totalTime.textContent = motionData.duration.toFixed(1);
      this.elements.joints.textContent = player.jointMapping.size;

      this.elements.motionInfo.style.display = 'block';
      this.elements.controls.style.display = 'flex';

      this.elements.status.textContent = 'Ready';
      this.elements.status.style.color = '#4caf50';

      console.log('CSV motion loaded from URL for physics simulation');
    } catch (error) {
      console.error('Failed to load CSV from URL:', error);
      this.elements.status.textContent = 'Error';
      this.elements.status.style.color = '#f44336';
      alert(`Failed to load CSV: ${error.message}`);
    }
  }

  togglePlayPause() {
    const player = this.simulationManager?.csvMotionPlayer;
    if (!player) return;

    if (player.isPlaying) {
      player.pause();
      this.elements.playBtn.innerHTML = '▶ Play';
      this.elements.status.textContent = 'Paused';
      this.elements.status.style.color = '#ff9800';
      this.stopUpdateLoop();
    } else {
      player.play();
      this.elements.playBtn.innerHTML = '❚❚ Pause';
      this.elements.status.textContent = 'Playing';
      this.elements.status.style.color = '#4caf50';
      this.startUpdateLoop();
    }
  }

  stopMotion() {
    const player = this.simulationManager?.csvMotionPlayer;
    if (!player) return;

    player.stop();
    this.elements.playBtn.innerHTML = '▶ Play';
    this.elements.currentTime.textContent = '0.0';
    this.elements.status.textContent = 'Stopped';
    this.elements.status.style.color = '#607d8b';
    this.stopUpdateLoop();
  }

  startUpdateLoop() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      const player = this.simulationManager?.csvMotionPlayer;
      if (!player) return;

      const status = player.getStatus();
      this.elements.currentTime.textContent = status.currentTime.toFixed(1);

      if (!status.isPlaying) {
        this.elements.playBtn.innerHTML = '▶ Play';
        this.elements.status.textContent = 'Finished';
        this.elements.status.style.color = '#607d8b';
        this.stopUpdateLoop();
      }
    }, 100);
  }

  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
      this.isVisible = true;
    }
  }

  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
      this.isVisible = false;
      this.stopUpdateLoop();
    }
  }

  dispose() {
    this.stopUpdateLoop();
    if (this.panel && this.panel.parentElement) {
      this.panel.parentElement.removeChild(this.panel);
    }
    this.panel = null;
    this.elements = {};
  }
}

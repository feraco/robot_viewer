import { i18n } from '../utils/i18n.js';

export class MotionControlsUI {
  constructor(motionController) {
    this.motionController = motionController;
    this.panel = null;
    this.playButton = null;
    this.stopButton = null;
    this.progressBar = null;
    this.motionSelect = null;
    this.speedSlider = null;
    this.loopCheckbox = null;
    this.statusText = null;
    this.updateInterval = null;
  }

  createPanel() {
    const panel = document.createElement('div');
    panel.className = 'motion-controls-panel';
    panel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 15px;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 1000;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Motion Controls';
    title.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 4px;
      transition: background 0.2s;
    `;
    closeButton.onmouseover = () => closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
    closeButton.onmouseout = () => closeButton.style.background = 'none';
    closeButton.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeButton);

    const motionSelectContainer = document.createElement('div');
    motionSelectContainer.style.cssText = `
      margin-bottom: 12px;
    `;

    const motionLabel = document.createElement('label');
    motionLabel.textContent = 'Motion Preset:';
    motionLabel.style.cssText = `
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    `;

    this.motionSelect = document.createElement('select');
    this.motionSelect.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: white;
      font-size: 13px;
      cursor: pointer;
      outline: none;
    `;

    this.populateMotionSelect();

    motionSelectContainer.appendChild(motionLabel);
    motionSelectContainer.appendChild(this.motionSelect);

    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    `;

    this.playButton = document.createElement('button');
    this.playButton.textContent = '▶ Play';
    this.playButton.style.cssText = this.getButtonStyle('#4CAF50');
    this.playButton.onclick = () => this.playMotion();

    this.stopButton = document.createElement('button');
    this.stopButton.textContent = '■ Stop';
    this.stopButton.style.cssText = this.getButtonStyle('#f44336');
    this.stopButton.onclick = () => this.stopMotion();
    this.stopButton.disabled = true;

    controlsContainer.appendChild(this.playButton);
    controlsContainer.appendChild(this.stopButton);

    const speedContainer = document.createElement('div');
    speedContainer.style.cssText = `
      margin-bottom: 12px;
    `;

    const speedLabel = document.createElement('label');
    speedLabel.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    `;

    const speedLabelText = document.createElement('span');
    speedLabelText.textContent = 'Speed:';

    this.speedValue = document.createElement('span');
    this.speedValue.textContent = '1.0x';
    this.speedValue.style.cssText = `
      color: #4CAF50;
      font-weight: 600;
    `;

    speedLabel.appendChild(speedLabelText);
    speedLabel.appendChild(this.speedValue);

    this.speedSlider = document.createElement('input');
    this.speedSlider.type = 'range';
    this.speedSlider.min = '0.1';
    this.speedSlider.max = '3.0';
    this.speedSlider.step = '0.1';
    this.speedSlider.value = '1.0';
    this.speedSlider.style.cssText = `
      width: 100%;
      cursor: pointer;
    `;
    this.speedSlider.oninput = () => {
      this.speedValue.textContent = `${parseFloat(this.speedSlider.value).toFixed(1)}x`;
      if (this.motionController.isPlaying) {
        this.motionController.playbackSpeed = parseFloat(this.speedSlider.value);
      }
    };

    speedContainer.appendChild(speedLabel);
    speedContainer.appendChild(this.speedSlider);

    const loopContainer = document.createElement('div');
    loopContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    `;

    this.loopCheckbox = document.createElement('input');
    this.loopCheckbox.type = 'checkbox';
    this.loopCheckbox.id = 'loop-motion';
    this.loopCheckbox.style.cssText = `
      cursor: pointer;
    `;

    const loopLabel = document.createElement('label');
    loopLabel.htmlFor = 'loop-motion';
    loopLabel.textContent = 'Loop Motion';
    loopLabel.style.cssText = `
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
    `;

    loopContainer.appendChild(this.loopCheckbox);
    loopContainer.appendChild(loopLabel);

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      margin-bottom: 8px;
    `;

    const progressLabel = document.createElement('label');
    progressLabel.textContent = 'Progress:';
    progressLabel.style.cssText = `
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    `;

    const progressBarContainer = document.createElement('div');
    progressBarContainer.style.cssText = `
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.1s linear;
    `;

    progressBarContainer.appendChild(this.progressBar);
    progressContainer.appendChild(progressLabel);
    progressContainer.appendChild(progressBarContainer);

    this.statusText = document.createElement('div');
    this.statusText.textContent = 'Ready';
    this.statusText.style.cssText = `
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      margin-top: 8px;
    `;

    panel.appendChild(header);
    panel.appendChild(motionSelectContainer);
    panel.appendChild(controlsContainer);
    panel.appendChild(speedContainer);
    panel.appendChild(loopContainer);
    panel.appendChild(progressContainer);
    panel.appendChild(this.statusText);

    this.panel = panel;
    return panel;
  }

  populateMotionSelect() {
    this.motionSelect.innerHTML = '';

    const presets = this.motionController.getAllPresets();
    presets.forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = preset.name;
      this.motionSelect.appendChild(option);
    });
  }

  getButtonStyle(color) {
    return `
      flex: 1;
      padding: 8px 12px;
      background: ${color};
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      opacity: 1;
    `;
  }

  playMotion() {
    const selectedMotion = this.motionSelect.value;
    const speed = parseFloat(this.speedSlider.value);
    const loop = this.loopCheckbox.checked;

    const success = this.motionController.playMotion(selectedMotion, {
      speed,
      loop,
      onComplete: () => {
        if (!loop) {
          this.onMotionComplete();
        }
      }
    });

    if (success) {
      this.playButton.disabled = true;
      this.stopButton.disabled = false;
      this.motionSelect.disabled = true;
      this.statusText.textContent = 'Playing...';
      this.startProgressUpdate();
    }
  }

  stopMotion() {
    this.motionController.stopMotion();
    this.playButton.disabled = false;
    this.stopButton.disabled = true;
    this.motionSelect.disabled = false;
    this.statusText.textContent = 'Stopped';
    this.progressBar.style.width = '0%';
    this.stopProgressUpdate();
  }

  onMotionComplete() {
    this.playButton.disabled = false;
    this.stopButton.disabled = true;
    this.motionSelect.disabled = false;
    this.statusText.textContent = 'Complete';
    this.progressBar.style.width = '100%';
    this.stopProgressUpdate();
  }

  startProgressUpdate() {
    this.stopProgressUpdate();
    this.updateInterval = setInterval(() => {
      const status = this.motionController.getStatus();
      if (status.isPlaying) {
        const progress = Math.min(status.progress * 100, 100);
        this.progressBar.style.width = `${progress}%`;

        const currentTime = status.currentTime.toFixed(1);
        const duration = status.duration.toFixed(1);
        this.statusText.textContent = `Playing: ${currentTime}s / ${duration}s`;
      }
    }, 100);
  }

  stopProgressUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
    }
  }

  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  toggle() {
    if (this.panel) {
      this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
    }
  }

  dispose() {
    this.stopProgressUpdate();
    if (this.panel && this.panel.parentElement) {
      this.panel.parentElement.removeChild(this.panel);
    }
    this.panel = null;
  }
}

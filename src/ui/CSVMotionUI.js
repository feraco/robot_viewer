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
      <div style="
        padding: 16px;
        background: rgba(10, 132, 255, 0.1);
        border: 1px solid rgba(10, 132, 255, 0.2);
        border-radius: 12px;
        margin-bottom: 16px;
      ">
        <div style="
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          Load Motion Data
        </div>
        <div style="
          color: var(--text-secondary);
          font-size: 11px;
          margin-bottom: 12px;
          line-height: 1.4;
        ">
          Import CSV motion files to animate your robot
        </div>
        <div style="display: flex; gap: 8px;">
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
              padding: 10px 16px;
              background: var(--accent);
              color: white;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.2s;
            "
          >
            Choose CSV File
          </button>

          <select
            id="csv-robot-type"
            style="
              padding: 10px 12px;
              background: rgba(255, 255, 255, 0.1);
              color: var(--text-primary);
              border: 1px solid var(--glass-border);
              border-radius: 10px;
              font-size: 12px;
              cursor: pointer;
              font-weight: 500;
            "
          >
            <option value="auto">Auto-detect</option>
            <option value="G1">G1</option>
            <option value="H1_2">H1_2</option>
            <option value="H1">H1</option>
          </select>
        </div>

        <div id="csv-motion-info" style="
          color: var(--text-primary);
          font-size: 11px;
          padding: 10px;
          background: rgba(76, 175, 80, 0.15);
          border: 1px solid rgba(76, 175, 80, 0.3);
          border-radius: 8px;
          margin-top: 12px;
          display: none;
          font-weight: 500;
        "></div>
      </div>

      <div id="csv-sequence-builder-container" style="
        margin-bottom: 16px;
      "></div>

      <details style="
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
      " open>
        <summary style="
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <span style="
            display: inline-block;
            transition: transform 0.2s;
          ">▶</span>
          Quick Movement Controls
        </summary>

        <div style="
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--glass-border);
        ">
          <div style="
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          ">
            <button class="quick-move-btn" data-motion="walk_forward_05-11s_30fps copy" style="
              padding: 10px;
              background: rgba(76, 175, 80, 0.15);
              color: #4caf50;
              border: 1px solid rgba(76, 175, 80, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
            ">↑ Forward</button>

            <button class="quick-move-btn" data-motion="g1_walk_backward" style="
              padding: 10px;
              background: rgba(255, 152, 0, 0.15);
              color: #ff9800;
              border: 1px solid rgba(255, 152, 0, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
            ">↓ Back</button>

            <button class="quick-move-btn" data-motion="g1_stand" style="
              padding: 10px;
              background: rgba(96, 125, 139, 0.15);
              color: #90a4ae;
              border: 1px solid rgba(96, 125, 139, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
            ">Stand</button>

            <button class="quick-move-btn" data-motion="g1_turn_left" style="
              padding: 10px;
              background: rgba(33, 150, 243, 0.15);
              color: #42a5f5;
              border: 1px solid rgba(33, 150, 243, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
            ">↺ Turn L</button>

            <button class="quick-move-btn" data-motion="g1_turn_right" style="
              padding: 10px;
              background: rgba(33, 150, 243, 0.15);
              color: #42a5f5;
              border: 1px solid rgba(33, 150, 243, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
            ">↻ Turn R</button>

            <button class="quick-move-btn" data-motion="g1_sidestep_left" style="
              padding: 10px;
              background: rgba(229, 57, 53, 0.15);
              color: #ef5350;
              border: 1px solid rgba(229, 57, 53, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
            ">← Side L</button>

            <button class="quick-move-btn" data-motion="g1_sidestep_right" style="
              padding: 10px;
              background: rgba(229, 57, 53, 0.15);
              color: #ef5350;
              border: 1px solid rgba(229, 57, 53, 0.3);
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
            ">→ Side R</button>
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
              color: var(--text-secondary);
              font-size: 12px;
              font-weight: 600;
            ">Repeat:</label>
            <input
              type="number"
              id="quick-move-repeat"
              min="1"
              max="10"
              value="1"
              style="
                width: 70px;
                padding: 8px 10px;
                background: rgba(255, 255, 255, 0.08);
                color: var(--text-primary);
                border: 1px solid var(--glass-border);
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
              "
            />
            <span style="
              color: var(--text-tertiary);
              font-size: 11px;
            ">times</span>
          </div>
        </div>
      </details>

      <div style="
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 11px;
        line-height: 1.5;
      ">
        <strong>Tip:</strong> Use the floating control bar at the bottom to play/pause motion with spacebar
      </div>
    `;

    this.container.appendChild(panel);

    this.elements = {
      fileInput: panel.querySelector('#csv-motion-file'),
      loadBtn: panel.querySelector('#csv-load-btn'),
      robotType: panel.querySelector('#csv-robot-type'),
      motionInfo: panel.querySelector('#csv-motion-info'),
      sequenceBuilderContainer: panel.querySelector('#csv-sequence-builder-container'),
      quickMoveButtons: panel.querySelectorAll('.quick-move-btn'),
      quickMoveRepeat: panel.querySelector('#quick-move-repeat')
    };

    const detailsElement = panel.querySelector('details');
    if (detailsElement) {
      detailsElement.addEventListener('toggle', (e) => {
        const arrow = detailsElement.querySelector('summary span');
        if (arrow) {
          arrow.style.transform = e.target.open ? 'rotate(90deg)' : 'rotate(0deg)';
        }
      });
    }

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

    this.elements.loadBtn.addEventListener('mouseenter', () => {
      this.elements.loadBtn.style.transform = 'translateY(-2px)';
      this.elements.loadBtn.style.boxShadow = '0 4px 12px rgba(10, 132, 255, 0.4)';
    });

    this.elements.loadBtn.addEventListener('mouseleave', () => {
      this.elements.loadBtn.style.transform = 'translateY(0)';
      this.elements.loadBtn.style.boxShadow = 'none';
    });

    this.elements.fileInput.addEventListener('change', (e) => {
      this.handleFileLoad(e.target.files[0]);
    });

    this.elements.quickMoveButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const motionFile = btn.dataset.motion;
        const repeatCount = parseInt(this.elements.quickMoveRepeat.value) || 1;
        this.executeQuickMovement(motionFile, repeatCount);
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      });
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
    } catch (error) {
      console.error('Failed to load CSV motion:', error);
      alert(`Failed to load CSV: ${error.message}`);
    }
  }

  async executeQuickMovement(motionFile, repeatCount) {
    try {
      const { CSVMotionLoader } = await import('../loaders/CSVMotionLoader.js');

      const response = await fetch(`/${motionFile}.csv`);
      if (!response.ok) {
        throw new Error(`Failed to load motion file: ${motionFile}.csv`);
      }

      const csvText = await response.text();
      const robotType = this.elements.robotType.value === 'auto'
        ? null
        : this.elements.robotType.value;

      const motionData = await CSVMotionLoader.loadFromText(csvText, motionFile, robotType);

      for (let i = 0; i < repeatCount; i++) {
        const preserveState = i > 0 || this.motionController.motionData !== null;
        this.motionController.loadMotion(motionData, preserveState);
        this.motionController.setLoop(false);
        this.motionController.play();

        await new Promise(resolve => {
          const checkComplete = () => {
            if (!this.motionController.isPlaying) {
              resolve();
            } else {
              requestAnimationFrame(checkComplete);
            }
          };
          checkComplete();
        });
      }

      console.log(`Completed ${repeatCount}x ${motionFile}`);
    } catch (error) {
      console.error('Failed to execute quick movement:', error);
      alert(`Failed to execute movement: ${error.message}`);
    }
  }

  showMotionInfo(motionData) {
    this.elements.motionInfo.style.display = 'block';
    this.elements.motionInfo.innerHTML = `
      ✓ Loaded: <strong>${motionData.robotType}</strong> • ${motionData.frameCount} frames • ${motionData.duration.toFixed(1)}s @ ${motionData.fps}fps
    `;
  }

  dispose() {
    if (this.sequenceBuilderUI) {
      this.sequenceBuilderUI.dispose();
    }
    this.container.innerHTML = '';
  }
}

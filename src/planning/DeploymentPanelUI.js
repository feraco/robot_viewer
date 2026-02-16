import * as THREE from 'three';

export class DeploymentPanelUI {
  constructor(options) {
    this.waypointManager = options.waypointManager;
    this.pathCompiler = options.pathCompiler;
    this.trailRenderer = options.trailRenderer;
    this.sequenceManager = options.sequenceManager;
    this.calibrator = options.calibrator;
    this.persistence = options.persistence;
    this.csvMotionController = options.csvMotionController;
    this.robotModel = null;

    this.container = null;
    this.elements = {};
    this.compiledResult = null;
    this.currentPlanId = null;
    this.state = 'idle';
    this._deployStartTime = 0;
    this._originalCallbacks = {};

    this._createPanel();
    this._setupEventListeners();
  }

  setRobotModel(model) {
    this.robotModel = model;
  }

  _createPanel() {
    this.container = document.createElement('div');
    this.container.id = 'deployment-panel';
    this.container.className = 'floating-panel';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      max-height: calc(100vh - 120px);
      background: var(--glass-bg);
      backdrop-filter: blur(6px) saturate(120%);
      -webkit-backdrop-filter: blur(6px) saturate(120%);
      border: 0.5px solid var(--glass-border);
      border-radius: 16px;
      box-shadow: var(--glass-shadow);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 60;
      animation: slideIn 0.4s var(--spring);
    `;

    this.container.innerHTML = `
      <div class="floating-panel-header" style="
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--glass-border);
        cursor: grab;
        user-select: none;
      ">
        <span style="font-weight: 600; font-size: 13px; color: var(--text-primary);">Motion Planning</span>
        <button class="panel-close-btn" id="deploy-close-btn" style="
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          font-size: 16px;
          padding: 2px 6px;
        ">x</button>
      </div>

      <div style="
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      ">
        <!-- Planning Controls -->
        <div style="
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
        ">
          <div style="
            color: var(--text-secondary);
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Planning</div>

          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <button id="deploy-plan-toggle" style="
              flex: 1;
              padding: 8px 12px;
              background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s;
              box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
            ">Start Planning</button>
            <button id="deploy-clear-btn" style="
              padding: 8px 12px;
              background: rgba(255, 255, 255, 0.08);
              color: var(--text-primary);
              border: 1px solid var(--glass-border);
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
              transition: all 0.2s;
            ">Clear</button>
          </div>

          <div id="deploy-waypoint-list" style="
            max-height: 120px;
            overflow-y: auto;
            font-size: 11px;
            color: var(--text-tertiary);
          ">
            <div style="text-align: center; padding: 8px; color: var(--text-tertiary);">
              Click on the ground to place waypoints
            </div>
          </div>

          <div id="deploy-path-info" style="
            margin-top: 8px;
            font-size: 11px;
            color: var(--text-secondary);
            display: none;
          "></div>
        </div>

        <!-- Compile Section -->
        <div style="
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
        ">
          <div style="
            color: var(--text-secondary);
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Compile</div>

          <button id="deploy-compile-btn" style="
            width: 100%;
            padding: 8px 12px;
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
            margin-bottom: 8px;
          ">Compile Path</button>

          <div id="deploy-compile-summary" style="
            font-size: 11px;
            color: var(--text-tertiary);
            white-space: pre-wrap;
            max-height: 100px;
            overflow-y: auto;
            display: none;
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            font-family: monospace;
          "></div>
        </div>

        <!-- Execution Section -->
        <div style="
          padding: 12px;
          background: rgba(76, 175, 80, 0.08);
          border: 1px solid rgba(76, 175, 80, 0.2);
          border-radius: 8px;
        ">
          <div style="
            color: var(--text-secondary);
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Deploy</div>

          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <button id="deploy-run-btn" style="
              flex: 1;
              padding: 10px 16px;
              background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.2s;
              box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
              opacity: 0.5;
              pointer-events: none;
            ">Deploy</button>
            <button id="deploy-abort-btn" style="
              padding: 10px 16px;
              background: rgba(255, 59, 48, 0.15);
              color: #ff3b30;
              border: 1px solid rgba(255, 59, 48, 0.3);
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.2s;
              display: none;
            ">Abort</button>
          </div>

          <div id="deploy-progress-container" style="display: none;">
            <div style="
              height: 4px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 2px;
              overflow: hidden;
              margin-bottom: 6px;
            ">
              <div id="deploy-progress-bar" style="
                height: 100%;
                background: linear-gradient(90deg, #4caf50, #8bc34a);
                width: 0%;
                transition: width 0.1s linear;
              "></div>
            </div>
            <div id="deploy-progress-text" style="
              font-size: 11px;
              color: var(--text-tertiary);
            "></div>
          </div>
        </div>

        <!-- Results Section -->
        <div id="deploy-results-section" style="
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          display: none;
        ">
          <div style="
            color: var(--text-secondary);
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Results</div>
          <div id="deploy-results-content" style="
            font-size: 11px;
            color: var(--text-primary);
          "></div>
        </div>

        <!-- Save/Load Section -->
        <div style="
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
        ">
          <div style="
            color: var(--text-secondary);
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Save / Load</div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input
              type="text"
              id="deploy-plan-name"
              placeholder="Plan name..."
              style="
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.08);
                color: var(--text-primary);
                border: 1px solid var(--glass-border);
                border-radius: 6px;
                font-size: 12px;
              "
            />
            <div style="display: flex; gap: 8px;">
              <button id="deploy-save-btn" style="
                flex: 1;
                padding: 8px 12px;
                background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
              ">Save Plan</button>
              <button id="deploy-load-btn" style="
                flex: 1;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.08);
                color: var(--text-primary);
                border: 1px solid var(--glass-border);
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                transition: all 0.2s;
              ">Load Plan</button>
            </div>
            <button id="deploy-recompile-btn" style="
              width: 100%;
              padding: 8px 12px;
              background: rgba(255, 152, 0, 0.12);
              color: #ff9800;
              border: 1px solid rgba(255, 152, 0, 0.3);
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 600;
              transition: all 0.2s;
              display: none;
            ">Recompile for Current Position</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.elements = {
      planToggle: this.container.querySelector('#deploy-plan-toggle'),
      clearBtn: this.container.querySelector('#deploy-clear-btn'),
      waypointList: this.container.querySelector('#deploy-waypoint-list'),
      pathInfo: this.container.querySelector('#deploy-path-info'),
      compileBtn: this.container.querySelector('#deploy-compile-btn'),
      compileSummary: this.container.querySelector('#deploy-compile-summary'),
      runBtn: this.container.querySelector('#deploy-run-btn'),
      abortBtn: this.container.querySelector('#deploy-abort-btn'),
      progressContainer: this.container.querySelector('#deploy-progress-container'),
      progressBar: this.container.querySelector('#deploy-progress-bar'),
      progressText: this.container.querySelector('#deploy-progress-text'),
      resultsSection: this.container.querySelector('#deploy-results-section'),
      resultsContent: this.container.querySelector('#deploy-results-content'),
      planName: this.container.querySelector('#deploy-plan-name'),
      saveBtn: this.container.querySelector('#deploy-save-btn'),
      loadBtn: this.container.querySelector('#deploy-load-btn'),
      recompileBtn: this.container.querySelector('#deploy-recompile-btn'),
      closeBtn: this.container.querySelector('#deploy-close-btn')
    };
  }

  _setupEventListeners() {
    this.elements.closeBtn.addEventListener('click', () => this.hide());

    this.elements.planToggle.addEventListener('click', () => {
      if (this.waypointManager.isPlanning) {
        this.waypointManager.stopPlanning();
        this.elements.planToggle.textContent = 'Start Planning';
        this.elements.planToggle.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
      } else {
        this.waypointManager.startPlanning();
        this.elements.planToggle.textContent = 'Stop Planning';
        this.elements.planToggle.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
      }
    });

    this.elements.clearBtn.addEventListener('click', () => {
      this.waypointManager.clearWaypoints();
      this.trailRenderer.clearTrail();
      this.compiledResult = null;
      this.elements.compileSummary.style.display = 'none';
      this.elements.resultsSection.style.display = 'none';
      this.elements.recompileBtn.style.display = 'none';
      this._setDeployEnabled(false);
    });

    this.elements.compileBtn.addEventListener('click', () => this._compile());
    this.elements.runBtn.addEventListener('click', () => this._deploy());
    this.elements.abortBtn.addEventListener('click', () => this._abort());
    this.elements.saveBtn.addEventListener('click', () => this._savePlan());
    this.elements.loadBtn.addEventListener('click', () => this._loadPlan());
    this.elements.recompileBtn.addEventListener('click', () => {
      this._compile();
      this.elements.recompileBtn.style.display = 'none';
    });

    this.waypointManager.onWaypointsChanged = (waypoints) => {
      this._updateWaypointList(waypoints);
    };
  }

  _updateWaypointList(waypoints) {
    if (waypoints.length === 0) {
      this.elements.waypointList.innerHTML = `
        <div style="text-align: center; padding: 8px; color: var(--text-tertiary);">
          Click on the ground to place waypoints
        </div>
      `;
      this.elements.pathInfo.style.display = 'none';
      this._setDeployEnabled(false);
      return;
    }

    const items = waypoints.map((wp, i) => `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.03);
        margin-bottom: 2px;
      ">
        <span style="color: #2196f3; font-weight: 600;">${i + 1}</span>
        <span style="color: var(--text-tertiary); font-family: monospace; font-size: 10px;">
          (${wp.x.toFixed(2)}, ${wp.z.toFixed(2)})
        </span>
      </div>
    `).join('');

    this.elements.waypointList.innerHTML = items;

    const dist = this.waypointManager.getTotalPathDistance();
    this.elements.pathInfo.style.display = 'block';
    this.elements.pathInfo.textContent = `${waypoints.length} waypoints | ${dist.toFixed(2)}m total`;
  }

  _compile() {
    const waypoints = this.waypointManager.getWaypoints();
    if (waypoints.length < 2) {
      alert('Need at least 2 waypoints to compile a path');
      return;
    }

    let startX = 0, startY = 0, startYaw = 0;
    let worldMatrixInverse = null;

    if (this.robotModel && this.robotModel.threeObject) {
      const pos = this.robotModel.threeObject.position;
      startX = pos.x;
      startY = pos.y;

      const forward = new THREE.Vector3(1, 0, 0);
      forward.applyQuaternion(this.robotModel.threeObject.quaternion);
      startYaw = Math.atan2(forward.y, forward.x);

      const parent = this.robotModel.threeObject.parent;
      if (parent) {
        parent.updateMatrixWorld(true);
        worldMatrixInverse = parent.matrixWorld.clone().invert();
      }
    }

    const localWaypoints = waypoints.map(wp => {
      const v = new THREE.Vector3(wp.x, wp.y, wp.z);
      if (worldMatrixInverse) {
        v.applyMatrix4(worldMatrixInverse);
      }
      return { x: v.x, z: v.y };
    });

    const allWaypoints = [{ x: startX, z: startY }, ...localWaypoints];
    this.compiledResult = this.pathCompiler.compile(allWaypoints, { x: startX, y: startY }, startYaw);

    if (this.compiledResult.error) {
      alert('Compile error: ' + this.compiledResult.error);
      return;
    }

    const summary = this.pathCompiler.getSummary(this.compiledResult);
    this.elements.compileSummary.textContent = summary;
    this.elements.compileSummary.style.display = 'block';
    this._setDeployEnabled(true);
  }

  _deploy() {
    if (!this.compiledResult || this.compiledResult.commands.length === 0) return;

    this.state = 'deploying';
    this._deployStartTime = performance.now();

    this.trailRenderer.clearTrail();
    this.trailRenderer.startRecording();

    this.elements.runBtn.style.display = 'none';
    this.elements.abortBtn.style.display = 'block';
    this.elements.progressContainer.style.display = 'block';
    this.elements.progressBar.style.width = '0%';
    this.elements.resultsSection.style.display = 'none';

    if (this.waypointManager.isPlanning) {
      this.waypointManager.stopPlanning();
      this.elements.planToggle.textContent = 'Start Planning';
      this.elements.planToggle.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
    }

    this._originalCallbacks.onSequenceComplete = this.sequenceManager.onSequenceComplete;
    this._originalCallbacks.onMotionChange = this.sequenceManager.onMotionChange;
    this._originalCallbacks.onCommandUpdate = this.sequenceManager.onCommandUpdate;

    this.sequenceManager.onSequenceComplete = () => {
      this._onDeployComplete('success');
    };

    this.sequenceManager.onMotionChange = (motionId, index, total) => {
      this.elements.progressText.textContent = `${motionId} (${index + 1}/${total})`;
    };

    this.sequenceManager.onCommandUpdate = (info) => {
      const overallProgress = (this.sequenceManager.currentIndex + info.progress) / this.compiledResult.commands.length;
      this.elements.progressBar.style.width = `${Math.min(overallProgress * 100, 100)}%`;
    };

    this._initializeStartTransforms();
    this.sequenceManager.playSequence(this.compiledResult.commands, false);
  }

  _initializeStartTransforms() {
    this.csvMotionController.resetAccumulatedTransforms();
    this.csvMotionController.motionData = null;

    const firstCmd = this.compiledResult.commands[0];
    const firstMotion = this.sequenceManager.preloadedMotions.get(firstCmd.motionId);

    if (!this.robotModel?.threeObject || !firstMotion?.frames[0]) return;

    const robotPos = this.robotModel.threeObject.position.clone();
    const robotRot = this.robotModel.threeObject.quaternion.clone();

    const f0 = firstMotion.frames[0];
    const frame0Pos = new THREE.Vector3(f0.root.position.x, f0.root.position.y, f0.root.position.z);
    const frame0Rot = new THREE.Quaternion(f0.root.quaternion.x, f0.root.quaternion.y, f0.root.quaternion.z, f0.root.quaternion.w);

    const invFrame0Rot = frame0Rot.clone().invert();
    this.csvMotionController.accumulatedRotation.copy(robotRot.clone().multiply(invFrame0Rot));

    const rotatedFrame0Pos = frame0Pos.clone().applyQuaternion(this.csvMotionController.accumulatedRotation);
    this.csvMotionController.accumulatedPosition.copy(robotPos.clone().sub(rotatedFrame0Pos));
  }

  _abort() {
    this._restoreCallbacks();
    this.sequenceManager.stopSequence();
    this.trailRenderer.stopRecording();
    this._onDeployComplete('aborted');
  }

  _onDeployComplete(status) {
    this.trailRenderer.stopRecording();
    this._restoreCallbacks();

    this.state = 'idle';
    const totalTime = (performance.now() - this._deployStartTime) / 1000;

    this.elements.runBtn.style.display = 'block';
    this.elements.abortBtn.style.display = 'none';
    this.elements.progressContainer.style.display = 'none';

    const waypoints = this.waypointManager.getWaypoints();
    const errors = this.trailRenderer.computeWaypointErrors(waypoints);
    const avgError = errors.length > 0
      ? errors.reduce((s, e) => s + e.error, 0) / errors.length
      : 0;
    const maxError = errors.length > 0
      ? Math.max(...errors.map(e => e.error))
      : 0;

    const statusColor = status === 'success' ? '#4caf50' : status === 'aborted' ? '#ff9800' : '#f44336';
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    let html = `
      <div style="margin-bottom: 8px;">
        <span style="color: ${statusColor}; font-weight: 600;">${statusLabel}</span>
        <span style="color: var(--text-tertiary);"> | ${totalTime.toFixed(1)}s</span>
      </div>
    `;

    if (errors.length > 0) {
      html += `<div style="margin-bottom: 4px; color: var(--text-secondary);">Waypoint Errors:</div>`;
      errors.forEach((e, i) => {
        const color = e.error < 0.3 ? '#4caf50' : e.error < 0.8 ? '#ff9800' : '#f44336';
        html += `<div style="display: flex; justify-content: space-between; padding: 2px 0;">
          <span>WP ${i + 1}</span>
          <span style="color: ${color}; font-weight: 500;">${e.error.toFixed(3)}m</span>
        </div>`;
      });
      html += `<div style="
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid var(--glass-border);
        display: flex;
        justify-content: space-between;
      ">
        <span>Avg: ${avgError.toFixed(3)}m</span>
        <span>Max: ${maxError.toFixed(3)}m</span>
      </div>`;
    }

    this.elements.resultsContent.innerHTML = html;
    this.elements.resultsSection.style.display = 'block';

    this._lastRunData = {
      trail: this.trailRenderer.getTrailData(),
      errors: errors.map(e => ({ error: e.error })),
      totalTime,
      status
    };
  }

  _restoreCallbacks() {
    this.sequenceManager.onSequenceComplete = this._originalCallbacks.onSequenceComplete || null;
    this.sequenceManager.onMotionChange = this._originalCallbacks.onMotionChange || null;
    this.sequenceManager.onCommandUpdate = this._originalCallbacks.onCommandUpdate || null;
    this._originalCallbacks = {};
  }

  _setDeployEnabled(enabled) {
    this.elements.runBtn.style.opacity = enabled ? '1' : '0.5';
    this.elements.runBtn.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  async _savePlan() {
    const name = this.elements.planName.value.trim();
    if (!name) {
      alert('Please enter a plan name');
      return;
    }

    const waypoints = this.waypointManager.getWaypoints();
    if (waypoints.length < 2) {
      alert('Need at least 2 waypoints to save');
      return;
    }

    const commands = this.compiledResult ? this.compiledResult.commands : [];
    const duration = this.compiledResult ? this.compiledResult.estimatedDuration : 0;

    try {
      const data = await this.persistence.savePlan(name, waypoints, commands, duration);
      this.currentPlanId = data.id;
      alert('Plan saved!');
      this.elements.planName.value = '';
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  }

  async _loadPlan() {
    try {
      const plans = await this.persistence.loadPlans();

      if (plans.length === 0) {
        alert('No saved plans found');
        return;
      }

      const templates = plans.filter(p => p.is_template);
      const userPlans = plans.filter(p => !p.is_template);

      let listing = '';
      if (templates.length > 0) {
        listing += '-- Template Missions --\n';
        templates.forEach(p => {
          const desc = p.description ? ` - ${p.description}` : '';
          listing += `  ${p.name} (${p.waypoints.length} wp, ~${(p.estimated_duration || 0).toFixed(0)}s)${desc}\n`;
        });
      }
      if (userPlans.length > 0) {
        if (listing) listing += '\n';
        listing += '-- Saved Plans --\n';
        userPlans.forEach(p => {
          listing += `  ${p.name} (${p.waypoints.length} wp)\n`;
        });
      }

      const name = prompt(listing + '\nEnter plan name to load:');
      if (!name) return;

      const plan = plans.find(p => p.name === name);
      if (!plan) {
        alert('Plan not found');
        return;
      }

      this.waypointManager.setWaypoints(plan.waypoints);
      this.currentPlanId = plan.id;

      if (plan.compiled_commands && plan.compiled_commands.length > 0) {
        const { MotionCommand } = await import('../models/MotionCommand.js');
        this.compiledResult = {
          commands: plan.compiled_commands.map(c => MotionCommand.fromJSON(c)),
          segments: [],
          estimatedDuration: plan.estimated_duration
        };
        const label = plan.is_template ? 'Template' : 'Loaded';
        this.elements.compileSummary.textContent = `${label}: ${plan.compiled_commands.length} commands, ~${plan.estimated_duration.toFixed(1)}s`;
        this.elements.compileSummary.style.display = 'block';
        this._setDeployEnabled(true);

        if (plan.is_template) {
          this.elements.recompileBtn.style.display = 'block';
        }
      }
    } catch (error) {
      alert('Failed to load: ' + error.message);
    }
  }

  show() {
    this.container.style.display = 'flex';
  }

  hide() {
    this.container.style.display = 'none';
    if (this.waypointManager.isPlanning) {
      this.waypointManager.stopPlanning();
      this.elements.planToggle.textContent = 'Start Planning';
      this.elements.planToggle.style.background = 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
    }
  }

  toggle() {
    if (this.container.style.display === 'flex') {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible() {
    return this.container.style.display === 'flex';
  }

  dispose() {
    if (this.waypointManager.isPlanning) {
      this.waypointManager.stopPlanning();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

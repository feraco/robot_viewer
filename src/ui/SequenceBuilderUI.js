import { MotionCommand } from '../models/MotionCommand.js';

export class SequenceBuilderUI {
  constructor(container, sequenceManager, presetLibrary) {
    this.container = container;
    this.sequenceManager = sequenceManager;
    this.presetLibrary = presetLibrary;
    this.elements = {};
    this.selectedCommandIndex = -1;

    this.init();
    this.setupEventListeners();
  }

  init() {
    const panel = document.createElement('div');
    panel.className = 'sequence-builder-panel';
    panel.style.cssText = `
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      overflow-y: auto;
    `;

    panel.innerHTML = `
      <div style="
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        margin-bottom: 8px;
      ">
        <div style="
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        ">Motion Sequence Builder</div>
        <div style="
          color: rgba(255, 255, 255, 0.9);
          font-size: 11px;
        ">Build custom motion sequences with duration control</div>
      </div>

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
        ">Add Command</div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <select id="seq-motion-select" style="
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-primary);
            border: 1px solid var(--glass-border);
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
          ">
            <option value="">Select motion...</option>
          </select>

          <div style="display: flex; gap: 8px; align-items: center;">
            <label style="
              color: var(--text-secondary);
              font-size: 11px;
              white-space: nowrap;
            ">Duration:</label>
            <input
              type="number"
              id="seq-duration-input"
              placeholder="Auto"
              min="0.1"
              step="0.1"
              style="
                flex: 1;
                padding: 6px 8px;
                background: rgba(255, 255, 255, 0.08);
                color: var(--text-primary);
                border: 1px solid var(--glass-border);
                border-radius: 6px;
                font-size: 12px;
              "
            />
            <span style="
              color: var(--text-tertiary);
              font-size: 11px;
            ">seconds</span>
          </div>

          <button id="seq-add-btn" style="
            padding: 8px 16px;
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
          ">+ Add to Sequence</button>
        </div>
      </div>

      <div style="
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        flex: 1;
        display: flex;
        flex-direction: column;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        ">
          <div style="
            color: var(--text-secondary);
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Sequence</div>
          <div style="
            color: var(--text-tertiary);
            font-size: 10px;
          ">
            <span id="seq-total-duration">0.0s</span> total
          </div>
        </div>

        <div id="seq-command-list" style="
          flex: 1;
          overflow-y: auto;
          min-height: 150px;
        "></div>

        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button id="seq-clear-btn" style="
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-primary);
            border: 1px solid var(--glass-border);
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s;
          ">Clear All</button>
        </div>
      </div>

      <div style="
        padding: 12px;
        background: rgba(100, 150, 255, 0.08);
        border: 1px solid rgba(100, 150, 255, 0.2);
        border-radius: 8px;
      ">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button id="seq-play-btn" style="
            flex: 1;
            padding: 10px 16px;
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
          ">▶ Play Sequence</button>

          <button id="seq-stop-btn" style="
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-primary);
            border: 1px solid var(--glass-border);
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
          ">■ Stop</button>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <label style="
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-secondary);
            font-size: 11px;
            cursor: pointer;
          ">
            <input type="checkbox" id="seq-loop" style="cursor: pointer;" />
            Loop Sequence
          </label>

          <div id="seq-status" style="
            margin-left: auto;
            color: var(--text-tertiary);
            font-size: 10px;
            font-weight: 500;
          "></div>
        </div>
      </div>

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
        ">Save/Load</div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input
            type="text"
            id="seq-name-input"
            placeholder="Sequence name..."
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
            <button id="seq-save-btn" style="
              flex: 1;
              padding: 8px 12px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 600;
              transition: all 0.2s;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            ">Save</button>

            <button id="seq-load-btn" style="
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
            ">Load</button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(panel);

    this.elements = {
      motionSelect: panel.querySelector('#seq-motion-select'),
      durationInput: panel.querySelector('#seq-duration-input'),
      addBtn: panel.querySelector('#seq-add-btn'),
      commandList: panel.querySelector('#seq-command-list'),
      clearBtn: panel.querySelector('#seq-clear-btn'),
      playBtn: panel.querySelector('#seq-play-btn'),
      stopBtn: panel.querySelector('#seq-stop-btn'),
      loopCheckbox: panel.querySelector('#seq-loop'),
      status: panel.querySelector('#seq-status'),
      totalDuration: panel.querySelector('#seq-total-duration'),
      nameInput: panel.querySelector('#seq-name-input'),
      saveBtn: panel.querySelector('#seq-save-btn'),
      loadBtn: panel.querySelector('#seq-load-btn')
    };

    this.populateMotionSelect();
    this.renderCommandList();
  }

  populateMotionSelect() {
    const presets = this.presetLibrary.getAllPresets();
    presets.forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = `${preset.icon} ${preset.name}`;
      option.dataset.defaultDuration = preset.defaultDuration;
      this.elements.motionSelect.appendChild(option);
    });
  }

  setupEventListeners() {
    this.elements.motionSelect.addEventListener('change', (e) => {
      const selectedOption = e.target.selectedOptions[0];
      if (selectedOption && selectedOption.dataset.defaultDuration) {
        this.elements.durationInput.placeholder = selectedOption.dataset.defaultDuration + 's';
      }
    });

    this.elements.addBtn.addEventListener('click', () => {
      this.addCommand();
    });

    this.elements.clearBtn.addEventListener('click', () => {
      if (confirm('Clear all commands from the sequence?')) {
        this.sequenceManager.clearSequence();
        this.renderCommandList();
        this.updateTotalDuration();
      }
    });

    this.elements.playBtn.addEventListener('click', () => {
      const loop = this.elements.loopCheckbox.checked;
      this.sequenceManager.playSequence(null, loop);
    });

    this.elements.stopBtn.addEventListener('click', () => {
      this.sequenceManager.stopSequence();
    });

    this.elements.saveBtn.addEventListener('click', () => {
      this.saveSequence();
    });

    this.elements.loadBtn.addEventListener('click', () => {
      this.loadSequenceDialog();
    });

    this.sequenceManager.onMotionChange = (motionId, index, total, command) => {
      this.updateStatus(motionId, index, total);
      this.highlightCurrentCommand(index);
    };

    this.sequenceManager.onSequenceComplete = () => {
      this.elements.status.textContent = 'Complete';
      this.highlightCurrentCommand(-1);
      setTimeout(() => {
        this.elements.status.textContent = '';
      }, 2000);
    };

    this.sequenceManager.onCommandUpdate = (updateInfo) => {
      this.updateCommandProgress(updateInfo);
    };
  }

  addCommand() {
    const motionId = this.elements.motionSelect.value;
    if (!motionId) {
      alert('Please select a motion');
      return;
    }

    const durationValue = this.elements.durationInput.value;
    const duration = durationValue ? parseFloat(durationValue) : null;

    const command = new MotionCommand({
      motionId,
      duration
    });

    this.sequenceManager.addCommand(command);
    this.renderCommandList();
    this.updateTotalDuration();

    this.elements.motionSelect.value = '';
    this.elements.durationInput.value = '';
  }

  renderCommandList() {
    const listContainer = this.elements.commandList;
    listContainer.innerHTML = '';

    const sequence = this.sequenceManager.getSequence();

    if (sequence.length === 0) {
      listContainer.innerHTML = `
        <div style="
          text-align: center;
          padding: 24px;
          color: var(--text-tertiary);
          font-size: 12px;
        ">
          No commands yet. Add motions to build your sequence.
        </div>
      `;
      return;
    }

    sequence.forEach((command, index) => {
      const preset = this.presetLibrary.getPreset(command.motionId);
      const displayName = preset ? preset.name : command.motionId;
      const icon = preset ? preset.icon : '🤖';

      const motion = this.sequenceManager.preloadedMotions.get(command.motionId);
      const motionDuration = motion ? motion.duration : 0;
      const effectiveDuration = command.duration !== null ?
        Math.min(command.duration, motionDuration) : motionDuration;

      const commandEl = document.createElement('div');
      commandEl.className = 'sequence-command-item';
      commandEl.dataset.index = index;
      commandEl.style.cssText = `
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        border-radius: 6px;
        margin-bottom: 6px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      `;

      commandEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="
            font-size: 16px;
            width: 24px;
            text-align: center;
          ">${icon}</div>
          <div style="flex: 1;">
            <div style="
              color: var(--text-primary);
              font-size: 12px;
              font-weight: 500;
            ">${index + 1}. ${displayName}</div>
            <div style="
              color: var(--text-tertiary);
              font-size: 10px;
              margin-top: 2px;
            ">${effectiveDuration.toFixed(1)}s</div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="cmd-up" style="
              padding: 4px 8px;
              background: rgba(255, 255, 255, 0.08);
              color: var(--text-secondary);
              border: 1px solid var(--glass-border);
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
              transition: all 0.2s;
            ">↑</button>
            <button class="cmd-down" style="
              padding: 4px 8px;
              background: rgba(255, 255, 255, 0.08);
              color: var(--text-secondary);
              border: 1px solid var(--glass-border);
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
              transition: all 0.2s;
            ">↓</button>
            <button class="cmd-delete" style="
              padding: 4px 8px;
              background: rgba(255, 59, 48, 0.2);
              color: #ff3b30;
              border: 1px solid rgba(255, 59, 48, 0.3);
              border-radius: 4px;
              cursor: pointer;
              font-size: 11px;
              transition: all 0.2s;
            ">×</button>
          </div>
        </div>
        <div class="cmd-progress-bar" style="
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          width: 0%;
          transition: width 0.1s linear;
          display: none;
        "></div>
      `;

      commandEl.querySelector('.cmd-up').addEventListener('click', (e) => {
        e.stopPropagation();
        if (index > 0) {
          this.sequenceManager.moveCommand(index, index - 1);
          this.renderCommandList();
        }
      });

      commandEl.querySelector('.cmd-down').addEventListener('click', (e) => {
        e.stopPropagation();
        if (index < sequence.length - 1) {
          this.sequenceManager.moveCommand(index, index + 1);
          this.renderCommandList();
        }
      });

      commandEl.querySelector('.cmd-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.sequenceManager.removeCommand(index);
        this.renderCommandList();
        this.updateTotalDuration();
      });

      listContainer.appendChild(commandEl);
    });
  }

  updateTotalDuration() {
    const totalDuration = this.sequenceManager.getTotalDuration();
    this.elements.totalDuration.textContent = `${totalDuration.toFixed(1)}s`;
  }

  updateStatus(motionId, index, total) {
    const preset = this.presetLibrary.getPreset(motionId);
    const displayName = preset ? preset.name : motionId;
    this.elements.status.textContent = `${displayName} (${index + 1}/${total})`;
  }

  highlightCurrentCommand(index) {
    const items = this.elements.commandList.querySelectorAll('.sequence-command-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.style.background = 'rgba(100, 150, 255, 0.2)';
        item.style.borderColor = 'rgba(100, 150, 255, 0.5)';
      } else {
        item.style.background = 'rgba(255, 255, 255, 0.05)';
        item.style.borderColor = 'var(--glass-border)';
      }
    });
  }

  updateCommandProgress(updateInfo) {
    const index = this.sequenceManager.currentIndex;
    const items = this.elements.commandList.querySelectorAll('.sequence-command-item');
    if (items[index]) {
      const progressBar = items[index].querySelector('.cmd-progress-bar');
      if (progressBar) {
        progressBar.style.display = 'block';
        progressBar.style.width = `${Math.min(updateInfo.progress * 100, 100)}%`;
      }
    }
  }

  async saveSequence() {
    const name = this.elements.nameInput.value.trim();
    if (!name) {
      alert('Please enter a sequence name');
      return;
    }

    const sequence = this.sequenceManager.exportSequence();
    if (sequence.commands.length === 0) {
      alert('Cannot save empty sequence');
      return;
    }

    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('motion_sequences')
        .insert({
          name: name,
          commands: sequence.commands,
          total_duration: sequence.totalDuration
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      alert('Sequence saved successfully!');
      this.elements.nameInput.value = '';
    } catch (error) {
      console.error('Failed to save sequence:', error);
      alert('Failed to save sequence: ' + error.message);
    }
  }

  async loadSequenceDialog() {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('motion_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('No saved sequences found');
        return;
      }

      const sequenceName = prompt(
        'Available sequences:\n\n' +
        data.map((seq, i) => `${i + 1}. ${seq.name} (${seq.total_duration.toFixed(1)}s)`).join('\n') +
        '\n\nEnter sequence name to load:'
      );

      if (!sequenceName) return;

      const selected = data.find(seq => seq.name === sequenceName);
      if (!selected) {
        alert('Sequence not found');
        return;
      }

      this.sequenceManager.importSequence({ commands: selected.commands });
      this.renderCommandList();
      this.updateTotalDuration();
      alert('Sequence loaded successfully!');
    } catch (error) {
      console.error('Failed to load sequence:', error);
      alert('Failed to load sequence: ' + error.message);
    }
  }

  dispose() {
    this.container.innerHTML = '';
  }
}

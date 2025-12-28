export class KeyboardMotionController {
  constructor(motionController, csvMotionUI = null) {
    this.motionController = motionController;
    this.csvMotionUI = csvMotionUI;
    this.activeKeys = new Set();
    this.currentMotion = null;
    this.speed = 1.0;
    this.keyBindings = {
      'ArrowUp': 'walk_forward_05-11s_30fps copy',
      'ArrowDown': 'g1_walk_backward',
      'ArrowLeft': 'g1_turn_left',
      'ArrowRight': 'g1_turn_right'
    };
    this.isEnabled = false;
    this.listeners = new Map();

    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }

  enable() {
    if (this.isEnabled) return;

    this.isEnabled = true;
    document.addEventListener('keydown', this.boundHandleKeyDown);
    document.addEventListener('keyup', this.boundHandleKeyUp);
  }

  disable() {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    document.removeEventListener('keyup', this.boundHandleKeyUp);

    this.stopCurrentMotion();
    this.activeKeys.clear();
  }

  handleKeyDown(event) {
    if (!this.isEnabled) return;

    if (this.shouldIgnoreKeypress(event)) return;

    const key = event.key;

    if (key === 'h' || key === 'H') {
      this.notifyListeners('toggleHelp');
      return;
    }

    if (key === '+' || key === '=') {
      event.preventDefault();
      this.adjustSpeed(0.1);
      this.notifyListeners('speedChange', this.speed);
      return;
    }

    if (key === '-' || key === '_') {
      event.preventDefault();
      this.adjustSpeed(-0.1);
      this.notifyListeners('speedChange', this.speed);
      return;
    }

    if (this.keyBindings[key]) {
      event.preventDefault();

      if (this.activeKeys.has(key)) return;

      this.activeKeys.add(key);
      this.notifyListeners('keyStateChange', Array.from(this.activeKeys));

      this.startMotion(this.keyBindings[key]);
    }
  }

  handleKeyUp(event) {
    if (!this.isEnabled) return;

    if (this.shouldIgnoreKeypress(event)) return;

    const key = event.key;

    if (this.keyBindings[key]) {
      event.preventDefault();
      this.activeKeys.delete(key);
      this.notifyListeners('keyStateChange', Array.from(this.activeKeys));

      if (this.currentMotion === this.keyBindings[key]) {
        this.stopCurrentMotion();
      }
    }
  }

  shouldIgnoreKeypress(event) {
    const target = event.target;
    const tagName = target.tagName.toLowerCase();

    if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
      return true;
    }

    return false;
  }

  async startMotion(motionFile) {
    if (this.currentMotion === motionFile) return;

    this.currentMotion = motionFile;

    // Use CSV motion UI if available
    if (this.csvMotionUI && typeof this.csvMotionUI.executeQuickMovement === 'function') {
      await this.csvMotionUI.executeQuickMovement(motionFile, 1);
      return;
    }

    // Fallback to motion controller playMotion if available (for Mujoco)
    if (this.motionController && typeof this.motionController.playMotion === 'function') {
      this.motionController.playMotion(motionFile, {
        speed: this.speed,
        loop: true
      });
    }
  }

  stopCurrentMotion() {
    if (this.currentMotion) {
      // Stop CSV motion
      if (this.motionController && typeof this.motionController.stop === 'function') {
        this.motionController.stop();
      }
      // Fallback for Mujoco motion controller
      if (this.motionController && typeof this.motionController.stopMotion === 'function') {
        this.motionController.stopMotion();
      }
      this.currentMotion = null;
    }
  }

  adjustSpeed(delta) {
    this.speed = Math.max(0.1, Math.min(3.0, this.speed + delta));
    this.speed = Math.round(this.speed * 10) / 10;

    if (this.currentMotion && this.motionController.isPlaying) {
      this.motionController.playbackSpeed = this.speed;
    }
  }

  setSpeed(speed) {
    this.speed = Math.max(0.1, Math.min(3.0, speed));

    if (this.currentMotion && this.motionController.isPlaying) {
      this.motionController.playbackSpeed = this.speed;
    }
  }

  getSpeed() {
    return this.speed;
  }

  getActiveKeys() {
    return Array.from(this.activeKeys);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  dispose() {
    this.disable();
    this.listeners.clear();
  }
}

export class MotionCommand {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.motionId = options.motionId || null;
    this.duration = options.duration || null;
    this.repeatCount = options.repeatCount || 1;
    this.transitionDelay = options.transitionDelay || 0;
  }

  generateId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clone() {
    return new MotionCommand({
      id: this.generateId(),
      motionId: this.motionId,
      duration: this.duration,
      repeatCount: this.repeatCount,
      transitionDelay: this.transitionDelay
    });
  }

  toJSON() {
    return {
      id: this.id,
      motionId: this.motionId,
      duration: this.duration,
      repeatCount: this.repeatCount,
      transitionDelay: this.transitionDelay
    };
  }

  static fromJSON(json) {
    return new MotionCommand(json);
  }

  validate(availableMotions) {
    if (!this.motionId) {
      return { valid: false, error: 'Motion ID is required' };
    }
    if (!availableMotions.has(this.motionId)) {
      return { valid: false, error: `Motion '${this.motionId}' not found` };
    }
    if (this.duration !== null && this.duration <= 0) {
      return { valid: false, error: 'Duration must be positive' };
    }
    if (this.repeatCount < 1) {
      return { valid: false, error: 'Repeat count must be at least 1' };
    }
    if (this.transitionDelay < 0) {
      return { valid: false, error: 'Transition delay cannot be negative' };
    }
    return { valid: true };
  }
}

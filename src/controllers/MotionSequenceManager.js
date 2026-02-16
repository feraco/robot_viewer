import { CSVMotionLoader } from '../loaders/CSVMotionLoader.js';
import { MotionCommand } from '../models/MotionCommand.js';

export class MotionSequenceManager {
  constructor(csvMotionController) {
    this.controller = csvMotionController;
    this.sequence = [];
    this.currentIndex = 0;
    this.isPlayingSequence = false;
    this.loopSequence = false;
    this.preloadedMotions = new Map();

    this.onSequenceComplete = null;
    this.onMotionChange = null;
    this.onCommandUpdate = null;

    this.commandStartTime = 0;
    this.currentCommand = null;
    this.commandElapsedTime = 0;
    this._completingCommand = false;

    this.setupControllerCallbacks();
  }

  setupControllerCallbacks() {
    this.controller.on('onPlayStateChange', (isPlaying) => {
      if (!isPlaying && this.isPlayingSequence) {
        this.handleMotionComplete();
      }
    });
  }

  async preloadMotion(name, url, robotType = null) {
    try {
      const response = await fetch(url);
      const csvText = await response.text();
      const detectedType = robotType || CSVMotionLoader.detectRobotType(csvText);
      const motionData = CSVMotionLoader.parseCSV(csvText, detectedType);

      this.preloadedMotions.set(name, motionData);
      console.log(`Preloaded motion: ${name}`, motionData);
      return motionData;
    } catch (error) {
      console.error(`Failed to preload motion ${name}:`, error);
      throw error;
    }
  }

  async preloadDefaultMotions(robotType = 'G1') {
    await this.preloadMotion('stand', './g1_stand.csv', robotType);
    await this.preloadMotion('walk_forward', './walk_forward_05-11s_30fps copy.csv', robotType);
    await this.preloadMotion('walk_backward', './g1_walk_backward.csv', robotType);
    await this.preloadMotion('sidestep_left', './g1_sidestep_left.csv', robotType);
    await this.preloadMotion('sidestep_right', './g1_sidestep_right.csv', robotType);
    await this.preloadMotion('turn_left', './g1_turn_left.csv', robotType);
    await this.preloadMotion('turn_right', './g1_turn_right.csv', robotType);
  }

  setSequence(commands) {
    this.sequence = commands.map(cmd =>
      cmd instanceof MotionCommand ? cmd : new MotionCommand(cmd)
    );
    this.currentIndex = 0;
  }

  addCommand(command) {
    const cmd = command instanceof MotionCommand ? command : new MotionCommand(command);
    this.sequence.push(cmd);
  }

  removeCommand(index) {
    if (index >= 0 && index < this.sequence.length) {
      this.sequence.splice(index, 1);
      if (this.currentIndex >= this.sequence.length) {
        this.currentIndex = Math.max(0, this.sequence.length - 1);
      }
    }
  }

  moveCommand(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < this.sequence.length &&
        toIndex >= 0 && toIndex < this.sequence.length) {
      const [command] = this.sequence.splice(fromIndex, 1);
      this.sequence.splice(toIndex, 0, command);
    }
  }

  clearSequence() {
    this.sequence = [];
    this.currentIndex = 0;
  }

  getSequence() {
    return this.sequence;
  }

  getTotalDuration() {
    return this.sequence.reduce((total, cmd) => {
      const motion = this.preloadedMotions.get(cmd.motionId);
      const motionDuration = motion ? motion.duration : 0;
      const cmdDuration = cmd.duration !== null ? cmd.duration : motionDuration;
      return total + (cmdDuration * cmd.repeatCount) + cmd.transitionDelay;
    }, 0);
  }

  playSequence(commands = null, loop = false) {
    if (commands) {
      this.setSequence(commands);
    }

    if (this.sequence.length === 0) {
      console.warn('No sequence to play');
      return;
    }

    const validation = this.validateSequence();
    if (!validation.valid) {
      console.error('Invalid sequence:', validation.errors);
      return;
    }

    this.loopSequence = loop;
    this.isPlayingSequence = true;
    this.currentIndex = 0;
    this.playCurrentCommand();
  }

  validateSequence() {
    const errors = [];
    for (let i = 0; i < this.sequence.length; i++) {
      const cmd = this.sequence[i];
      const validation = cmd.validate(this.preloadedMotions);
      if (!validation.valid) {
        errors.push(`Command ${i + 1}: ${validation.error}`);
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  playCurrentCommand() {
    if (this.currentIndex >= this.sequence.length) {
      this.stopSequence();
      return;
    }

    this.currentCommand = this.sequence[this.currentIndex];
    const motionData = this.preloadedMotions.get(this.currentCommand.motionId);

    if (!motionData) {
      console.error(`Motion not found: ${this.currentCommand.motionId}`);
      this.stopSequence();
      return;
    }

    const motionDuration = motionData.duration;
    const targetDuration = this.currentCommand.duration !== null ?
      Math.min(this.currentCommand.duration, motionDuration) : motionDuration;

    console.log(`Playing command ${this.currentIndex + 1}/${this.sequence.length}: ${this.currentCommand.motionId} (${targetDuration.toFixed(2)}s)`);

    this.commandStartTime = performance.now();
    this.commandElapsedTime = 0;
    this._completingCommand = false;

    this.controller.loadMotion(motionData);
    this.controller.setLoop(false);
    this.controller.play();

    if (this.onMotionChange) {
      this.onMotionChange(
        this.currentCommand.motionId,
        this.currentIndex,
        this.sequence.length,
        this.currentCommand
      );
    }

    this.scheduleCommandCheck(targetDuration);
  }

  scheduleCommandCheck(targetDuration) {
    if (!this.isPlayingSequence) return;

    const checkInterval = setInterval(() => {
      if (!this.isPlayingSequence || !this.currentCommand) {
        clearInterval(checkInterval);
        return;
      }

      this.commandElapsedTime = (performance.now() - this.commandStartTime) / 1000;

      if (this.onCommandUpdate) {
        this.onCommandUpdate({
          command: this.currentCommand,
          elapsed: this.commandElapsedTime,
          target: targetDuration,
          progress: this.commandElapsedTime / targetDuration
        });
      }

      if (this.commandElapsedTime >= targetDuration) {
        clearInterval(checkInterval);
        this.controller.pause();
        this.handleCommandComplete();
      }
    }, 50);
  }

  handleCommandComplete() {
    if (!this.isPlayingSequence || this._completingCommand) return;
    this._completingCommand = true;

    if (this.currentCommand && this.currentCommand.transitionDelay > 0) {
      setTimeout(() => {
        this.moveToNextCommand();
      }, this.currentCommand.transitionDelay * 1000);
    } else {
      this.moveToNextCommand();
    }
  }

  moveToNextCommand() {
    this.currentIndex++;

    if (this.currentIndex >= this.sequence.length) {
      if (this.loopSequence) {
        this.currentIndex = 0;
        setTimeout(() => this.playCurrentCommand(), 100);
      } else {
        this.stopSequence();
      }
    } else {
      setTimeout(() => this.playCurrentCommand(), 100);
    }
  }

  handleMotionComplete() {
    if (!this.isPlayingSequence) return;
    this.handleCommandComplete();
  }

  stopSequence() {
    this.isPlayingSequence = false;
    this.currentIndex = 0;
    this.controller.stop();
    this.controller.resetAccumulatedTransforms();

    if (this.onSequenceComplete) {
      this.onSequenceComplete();
    }
  }

  pauseSequence() {
    this.isPlayingSequence = false;
    this.controller.pause();
  }

  resumeSequence() {
    if (this.sequence.length === 0) return;
    this.isPlayingSequence = true;
    this.controller.play();
  }

  getPreloadedMotions() {
    return Array.from(this.preloadedMotions.keys());
  }

  isSequencePlaying() {
    return this.isPlayingSequence;
  }

  getCurrentSequenceInfo() {
    return {
      currentIndex: this.currentIndex,
      totalCommands: this.sequence.length,
      currentCommand: this.sequence[this.currentIndex] || null,
      isPlaying: this.isPlayingSequence,
      elapsedTime: this.commandElapsedTime
    };
  }

  exportSequence() {
    return {
      commands: this.sequence.map(cmd => cmd.toJSON()),
      totalDuration: this.getTotalDuration()
    };
  }

  importSequence(data) {
    this.sequence = data.commands.map(cmd => MotionCommand.fromJSON(cmd));
    this.currentIndex = 0;
  }
}

import { CSVMotionLoader } from '../loaders/CSVMotionLoader.js';

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
    await this.preloadMotion('walk_forward', './g1_walk_forward.csv', robotType);
    await this.preloadMotion('walk_backward', './g1_walk_backward.csv', robotType);
  }

  setSequence(motionNames) {
    this.sequence = motionNames;
    this.currentIndex = 0;
  }

  playSequence(motionNames = null, loop = false) {
    if (motionNames) {
      this.setSequence(motionNames);
    }

    if (this.sequence.length === 0) {
      console.warn('No sequence to play');
      return;
    }

    this.loopSequence = loop;
    this.isPlayingSequence = true;
    this.currentIndex = 0;
    this.playCurrentMotion();
  }

  playCurrentMotion() {
    if (this.currentIndex >= this.sequence.length) {
      this.stopSequence();
      return;
    }

    const motionName = this.sequence[this.currentIndex];
    const motionData = this.preloadedMotions.get(motionName);

    if (!motionData) {
      console.error(`Motion not found: ${motionName}`);
      this.stopSequence();
      return;
    }

    console.log(`Playing motion ${this.currentIndex + 1}/${this.sequence.length}: ${motionName}`);

    this.controller.loadMotion(motionData);
    this.controller.setLoop(false);
    this.controller.play();

    if (this.onMotionChange) {
      this.onMotionChange(motionName, this.currentIndex, this.sequence.length);
    }
  }

  handleMotionComplete() {
    if (!this.isPlayingSequence) return;

    this.currentIndex++;

    if (this.currentIndex >= this.sequence.length) {
      if (this.loopSequence) {
        this.currentIndex = 0;
        setTimeout(() => this.playCurrentMotion(), 100);
      } else {
        this.stopSequence();
      }
    } else {
      setTimeout(() => this.playCurrentMotion(), 100);
    }
  }

  stopSequence() {
    this.isPlayingSequence = false;
    this.currentIndex = 0;
    this.controller.stop();

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
      totalMotions: this.sequence.length,
      currentMotion: this.sequence[this.currentIndex] || null,
      isPlaying: this.isPlayingSequence
    };
  }
}

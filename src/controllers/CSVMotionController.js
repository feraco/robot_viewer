import * as THREE from 'three';

export class CSVMotionController {
  constructor(robotModel) {
    this.robotModel = robotModel;
    this.motionData = null;
    this.currentFrame = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.loop = true;
    this.lastUpdateTime = 0;
    this.callbacks = {
      onFrameChange: [],
      onPlayStateChange: [],
      onMotionLoad: []
    };
  }

  loadMotion(motionData) {
    this.motionData = motionData;
    this.currentFrame = 0;
    this.isPlaying = false;
    this.lastUpdateTime = performance.now();

    const availableJoints = this.robotModel?.joints ? Array.from(this.robotModel.joints.keys()) : [];
    const motionJoints = motionData.frames[0] ? Object.keys(motionData.frames[0].joints) : [];
    const missingJoints = motionJoints.filter(j => !availableJoints.includes(j));

    console.log('CSV Motion loaded:', {
      robotType: motionData.robotType,
      frames: motionData.frameCount,
      duration: motionData.duration,
      fps: motionData.fps,
      availableJoints: availableJoints,
      motionJoints: motionJoints,
      missingJoints: missingJoints
    });

    if (missingJoints.length > 0) {
      console.warn(`Motion data contains ${missingJoints.length} joints not found in robot model`);
    }

    this.trigger('onMotionLoad', motionData);
    this.applyFrame(0);
  }

  play() {
    if (!this.motionData) return;
    this.isPlaying = true;
    this.lastUpdateTime = performance.now();
    this.trigger('onPlayStateChange', true);
  }

  pause() {
    this.isPlaying = false;
    this.trigger('onPlayStateChange', false);
  }

  stop() {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.applyFrame(0);
    this.trigger('onPlayStateChange', false);
    this.trigger('onFrameChange', 0);
  }

  setFrame(frameIndex) {
    if (!this.motionData) return;

    this.currentFrame = Math.max(0, Math.min(frameIndex, this.motionData.frameCount - 1));
    this.applyFrame(this.currentFrame);
    this.trigger('onFrameChange', this.currentFrame);
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = Math.max(0.1, Math.min(speed, 5.0));
  }

  setLoop(loop) {
    this.loop = loop;
  }

  update() {
    if (!this.isPlaying || !this.motionData) return;

    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    const frameDelta = deltaTime * this.motionData.fps * this.playbackSpeed;
    this.currentFrame += frameDelta;

    if (this.currentFrame >= this.motionData.frameCount) {
      if (this.loop) {
        this.currentFrame = this.currentFrame % this.motionData.frameCount;
      } else {
        this.currentFrame = this.motionData.frameCount - 1;
        this.pause();
      }
    }

    this.applyFrame(Math.floor(this.currentFrame));
    this.trigger('onFrameChange', this.currentFrame);
  }

  applyFrame(frameIndex) {
    if (!this.motionData || !this.robotModel) return;

    const frame = this.motionData.frames[frameIndex];
    if (!frame) return;

    if (this.robotModel.threeObject) {
      const rootLink = this.robotModel.threeObject;

      rootLink.position.set(
        frame.root.position.x,
        frame.root.position.y,
        frame.root.position.z
      );

      rootLink.quaternion.set(
        frame.root.quaternion.x,
        frame.root.quaternion.y,
        frame.root.quaternion.z,
        frame.root.quaternion.w
      );
    }

    for (const [jointName, angle] of Object.entries(frame.joints)) {
      this.setJointAngle(jointName, angle);
    }

    if (this.robotModel.threeObject) {
      this.robotModel.threeObject.updateMatrixWorld(true);
    }
  }

  setJointAngle(jointName, angle) {
    if (!this.robotModel || !this.robotModel.joints) return;

    const joint = this.robotModel.joints.get(jointName);
    if (!joint) {
      return;
    }

    if (joint.threeObject) {
      if (typeof joint.threeObject.setJointValue === 'function') {
        joint.threeObject.setJointValue(angle);
      } else if (joint.threeObject.setAngle !== undefined) {
        joint.threeObject.angle = angle;
      } else if (joint.threeObject.jointValue !== undefined) {
        joint.threeObject.jointValue = angle;
      }
      joint.currentValue = angle;
    }
  }

  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }

  getCurrentTime() {
    if (!this.motionData) return 0;
    return this.currentFrame / this.motionData.fps;
  }

  getDuration() {
    return this.motionData ? this.motionData.duration : 0;
  }

  getProgress() {
    if (!this.motionData) return 0;
    return this.currentFrame / this.motionData.frameCount;
  }

  dispose() {
    this.pause();
    this.motionData = null;
    this.callbacks = {
      onFrameChange: [],
      onPlayStateChange: [],
      onMotionLoad: []
    };
  }
}

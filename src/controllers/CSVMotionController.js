import * as THREE from 'three';
import { MJCFAdapter } from '../adapters/MJCFAdapter.js';

export class CSVMotionController {
  constructor(robotModel, sceneManager = null) {
    this.robotModel = robotModel;
    this.sceneManager = sceneManager;
    this.modelType = this.detectModelType();
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

    this.accumulatedPosition = new THREE.Vector3(0, 0, 0);
    this.accumulatedRotation = new THREE.Quaternion(0, 0, 0, 1);
    this.lastMotionFinalState = null;
    this.heightLock = null;
  }

  loadMotion(motionData, preserveState = true) {
    if (this.motionData && preserveState && motionData.frames[0]) {
      const chainFrameIndex = Math.min(Math.floor(this.currentFrame), this.motionData.frameCount - 1);
      const lastFrame = this.motionData.frames[chainFrameIndex];

      if (lastFrame) {
        const lastLocalPos = new THREE.Vector3(
          lastFrame.root.position.x,
          lastFrame.root.position.y,
          lastFrame.root.position.z
        );
        const lastLocalRot = new THREE.Quaternion(
          lastFrame.root.quaternion.x,
          lastFrame.root.quaternion.y,
          lastFrame.root.quaternion.z,
          lastFrame.root.quaternion.w
        );

        const finalWorldPos = lastLocalPos.clone().applyQuaternion(this.accumulatedRotation).add(this.accumulatedPosition);
        const finalWorldRot = this.accumulatedRotation.clone().multiply(lastLocalRot);

        const newMotionStartPos = new THREE.Vector3(
          motionData.frames[0].root.position.x,
          motionData.frames[0].root.position.y,
          motionData.frames[0].root.position.z
        );
        const newMotionStartRot = new THREE.Quaternion(
          motionData.frames[0].root.quaternion.x,
          motionData.frames[0].root.quaternion.y,
          motionData.frames[0].root.quaternion.z,
          motionData.frames[0].root.quaternion.w
        );

        const invNewMotionStartRot = newMotionStartRot.clone().invert();
        this.accumulatedRotation = finalWorldRot.clone().multiply(invNewMotionStartRot);

        const rotatedNewStart = newMotionStartPos.clone().applyQuaternion(this.accumulatedRotation);
        this.accumulatedPosition = finalWorldPos.clone().sub(rotatedNewStart);

        this.heightLock = finalWorldPos.z;

        console.log('Motion chaining:', {
          lastLocal: lastLocalPos.toArray(),
          finalWorld: finalWorldPos.toArray(),
          newStart: newMotionStartPos.toArray(),
          rotatedNewStart: rotatedNewStart.toArray(),
          accPos: this.accumulatedPosition.toArray(),
          accRot: [this.accumulatedRotation.x, this.accumulatedRotation.y, this.accumulatedRotation.z, this.accumulatedRotation.w],
          heightLock: this.heightLock
        });
      }
    } else {
      this.heightLock = null;
    }

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

    // Position camera in front of robot for optimal viewing
    if (this.sceneManager && typeof this.sceneManager.positionCameraInFrontOfRobot === 'function') {
      // Delay slightly to ensure frame has been applied
      requestAnimationFrame(() => {
        this.sceneManager.positionCameraInFrontOfRobot();
      });
    }
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

      const framePos = new THREE.Vector3(
        frame.root.position.x,
        frame.root.position.y,
        frame.root.position.z
      );

      const frameRot = new THREE.Quaternion(
        frame.root.quaternion.x,
        frame.root.quaternion.y,
        frame.root.quaternion.z,
        frame.root.quaternion.w
      );

      const rotatedOffset = framePos.clone().applyQuaternion(this.accumulatedRotation);
      const finalPos = rotatedOffset.add(this.accumulatedPosition);
      const finalRot = this.accumulatedRotation.clone().multiply(frameRot);

      if (this.heightLock !== null) {
        finalPos.z = this.heightLock;
      }

      rootLink.position.copy(finalPos);
      rootLink.quaternion.copy(finalRot);
    }

    for (const [jointName, angle] of Object.entries(frame.joints)) {
      this.setJointAngle(jointName, angle);
    }

    if (this.robotModel.threeObject) {
      this.robotModel.threeObject.updateMatrixWorld(true);
    }

    if (this.sceneManager && typeof this.sceneManager.updateEnvironment === 'function') {
      this.sceneManager.updateEnvironment(false);
    }
  }

  detectModelType() {
    if (!this.robotModel || !this.robotModel.threeObject) return 'unknown';
    if (this.robotModel.threeObject.userData && this.robotModel.threeObject.userData.type) {
      return this.robotModel.threeObject.userData.type;
    }
    return 'unknown';
  }

  setJointAngle(jointName, angle) {
    if (!this.robotModel || !this.robotModel.joints) return;

    const joint = this.robotModel.joints.get(jointName);
    if (!joint) {
      return;
    }

    if (this.modelType === 'mjcf') {
      MJCFAdapter.setJointAngle(joint, angle);
    } else if (joint.threeObject) {
      if (typeof joint.threeObject.setJointValue === 'function') {
        joint.threeObject.setJointValue(angle);
      } else if (joint.threeObject.angle !== undefined) {
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

  resetAccumulatedTransforms() {
    this.accumulatedPosition.set(0, 0, 0);
    this.accumulatedRotation.set(0, 0, 0, 1);
    this.lastMotionFinalState = null;
    this.heightLock = null;
  }

  dispose() {
    this.pause();
    this.motionData = null;
    this.callbacks = {
      onFrameChange: [],
      onPlayStateChange: [],
      onMotionLoad: []
    };
    this.resetAccumulatedTransforms();
  }
}

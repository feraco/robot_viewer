import * as THREE from 'three';

export class MotionCalibrator {
  constructor() {
    this.calibrations = new Map();
  }

  calibrateMotion(motionId, motionData) {
    if (!motionData || !motionData.frames || motionData.frames.length < 2) return null;

    const firstFrame = motionData.frames[0];
    const lastFrame = motionData.frames[motionData.frames.length - 1];

    const startPos = new THREE.Vector3(
      firstFrame.root.position.x,
      firstFrame.root.position.y,
      firstFrame.root.position.z
    );
    const endPos = new THREE.Vector3(
      lastFrame.root.position.x,
      lastFrame.root.position.y,
      lastFrame.root.position.z
    );

    const startRot = new THREE.Quaternion(
      firstFrame.root.quaternion.x,
      firstFrame.root.quaternion.y,
      firstFrame.root.quaternion.z,
      firstFrame.root.quaternion.w
    );
    const endRot = new THREE.Quaternion(
      lastFrame.root.quaternion.x,
      lastFrame.root.quaternion.y,
      lastFrame.root.quaternion.z,
      lastFrame.root.quaternion.w
    );

    const displacement = endPos.clone().sub(startPos);
    const forwardDistance = Math.sqrt(displacement.x * displacement.x + displacement.y * displacement.y);

    const relativeRot = startRot.clone().invert().multiply(endRot);
    const euler = new THREE.Euler().setFromQuaternion(relativeRot, 'ZYX');
    const yawChange = euler.z;

    const calibration = {
      motionId,
      displacement: { x: displacement.x, y: displacement.y, z: displacement.z },
      forwardDistance,
      yawChange,
      duration: motionData.duration,
      frameCount: motionData.frameCount
    };

    this.calibrations.set(motionId, calibration);
    return calibration;
  }

  calibrateAll(preloadedMotions) {
    for (const [motionId, motionData] of preloadedMotions) {
      this.calibrateMotion(motionId, motionData);
    }
    return this.calibrations;
  }

  getCalibration(motionId) {
    return this.calibrations.get(motionId);
  }

  getForwardDistance(motionId) {
    const cal = this.calibrations.get(motionId);
    return cal ? cal.forwardDistance : 0;
  }

  getYawChange(motionId) {
    const cal = this.calibrations.get(motionId);
    return cal ? cal.yawChange : 0;
  }
}

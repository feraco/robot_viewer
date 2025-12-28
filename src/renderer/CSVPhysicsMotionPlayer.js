import { CSVMotionLoader } from '../loaders/CSVMotionLoader.js';

export class CSVPhysicsMotionPlayer {
  constructor(simulationManager) {
    this.simulationManager = simulationManager;
    this.motionData = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.loop = false;
    this.playbackSpeed = 1.0;

    this.pdGains = {
      kp: 100.0,
      kd: 10.0
    };

    this.jointMapping = new Map();
    this.initialPositionsSet = false;
  }

  async loadFromFile(file, robotType = null) {
    try {
      const motionData = await CSVMotionLoader.loadFromFile(file, robotType);
      this.loadMotionData(motionData);
      return motionData;
    } catch (error) {
      console.error('Failed to load CSV motion for physics:', error);
      throw error;
    }
  }

  async loadFromURL(url, robotType = null) {
    try {
      const response = await fetch(url);
      const csvText = await response.text();
      const detectedType = robotType || CSVMotionLoader.detectRobotType(csvText);
      const motionData = CSVMotionLoader.parseCSV(csvText, detectedType);
      this.loadMotionData(motionData);
      return motionData;
    } catch (error) {
      console.error('Failed to load CSV motion from URL:', error);
      throw error;
    }
  }

  loadMotionData(motionData) {
    this.motionData = motionData;
    this.currentTime = 0;
    this.isPlaying = false;
    this.initialPositionsSet = false;
    this.buildJointMapping();

    console.log('CSV Physics Motion loaded:', {
      robotType: motionData.robotType,
      frames: motionData.frameCount,
      duration: motionData.duration,
      fps: motionData.fps,
      mappedJoints: this.jointMapping.size
    });
  }

  buildJointMapping() {
    this.jointMapping.clear();

    if (!this.simulationManager || !this.simulationManager.model) {
      console.warn('Cannot build joint mapping: simulation not loaded');
      return;
    }

    const model = this.simulationManager.model;
    const mujoco = this.simulationManager.mujoco;

    if (!model.nu || model.nu === 0) {
      console.warn('No actuators in model, cannot map joints');
      return;
    }

    const firstFrame = this.motionData.frames[0];
    if (!firstFrame) return;

    const csvJointNames = Object.keys(firstFrame.joints);

    try {
      const modelPtr = model.ptr || model;
      const objType = mujoco.mjtObj?.mjOBJ_ACTUATOR?.value || 2;

      for (const csvJointName of csvJointNames) {
        const jointBaseName = csvJointName.replace('_joint', '').replace(/_/g, '').toLowerCase();

        for (let i = 0; i < model.nu; i++) {
          try {
            const actuatorName = mujoco.mj_id2name(modelPtr, objType, i);
            if (actuatorName) {
              const actuatorBaseName = actuatorName.replace(/_/g, '').toLowerCase();

              if (actuatorBaseName.includes(jointBaseName) ||
                  actuatorName.toLowerCase().includes(csvJointName.toLowerCase())) {
                this.jointMapping.set(csvJointName, {
                  actuatorIndex: i,
                  actuatorName: actuatorName
                });
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error building joint mapping:', error);
    }

    const mappedCount = this.jointMapping.size;
    const totalCount = csvJointNames.length;

    if (mappedCount < totalCount) {
      console.warn(`Only mapped ${mappedCount}/${totalCount} joints from CSV to actuators`);
      const unmapped = csvJointNames.filter(name => !this.jointMapping.has(name));
      console.warn('Unmapped joints:', unmapped);
    }
  }

  setInitialPose() {
    if (!this.motionData || !this.motionData.frames[0]) {
      return false;
    }

    const firstFrame = this.motionData.frames[0];
    const model = this.simulationManager.model;
    const mujoco = this.simulationManager.mujoco;
    const isOldAPI = this.simulationManager.isOldAPI;

    if (!model) return false;

    const qpos = isOldAPI ?
      this.simulationManager.data?.qpos :
      this.simulationManager.simulation?.qpos;

    if (!qpos) return false;

    try {
      if (firstFrame.root) {
        const rootQposStart = 0;
        qpos[rootQposStart + 0] = firstFrame.root.position.x;
        qpos[rootQposStart + 1] = firstFrame.root.position.y;
        qpos[rootQposStart + 2] = firstFrame.root.position.z;
        qpos[rootQposStart + 3] = firstFrame.root.quaternion.w;
        qpos[rootQposStart + 4] = firstFrame.root.quaternion.x;
        qpos[rootQposStart + 5] = firstFrame.root.quaternion.y;
        qpos[rootQposStart + 6] = firstFrame.root.quaternion.z;
      }

      for (let i = 0; i < model.njnt; i++) {
        const jointName = mujoco.mj_id2name(
          model.ptr || model,
          mujoco.mjtObj.mjOBJ_JOINT.value,
          i
        );

        if (jointName && firstFrame.joints[jointName] !== undefined) {
          const qposAdr = model.jnt_qposadr[i];
          qpos[qposAdr] = firstFrame.joints[jointName];
        }
      }

      if (isOldAPI) {
        mujoco.mj_forward(model, this.simulationManager.data);
      } else {
        this.simulationManager.simulation.forward();
      }

      this.initialPositionsSet = true;
      console.log('Initial pose set from CSV frame 0');
      return true;
    } catch (error) {
      console.error('Error setting initial pose:', error);
      return false;
    }
  }

  play() {
    if (!this.motionData) {
      console.warn('No motion data loaded');
      return false;
    }

    if (!this.initialPositionsSet) {
      this.setInitialPose();
    }

    this.isPlaying = true;
    this.currentTime = 0;
    console.log('Playing CSV motion in physics simulation');
    return true;
  }

  pause() {
    this.isPlaying = false;
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    this.initialPositionsSet = false;
  }

  setLoop(loop) {
    this.loop = loop;
  }

  setPlaybackSpeed(speed) {
    this.playbackSpeed = Math.max(0.1, Math.min(speed, 3.0));
  }

  setPDGains(kp, kd) {
    this.pdGains.kp = kp;
    this.pdGains.kd = kd;
  }

  update(deltaTime) {
    if (!this.isPlaying || !this.motionData) {
      return;
    }

    this.currentTime += deltaTime * this.playbackSpeed;

    if (this.currentTime >= this.motionData.duration) {
      if (this.loop) {
        this.currentTime = this.currentTime % this.motionData.duration;
      } else {
        this.currentTime = this.motionData.duration;
        this.isPlaying = false;
        return;
      }
    }

    const targetFrame = this.getFrameAtTime(this.currentTime);
    this.applyPDControl(targetFrame);
  }

  getFrameAtTime(time) {
    if (!this.motionData || this.motionData.frames.length === 0) {
      return null;
    }

    const frameIndex = time * this.motionData.fps;
    const frame1Index = Math.floor(frameIndex);
    const frame2Index = Math.min(frame1Index + 1, this.motionData.frames.length - 1);
    const t = frameIndex - frame1Index;

    const frame1 = this.motionData.frames[frame1Index];
    const frame2 = this.motionData.frames[frame2Index];

    if (!frame1) return null;
    if (t < 0.001 || !frame2) return frame1;

    const interpolatedFrame = {
      root: {
        position: {
          x: frame1.root.position.x + (frame2.root.position.x - frame1.root.position.x) * t,
          y: frame1.root.position.y + (frame2.root.position.y - frame1.root.position.y) * t,
          z: frame1.root.position.z + (frame2.root.position.z - frame1.root.position.z) * t
        },
        quaternion: this.slerpQuaternion(frame1.root.quaternion, frame2.root.quaternion, t)
      },
      joints: {}
    };

    for (const jointName in frame1.joints) {
      const angle1 = frame1.joints[jointName];
      const angle2 = frame2.joints[jointName] !== undefined ? frame2.joints[jointName] : angle1;
      interpolatedFrame.joints[jointName] = angle1 + (angle2 - angle1) * t;
    }

    return interpolatedFrame;
  }

  slerpQuaternion(q1, q2, t) {
    const dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
    const theta = Math.acos(Math.max(-1, Math.min(1, dot)));

    if (Math.abs(theta) < 0.001) {
      return q1;
    }

    const sinTheta = Math.sin(theta);
    const w1 = Math.sin((1 - t) * theta) / sinTheta;
    const w2 = Math.sin(t * theta) / sinTheta;

    return {
      x: w1 * q1.x + w2 * q2.x,
      y: w1 * q1.y + w2 * q2.y,
      z: w1 * q1.z + w2 * q2.z,
      w: w1 * q1.w + w2 * q2.w
    };
  }

  applyPDControl(targetFrame) {
    if (!targetFrame) return;

    const model = this.simulationManager.model;
    const mujoco = this.simulationManager.mujoco;
    const isOldAPI = this.simulationManager.isOldAPI;

    if (!model) return;

    const qpos = isOldAPI ?
      this.simulationManager.data?.qpos :
      this.simulationManager.simulation?.qpos;

    const qvel = isOldAPI ?
      this.simulationManager.data?.qvel :
      this.simulationManager.simulation?.qvel;

    const ctrl = isOldAPI ?
      this.simulationManager.data?.ctrl :
      this.simulationManager.simulation?.ctrl;

    if (!qpos || !qvel || !ctrl) return;

    for (const [jointName, mapping] of this.jointMapping) {
      const targetPosition = targetFrame.joints[jointName];
      if (targetPosition === undefined) continue;

      try {
        let currentPosition = 0;
        let currentVelocity = 0;

        for (let i = 0; i < model.njnt; i++) {
          const name = mujoco.mj_id2name(
            model.ptr || model,
            mujoco.mjtObj.mjOBJ_JOINT.value,
            i
          );

          if (name === jointName) {
            const qposAdr = model.jnt_qposadr[i];
            const qvelAdr = model.jnt_dofadr[i];
            currentPosition = qpos[qposAdr];
            currentVelocity = qvel[qvelAdr];
            break;
          }
        }

        const positionError = targetPosition - currentPosition;
        const velocityError = 0 - currentVelocity;

        const controlSignal = this.pdGains.kp * positionError + this.pdGains.kd * velocityError;

        ctrl[mapping.actuatorIndex] = controlSignal;
      } catch (error) {
        continue;
      }
    }
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.motionData ? this.motionData.duration : 0,
      progress: this.motionData ? this.currentTime / this.motionData.duration : 0,
      loop: this.loop,
      playbackSpeed: this.playbackSpeed,
      hasMotion: this.motionData !== null,
      mappedJoints: this.jointMapping.size
    };
  }

  dispose() {
    this.stop();
    this.motionData = null;
    this.jointMapping.clear();
  }
}

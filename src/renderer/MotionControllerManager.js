import * as THREE from 'three';
import { WalkingGaitGenerator } from './WalkingGaitGenerator.js';

export class MotionControllerManager {
  constructor(simulationManager) {
    this.simulationManager = simulationManager;
    this.activeMotion = null;
    this.motionPresets = new Map();
    this.isPlaying = false;
    this.currentTime = 0;
    this.playbackSpeed = 1.0;
    this.loopEnabled = false;
    this.walkingGait = new WalkingGaitGenerator();

    this.initializePresets();
    this.logAvailableActuators();
  }

  logAvailableActuators() {
    try {
      if (!this.simulationManager || !this.simulationManager.mujoco || !this.simulationManager.model) {
        console.log('Motion Controller: Waiting for MuJoCo simulation to load');
        return;
      }

      const model = this.simulationManager.model;
      const mujoco = this.simulationManager.mujoco;

      if (!model.nu || model.nu === 0) {
        console.log('Motion Controller: No actuators defined in model. Motion presets will not work.');
        console.log('To use motion presets, load an MJCF file with actuators defined.');
        return;
      }

      if (!mujoco.mj_id2name) {
        console.log('Motion Controller: MuJoCo API not fully loaded');
        return;
      }

      const actuators = [];
      const modelPtr = model.ptr || model;
      const objType = mujoco.mjtObj?.mjOBJ_ACTUATOR?.value ||
                      mujoco.mjtObj?.mjOBJ_ACTUATOR ||
                      2;

      for (let i = 0; i < model.nu; i++) {
        try {
          const actuatorName = mujoco.mj_id2name(modelPtr, objType, i);
          if (actuatorName) {
            actuators.push(actuatorName);
          }
        } catch (e) {
          continue;
        }
      }

      if (actuators.length > 0) {
        console.log(`Motion Controller: Found ${actuators.length} actuators:`, actuators);
      } else {
        console.log('Motion Controller: No actuators found. Motion presets will not work.');
      }
    } catch (error) {
      console.log('Motion Controller: Could not enumerate actuators');
    }
  }

  initializePresets() {
    this.registerPreset('stand', {
      name: 'Stand',
      type: 'static',
      duration: 1.0,
      positions: {
        'left_hip_pitch_joint': 0,
        'left_hip_roll_joint': 0,
        'left_hip_yaw_joint': 0,
        'left_knee_joint': 0,
        'left_ankle_pitch_joint': 0,
        'left_ankle_roll_joint': 0,
        'right_hip_pitch_joint': 0,
        'right_hip_roll_joint': 0,
        'right_hip_yaw_joint': 0,
        'right_knee_joint': 0,
        'right_ankle_pitch_joint': 0,
        'right_ankle_roll_joint': 0,
        'torso_joint': 0,
        'left_shoulder_pitch_joint': 0,
        'left_shoulder_roll_joint': 0.2,
        'left_shoulder_yaw_joint': 0,
        'left_elbow_pitch_joint': -0.5,
        'right_shoulder_pitch_joint': 0,
        'right_shoulder_roll_joint': -0.2,
        'right_shoulder_yaw_joint': 0,
        'right_elbow_pitch_joint': -0.5
      }
    });

    this.registerPreset('crouch', {
      name: 'Crouch',
      type: 'static',
      duration: 2.0,
      positions: {
        'left_hip_pitch_joint': -0.8,
        'left_hip_roll_joint': 0,
        'left_hip_yaw_joint': 0,
        'left_knee_joint': 1.6,
        'left_ankle_pitch_joint': -0.8,
        'left_ankle_roll_joint': 0,
        'right_hip_pitch_joint': -0.8,
        'right_hip_roll_joint': 0,
        'right_hip_yaw_joint': 0,
        'right_knee_joint': 1.6,
        'right_ankle_pitch_joint': -0.8,
        'right_ankle_roll_joint': 0,
        'torso_joint': 0,
        'left_shoulder_pitch_joint': 0.5,
        'left_shoulder_roll_joint': 0.2,
        'left_shoulder_yaw_joint': 0,
        'left_elbow_pitch_joint': -1.0,
        'right_shoulder_pitch_joint': 0.5,
        'right_shoulder_roll_joint': -0.2,
        'right_shoulder_yaw_joint': 0,
        'right_elbow_pitch_joint': -1.0
      }
    });

    this.registerPreset('wave', {
      name: 'Wave',
      type: 'keyframe',
      duration: 3.0,
      keyframes: [
        {
          time: 0.0,
          positions: {
            'right_shoulder_pitch_joint': 0,
            'right_shoulder_roll_joint': -0.2,
            'right_elbow_pitch_joint': -0.5
          }
        },
        {
          time: 0.5,
          positions: {
            'right_shoulder_pitch_joint': -1.5,
            'right_shoulder_roll_joint': -0.8,
            'right_elbow_pitch_joint': -1.8
          }
        },
        {
          time: 1.0,
          positions: {
            'right_shoulder_pitch_joint': -1.5,
            'right_shoulder_roll_joint': -0.5,
            'right_elbow_pitch_joint': -1.8
          }
        },
        {
          time: 1.5,
          positions: {
            'right_shoulder_pitch_joint': -1.5,
            'right_shoulder_roll_joint': -0.8,
            'right_elbow_pitch_joint': -1.8
          }
        },
        {
          time: 2.0,
          positions: {
            'right_shoulder_pitch_joint': -1.5,
            'right_shoulder_roll_joint': -0.5,
            'right_elbow_pitch_joint': -1.8
          }
        },
        {
          time: 3.0,
          positions: {
            'right_shoulder_pitch_joint': 0,
            'right_shoulder_roll_joint': -0.2,
            'right_elbow_pitch_joint': -0.5
          }
        }
      ]
    });

    this.registerPreset('walk_forward', {
      name: 'Walk Forward',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateWalkingMotion(time, params),
      params: { speed: 1.0, direction: 0 }
    });

    this.registerPreset('walk_slow', {
      name: 'Walk Slow',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateWalkingMotion(time, params),
      params: { speed: 0.5, direction: 0 }
    });

    this.registerPreset('walk_fast', {
      name: 'Walk Fast',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateWalkingMotion(time, params),
      params: { speed: 1.5, direction: 0 }
    });

    this.registerPreset('walk_backward', {
      name: 'Walk Backward',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateWalkingMotion(time, params),
      params: { speed: 1.0, direction: 180 }
    });

    this.registerPreset('sidestep_left', {
      name: 'Sidestep Left',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateSidestepMotion(time, params),
      params: { speed: 1.0, direction: 'left' }
    });

    this.registerPreset('sidestep_right', {
      name: 'Sidestep Right',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateSidestepMotion(time, params),
      params: { speed: 1.0, direction: 'right' }
    });

    this.registerPreset('turn_left', {
      name: 'Turn Left',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateTurnMotion(time, params),
      params: { speed: 1.0, direction: 'left' }
    });

    this.registerPreset('turn_right', {
      name: 'Turn Right',
      type: 'procedural',
      duration: Infinity,
      generator: (time, params) => this.walkingGait.generateTurnMotion(time, params),
      params: { speed: 1.0, direction: 'right' }
    });
  }

  registerPreset(id, preset) {
    this.motionPresets.set(id, preset);
  }

  getPreset(id) {
    return this.motionPresets.get(id);
  }

  getAllPresets() {
    return Array.from(this.motionPresets.entries()).map(([id, preset]) => ({
      id,
      name: preset.name,
      type: preset.type
    }));
  }

  playMotion(presetId, options = {}) {
    if (!this.simulationManager || !this.simulationManager.mujoco || !this.simulationManager.model) {
      console.warn('Cannot play motion: MuJoCo simulation not loaded. Please load an MJCF file and enable simulation.');
      return false;
    }

    const preset = this.getPreset(presetId);
    if (!preset) {
      console.warn(`Motion preset '${presetId}' not found`);
      return false;
    }

    console.log(`Starting motion: ${preset.name} (${presetId})`);
    console.log(`Motion type: ${preset.type}, Duration: ${preset.duration}`);

    this.activeMotion = {
      preset,
      presetId,
      startPositions: this.getCurrentJointPositions(),
      options: {
        speed: options.speed || 1.0,
        loop: options.loop || false,
        onComplete: options.onComplete
      }
    };

    console.log(`Start positions:`, this.activeMotion.startPositions);

    this.currentTime = 0;
    this.isPlaying = true;
    this.playbackSpeed = options.speed || 1.0;
    this.loopEnabled = options.loop || false;

    return true;
  }

  stopMotion() {
    this.isPlaying = false;
    this.activeMotion = null;
    this.currentTime = 0;
  }

  pauseMotion() {
    this.isPlaying = false;
  }

  resumeMotion() {
    if (this.activeMotion) {
      this.isPlaying = true;
    }
  }

  getCurrentJointPositions() {
    if (!this.simulationManager || !this.simulationManager.mujoco) {
      return {};
    }

    const positions = {};
    const model = this.simulationManager.model;
    const mujoco = this.simulationManager.mujoco;
    const isOldAPI = this.simulationManager.isOldAPI;

    if (!model || !model.ptr || !mujoco.mjtObj || !mujoco.mjtObj.mjOBJ_JOINT) {
      return positions;
    }

    const qpos = isOldAPI ?
      this.simulationManager.data?.qpos :
      this.simulationManager.simulation?.qpos;

    if (!qpos) return positions;

    try {
      for (let i = 0; i < model.njnt; i++) {
        const jointName = mujoco.mj_id2name(
          model.ptr,
          mujoco.mjtObj.mjOBJ_JOINT.value,
          i
        );

        if (jointName) {
          const qposAdr = model.jnt_qposadr[i];
          positions[jointName] = qpos[qposAdr];
        }
      }
    } catch (error) {
      console.warn('Error getting joint positions:', error);
    }

    return positions;
  }

  setJointPosition(jointName, position) {
    if (!this.simulationManager || !this.simulationManager.mujoco) {
      return false;
    }

    const model = this.simulationManager.model;
    const mujoco = this.simulationManager.mujoco;
    const data = this.simulationManager.data;

    if (!model || !model.ptr || !data || !mujoco.mjtObj || !mujoco.mjtObj.mjOBJ_JOINT) {
      return false;
    }

    try {
      for (let i = 0; i < model.njnt; i++) {
        const name = mujoco.mj_id2name(
          model.ptr,
          mujoco.mjtObj.mjOBJ_JOINT.value,
          i
        );

        if (name === jointName) {
          const qposAdr = model.jnt_qposadr[i];
          data.qpos[qposAdr] = position;
          return true;
        }
      }
    } catch (error) {
      console.warn('Error setting joint position:', error);
    }

    return false;
  }

  setJointControl(jointName, value) {
    if (!this.simulationManager || !this.simulationManager.mujoco) {
      return false;
    }

    const model = this.simulationManager.model;
    const mujoco = this.simulationManager.mujoco;
    const isOldAPI = this.simulationManager.isOldAPI;

    if (!model) {
      return false;
    }

    const ctrl = isOldAPI ?
      this.simulationManager.data?.ctrl :
      this.simulationManager.simulation?.ctrl;

    if (!ctrl) {
      return false;
    }

    if (!model.nu || model.nu === 0) {
      return false;
    }

    const jointBaseName = jointName.replace('_joint', '').replace('_', '');
    let found = false;

    try {
      const modelPtr = model.ptr || model;

      if (!mujoco.mj_id2name) {
        return false;
      }

      const objType = mujoco.mjtObj?.mjOBJ_ACTUATOR?.value ||
                      mujoco.mjtObj?.mjOBJ_ACTUATOR ||
                      2;

      for (let i = 0; i < model.nu; i++) {
        let actuatorName;

        try {
          actuatorName = mujoco.mj_id2name(modelPtr, objType, i);
        } catch (e) {
          continue;
        }

        if (actuatorName) {
          const actuatorBaseName = actuatorName.replace('_', '').toLowerCase();
          const jointNameLower = jointBaseName.toLowerCase();

          if (actuatorBaseName.includes(jointNameLower) ||
              actuatorName.toLowerCase().includes(jointName.toLowerCase())) {
            ctrl[i] = value;
            found = true;
            break;
          }
        }
      }
    } catch (error) {
      return false;
    }

    return found;
  }

  update(deltaTime) {
    if (!this.isPlaying || !this.activeMotion) {
      return;
    }

    this.currentTime += deltaTime * this.playbackSpeed;

    const preset = this.activeMotion.preset;
    const duration = preset.duration;

    if (this.currentTime >= duration && duration !== Infinity) {
      if (this.loopEnabled) {
        this.currentTime = 0;
      } else {
        this.isPlaying = false;
        if (this.activeMotion.options.onComplete) {
          this.activeMotion.options.onComplete();
        }
        return;
      }
    }

    if (preset.type === 'static') {
      this.applyStaticMotion(preset, this.currentTime, duration);
    } else if (preset.type === 'keyframe') {
      this.applyKeyframeMotion(preset, this.currentTime);
    } else if (preset.type === 'procedural') {
      this.applyProceduralMotion(preset, this.currentTime);
    }

    this.forwardKinematics();
  }

  forwardKinematics() {
    if (!this.simulationManager || !this.simulationManager.mujoco) {
      return;
    }

    const model = this.simulationManager.model;
    const isOldAPI = this.simulationManager.isOldAPI;

    if (!model) return;

    if (isOldAPI && this.simulationManager.data) {
      this.simulationManager.mujoco.mj_forward(model, this.simulationManager.data);
    } else if (!isOldAPI && this.simulationManager.simulation) {
      this.simulationManager.simulation.forward();
    }
  }

  applyStaticMotion(preset, currentTime, duration) {
    const t = Math.min(currentTime / duration, 1.0);
    const eased = this.easeInOutCubic(t);

    const startPositions = this.activeMotion.startPositions;
    const targetPositions = preset.positions;

    for (const jointName in targetPositions) {
      const startPos = startPositions[jointName] || 0;
      const targetPos = targetPositions[jointName];
      const currentPos = startPos + (targetPos - startPos) * eased;

      this.setJointControl(jointName, currentPos);
    }
  }

  applyKeyframeMotion(preset, currentTime) {
    const keyframes = preset.keyframes;

    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }

    const segmentDuration = nextKeyframe.time - prevKeyframe.time;
    const segmentTime = currentTime - prevKeyframe.time;
    const t = segmentDuration > 0 ? segmentTime / segmentDuration : 0;
    const eased = this.easeInOutCubic(t);

    const allJointNames = new Set([
      ...Object.keys(prevKeyframe.positions),
      ...Object.keys(nextKeyframe.positions)
    ]);

    for (const jointName of allJointNames) {
      const prevPos = prevKeyframe.positions[jointName] || 0;
      const nextPos = nextKeyframe.positions[jointName] || 0;
      const currentPos = prevPos + (nextPos - prevPos) * eased;

      this.setJointControl(jointName, currentPos);
    }
  }

  applyProceduralMotion(preset, currentTime) {
    if (preset.generator) {
      const positions = preset.generator(currentTime, preset.params);

      for (const jointName in positions) {
        this.setJointControl(jointName, positions[jointName]);
      }
    }
  }

  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      activeMotion: this.activeMotion ? this.activeMotion.presetId : null,
      currentTime: this.currentTime,
      duration: this.activeMotion ? this.activeMotion.preset.duration : 0,
      progress: this.activeMotion ? this.currentTime / this.activeMotion.preset.duration : 0
    };
  }

  dispose() {
    this.stopMotion();
    this.motionPresets.clear();
    this.simulationManager = null;
  }
}

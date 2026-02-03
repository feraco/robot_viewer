import { parse } from 'pickleparser';
import { ROBOT_CONFIGS } from './CSVMotionLoader.js';

export class PKLMotionLoader {
  static async loadFromFile(file, robotType = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          const data = parse(uint8Array);
          const motionData = this.parsePickleData(data, robotType);
          resolve(motionData);
        } catch (error) {
          reject(new Error(`Failed to parse pickle file: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static parsePickleData(data, robotType = null) {
    let frames = [];
    let fps = 30;
    let detectedRobotType = robotType;

    if (Array.isArray(data)) {
      frames = this.parseArrayFormat(data, detectedRobotType);
    } else if (typeof data === 'object' && data !== null) {
      if (data.fps) fps = data.fps;
      if (data.robot_type) detectedRobotType = this.mapRobotType(data.robot_type);

      if (data.frames) {
        frames = this.parseArrayFormat(data.frames, detectedRobotType);
      } else if (data.joint_positions || data.qpos) {
        const jointData = data.joint_positions || data.qpos;
        frames = this.parseJointPositions(jointData, data.root_positions, data.root_quaternions, detectedRobotType);
      } else if (data.trajectory) {
        frames = this.parseArrayFormat(data.trajectory, detectedRobotType);
      } else {
        frames = this.parseDictFormat(data, detectedRobotType);
      }
    }

    if (!detectedRobotType) {
      detectedRobotType = this.detectRobotTypeFromFrames(frames);
    }

    return {
      fps: fps,
      frameCount: frames.length,
      duration: frames.length / fps,
      frames: frames,
      robotType: detectedRobotType
    };
  }

  static parseArrayFormat(arrayData, robotType) {
    const frames = [];
    const config = ROBOT_CONFIGS[robotType || 'G1'];

    for (const frameData of arrayData) {
      if (Array.isArray(frameData)) {
        frames.push(this.parseArrayFrame(frameData, config));
      } else if (typeof frameData === 'object') {
        frames.push(this.parseObjectFrame(frameData, config));
      }
    }

    return frames;
  }

  static parseArrayFrame(values, config) {
    const frame = {
      root: {
        position: { x: 0, y: 0, z: 0 },
        quaternion: { x: 0, y: 0, z: 0, w: 1 }
      },
      joints: {}
    };

    let valueIndex = 0;

    for (let i = 0; i < config.joints.length; i++) {
      const jointName = config.joints[i];

      if (jointName === 'root_joint') {
        if (valueIndex + 6 < values.length) {
          frame.root.position.x = values[valueIndex++];
          frame.root.position.y = values[valueIndex++];
          frame.root.position.z = values[valueIndex++];
          frame.root.quaternion.x = values[valueIndex++];
          frame.root.quaternion.y = values[valueIndex++];
          frame.root.quaternion.z = values[valueIndex++];
          frame.root.quaternion.w = values[valueIndex++];
        }
      } else {
        if (valueIndex < values.length) {
          frame.joints[jointName] = values[valueIndex++];
        }
      }
    }

    return frame;
  }

  static parseObjectFrame(obj, config) {
    const frame = {
      root: {
        position: { x: 0, y: 0, z: 0 },
        quaternion: { x: 0, y: 0, z: 0, w: 1 }
      },
      joints: {}
    };

    if (obj.root_position || obj.root_pos) {
      const pos = obj.root_position || obj.root_pos;
      frame.root.position.x = pos[0] || 0;
      frame.root.position.y = pos[1] || 0;
      frame.root.position.z = pos[2] || 0;
    }

    if (obj.root_quaternion || obj.root_quat) {
      const quat = obj.root_quaternion || obj.root_quat;
      frame.root.quaternion.x = quat[0] || 0;
      frame.root.quaternion.y = quat[1] || 0;
      frame.root.quaternion.z = quat[2] || 0;
      frame.root.quaternion.w = quat[3] || 1;
    }

    if (obj.joints) {
      frame.joints = { ...obj.joints };
    } else if (obj.joint_positions || obj.qpos) {
      const joints = obj.joint_positions || obj.qpos;
      if (config && config.joints) {
        let idx = 0;
        for (const jointName of config.joints) {
          if (jointName !== 'root_joint' && idx < joints.length) {
            frame.joints[jointName] = joints[idx++];
          }
        }
      }
    }

    return frame;
  }

  static parseJointPositions(jointPositions, rootPositions, rootQuaternions, robotType) {
    const frames = [];
    const config = ROBOT_CONFIGS[robotType || 'G1'];

    for (let i = 0; i < jointPositions.length; i++) {
      const frame = {
        root: {
          position: { x: 0, y: 0, z: 0 },
          quaternion: { x: 0, y: 0, z: 0, w: 1 }
        },
        joints: {}
      };

      if (rootPositions && rootPositions[i]) {
        frame.root.position.x = rootPositions[i][0] || 0;
        frame.root.position.y = rootPositions[i][1] || 0;
        frame.root.position.z = rootPositions[i][2] || 0;
      }

      if (rootQuaternions && rootQuaternions[i]) {
        frame.root.quaternion.x = rootQuaternions[i][0] || 0;
        frame.root.quaternion.y = rootQuaternions[i][1] || 0;
        frame.root.quaternion.z = rootQuaternions[i][2] || 0;
        frame.root.quaternion.w = rootQuaternions[i][3] || 1;
      }

      const joints = jointPositions[i];
      if (config && config.joints) {
        let idx = 0;
        for (const jointName of config.joints) {
          if (jointName !== 'root_joint' && idx < joints.length) {
            frame.joints[jointName] = joints[idx++];
          }
        }
      }

      frames.push(frame);
    }

    return frames;
  }

  static parseDictFormat(data, robotType) {
    const frames = [];
    const config = ROBOT_CONFIGS[robotType || 'G1'];

    const jointNames = Object.keys(data).filter(key =>
      !['fps', 'robot_type', 'root_position', 'root_quaternion'].includes(key)
    );

    if (jointNames.length === 0) return frames;

    const firstJoint = data[jointNames[0]];
    const frameCount = Array.isArray(firstJoint) ? firstJoint.length : 1;

    for (let i = 0; i < frameCount; i++) {
      const frame = {
        root: {
          position: { x: 0, y: 0, z: 0 },
          quaternion: { x: 0, y: 0, z: 0, w: 1 }
        },
        joints: {}
      };

      for (const jointName of jointNames) {
        const value = Array.isArray(data[jointName]) ? data[jointName][i] : data[jointName];
        frame.joints[jointName] = value;
      }

      frames.push(frame);
    }

    return frames;
  }

  static mapRobotType(type) {
    const typeMap = {
      'g1': 'G1',
      'G1': 'G1',
      'h1': 'H1',
      'H1': 'H1',
      'h1_2': 'H1_2',
      'H1_2': 'H1_2'
    };
    return typeMap[type] || 'G1';
  }

  static detectRobotTypeFromFrames(frames) {
    if (frames.length === 0) return 'G1';

    const firstFrame = frames[0];
    const jointCount = Object.keys(firstFrame.joints).length;

    if (jointCount >= 28) return 'G1';
    if (jointCount >= 26) return 'H1_2';
    if (jointCount >= 18) return 'H1';

    return 'G1';
  }
}

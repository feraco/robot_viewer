import { parse } from 'npyz';
import { ROBOT_CONFIGS } from './CSVMotionLoader.js';

export class NPZMotionLoader {
  static async loadFromFile(file, robotType = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const data = await parse(arrayBuffer);
          const motionData = this.parseNPZData(data, robotType);
          resolve(motionData);
        } catch (error) {
          reject(new Error(`Failed to parse NPZ file: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static parseNPZData(data, robotType = null) {
    let frames = [];
    let fps = 30;
    let detectedRobotType = robotType;

    if (data.fps) {
      fps = Array.isArray(data.fps.data) ? data.fps.data[0] : data.fps.data;
    }

    if (data.robot_type) {
      const rtData = data.robot_type.data;
      const robotTypeStr = this.parseRobotTypeString(rtData);
      if (robotTypeStr) {
        detectedRobotType = this.mapRobotType(robotTypeStr);
      }
    }

    if (data.frames) {
      frames = this.parseFramesArray(data.frames, detectedRobotType);
    } else if (data.joint_positions || data.qpos) {
      frames = this.parseJointPositions(
        data.joint_positions || data.qpos,
        data.root_positions || data.root_pos,
        data.root_quaternions || data.root_quat,
        detectedRobotType
      );
    } else if (data.trajectory) {
      frames = this.parseFramesArray(data.trajectory, detectedRobotType);
    } else {
      frames = this.parseJointArrays(data, detectedRobotType);
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

  static parseFramesArray(npArray, robotType) {
    const frames = [];
    const config = ROBOT_CONFIGS[robotType || 'G1'];
    const data = npArray.data;
    const shape = npArray.shape;

    if (shape.length === 2) {
      const [numFrames, numValues] = shape;

      for (let i = 0; i < numFrames; i++) {
        const frameValues = [];
        for (let j = 0; j < numValues; j++) {
          frameValues.push(data[i * numValues + j]);
        }
        frames.push(this.parseArrayFrame(frameValues, config));
      }
    } else if (shape.length === 1) {
      frames.push(this.parseArrayFrame(Array.from(data), config));
    }

    return frames;
  }

  static parseJointPositions(jointPosArray, rootPosArray, rootQuatArray, robotType) {
    const frames = [];
    const config = ROBOT_CONFIGS[robotType || 'G1'];

    const jointData = jointPosArray.data;
    const jointShape = jointPosArray.shape;

    const rootPosData = rootPosArray ? rootPosArray.data : null;
    const rootQuatData = rootQuatArray ? rootQuatArray.data : null;

    const numFrames = jointShape[0];
    const numJoints = jointShape[1];

    for (let i = 0; i < numFrames; i++) {
      const frame = {
        root: {
          position: { x: 0, y: 0, z: 0 },
          quaternion: { x: 0, y: 0, z: 0, w: 1 }
        },
        joints: {}
      };

      if (rootPosData) {
        frame.root.position.x = rootPosData[i * 3] || 0;
        frame.root.position.y = rootPosData[i * 3 + 1] || 0;
        frame.root.position.z = rootPosData[i * 3 + 2] || 0;
      }

      if (rootQuatData) {
        frame.root.quaternion.x = rootQuatData[i * 4] || 0;
        frame.root.quaternion.y = rootQuatData[i * 4 + 1] || 0;
        frame.root.quaternion.z = rootQuatData[i * 4 + 2] || 0;
        frame.root.quaternion.w = rootQuatData[i * 4 + 3] || 1;
      }

      if (config && config.joints) {
        let idx = 0;
        for (const jointName of config.joints) {
          if (jointName !== 'root_joint' && idx < numJoints) {
            frame.joints[jointName] = jointData[i * numJoints + idx];
            idx++;
          }
        }
      }

      frames.push(frame);
    }

    return frames;
  }

  static parseJointArrays(data, robotType) {
    const frames = [];
    const config = ROBOT_CONFIGS[robotType || 'G1'];

    const jointKeys = Object.keys(data).filter(key =>
      !['fps', 'robot_type', 'root_position', 'root_quaternion', 'root_pos', 'root_quat'].includes(key)
    );

    if (jointKeys.length === 0) return frames;

    const firstJointArray = data[jointKeys[0]];
    const frameCount = firstJointArray.shape[0];

    for (let i = 0; i < frameCount; i++) {
      const frame = {
        root: {
          position: { x: 0, y: 0, z: 0 },
          quaternion: { x: 0, y: 0, z: 0, w: 1 }
        },
        joints: {}
      };

      for (const jointKey of jointKeys) {
        const jointArray = data[jointKey];
        frame.joints[jointKey] = jointArray.data[i];
      }

      frames.push(frame);
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

  static parseRobotTypeString(data) {
    if (typeof data === 'string') return data;

    if (data instanceof Uint8Array) {
      try {
        return new TextDecoder().decode(data).replace(/\0/g, '');
      } catch (e) {
        return null;
      }
    }

    return null;
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

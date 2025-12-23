export const ROBOT_CONFIGS = {
  G1: {
    fps: 30,
    joints: [
      'root_joint',
      'left_hip_pitch_joint',
      'left_hip_roll_joint',
      'left_hip_yaw_joint',
      'left_knee_joint',
      'left_ankle_pitch_joint',
      'left_ankle_roll_joint',
      'right_hip_pitch_joint',
      'right_hip_roll_joint',
      'right_hip_yaw_joint',
      'right_knee_joint',
      'right_ankle_pitch_joint',
      'right_ankle_roll_joint',
      'waist_yaw_joint',
      'waist_roll_joint',
      'waist_pitch_joint',
      'left_shoulder_pitch_joint',
      'left_shoulder_roll_joint',
      'left_shoulder_yaw_joint',
      'left_elbow_joint',
      'left_wrist_roll_joint',
      'left_wrist_pitch_joint',
      'left_wrist_yaw_joint',
      'right_shoulder_pitch_joint',
      'right_shoulder_roll_joint',
      'right_shoulder_yaw_joint',
      'right_elbow_joint',
      'right_wrist_roll_joint',
      'right_wrist_pitch_joint',
      'right_wrist_yaw_joint'
    ]
  },
  H1_2: {
    fps: 30,
    joints: [
      'root_joint',
      'left_hip_yaw_joint',
      'left_hip_pitch_joint',
      'left_hip_roll_joint',
      'left_knee_joint',
      'left_ankle_pitch_joint',
      'left_ankle_roll_joint',
      'right_hip_yaw_joint',
      'right_hip_pitch_joint',
      'right_hip_roll_joint',
      'right_knee_joint',
      'right_ankle_pitch_joint',
      'right_ankle_roll_joint',
      'torso_joint',
      'left_shoulder_pitch_joint',
      'left_shoulder_roll_joint',
      'left_shoulder_yaw_joint',
      'left_elbow_joint',
      'left_wrist_roll_joint',
      'left_wrist_pitch_joint',
      'left_wrist_yaw_joint',
      'right_shoulder_pitch_joint',
      'right_shoulder_roll_joint',
      'right_shoulder_yaw_joint',
      'right_elbow_joint',
      'right_wrist_roll_joint',
      'right_wrist_pitch_joint',
      'right_wrist_yaw_joint'
    ]
  },
  H1: {
    fps: 30,
    joints: [
      'root_joint',
      'left_hip_yaw_joint',
      'left_hip_roll_joint',
      'left_hip_pitch_joint',
      'left_knee_joint',
      'left_ankle_joint',
      'right_hip_yaw_joint',
      'right_hip_roll_joint',
      'right_hip_pitch_joint',
      'right_knee_joint',
      'right_ankle_joint',
      'torso_joint',
      'left_shoulder_pitch_joint',
      'left_shoulder_roll_joint',
      'left_shoulder_yaw_joint',
      'left_elbow_joint',
      'right_shoulder_pitch_joint',
      'right_shoulder_roll_joint',
      'right_shoulder_yaw_joint',
      'right_elbow_joint'
    ]
  }
};

export class CSVMotionLoader {
  static parseCSV(csvText, robotType = 'G1') {
    const config = ROBOT_CONFIGS[robotType];
    if (!config) {
      throw new Error(`Unknown robot type: ${robotType}`);
    }

    const lines = csvText.trim().split('\n');
    const frames = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Detect separator: use comma if present, otherwise space/tab
      const separator = line.includes(',') ? ',' : /\s+/;
      const values = line.split(separator).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

      if (values.length === 0) {
        continue;
      }

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

      frames.push(frame);
    }

    return {
      fps: config.fps,
      frameCount: frames.length,
      duration: frames.length / config.fps,
      frames: frames,
      robotType: robotType
    };
  }

  static detectRobotType(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return 'G1';

    const firstLine = lines[0];
    // Detect separator: use comma if present, otherwise space/tab
    const separator = firstLine.includes(',') ? ',' : /\s+/;
    const valueCount = firstLine.split(separator).filter(v => v.trim()).length;

    if (valueCount === 37) return 'G1';
    if (valueCount === 35) return 'H1_2';
    if (valueCount === 27) return 'H1';

    return 'G1';
  }

  static async loadFromFile(file, robotType = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          const detectedType = robotType || this.detectRobotType(csvText);
          const motionData = this.parseCSV(csvText, detectedType);
          resolve(motionData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

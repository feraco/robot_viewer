export class WalkingGaitGenerator {
  constructor() {
    this.cycleTime = 2.0;
    this.stepHeight = 0.05;
    this.stepLength = 0.15;
    this.hipWidth = 0.2;
    this.bodyHeight = 0.0;
  }

  generateWalkingMotion(currentTime, params = {}) {
    const speed = params.speed || 1.0;
    const direction = params.direction || 0;

    const cycleTime = this.cycleTime / speed;
    const phase = (currentTime % cycleTime) / cycleTime;

    const leftLegPhase = phase;
    const rightLegPhase = (phase + 0.5) % 1.0;

    const positions = {};

    const leftLeg = this.computeLegPositions(leftLegPhase, params);
    const rightLeg = this.computeLegPositions(rightLegPhase, params);

    positions['left_hip_pitch_joint'] = leftLeg.hipPitch;
    positions['left_hip_roll_joint'] = leftLeg.hipRoll;
    positions['left_hip_yaw_joint'] = leftLeg.hipYaw;
    positions['left_knee_joint'] = leftLeg.knee;
    positions['left_ankle_pitch_joint'] = leftLeg.anklePitch;
    positions['left_ankle_roll_joint'] = leftLeg.ankleRoll;

    positions['right_hip_pitch_joint'] = rightLeg.hipPitch;
    positions['right_hip_roll_joint'] = rightLeg.hipRoll;
    positions['right_hip_yaw_joint'] = rightLeg.hipYaw;
    positions['right_knee_joint'] = rightLeg.knee;
    positions['right_ankle_pitch_joint'] = rightLeg.anklePitch;
    positions['right_ankle_roll_joint'] = rightLeg.ankleRoll;

    const armPhase = phase * 2.0 * Math.PI;
    positions['left_shoulder_pitch_joint'] = Math.sin(armPhase) * 0.3;
    positions['left_shoulder_roll_joint'] = 0.2;
    positions['left_shoulder_yaw_joint'] = 0;
    positions['left_elbow_pitch_joint'] = -0.5 + Math.sin(armPhase) * 0.2;

    positions['right_shoulder_pitch_joint'] = -Math.sin(armPhase) * 0.3;
    positions['right_shoulder_roll_joint'] = -0.2;
    positions['right_shoulder_yaw_joint'] = 0;
    positions['right_elbow_pitch_joint'] = -0.5 - Math.sin(armPhase) * 0.2;

    positions['torso_joint'] = 0;

    return positions;
  }

  computeLegPositions(phase, params = {}) {
    const stepLength = params.stepLength || this.stepLength;
    const stepHeight = params.stepHeight || this.stepHeight;

    let hipPitch, knee, anklePitch;

    if (phase < 0.5) {
      const swingPhase = phase * 2.0;
      const heightCurve = Math.sin(swingPhase * Math.PI);
      const forwardPosition = (swingPhase - 0.5) * stepLength;

      const legLength = 0.8;
      const footHeight = stepHeight * heightCurve;
      const horizontalDist = Math.abs(forwardPosition);

      const totalDist = Math.sqrt(horizontalDist * horizontalDist + footHeight * footHeight);
      const legBend = Math.max(0, legLength - totalDist);

      hipPitch = Math.atan2(footHeight, horizontalDist) - Math.asin(forwardPosition / legLength);
      knee = legBend * 2.5;
      anklePitch = -hipPitch - knee * 0.5;
    } else {
      const stancePhase = (phase - 0.5) * 2.0;
      const forwardPosition = (0.5 - stancePhase) * stepLength;

      hipPitch = -forwardPosition * 0.8;
      knee = 0.1;
      anklePitch = -hipPitch * 0.5;
    }

    return {
      hipPitch: hipPitch,
      hipRoll: 0,
      hipYaw: 0,
      knee: knee,
      anklePitch: anklePitch,
      ankleRoll: 0
    };
  }

  generateSidestepMotion(currentTime, params = {}) {
    const speed = params.speed || 1.0;
    const direction = params.direction === 'left' ? -1 : 1;

    const cycleTime = this.cycleTime / speed;
    const phase = (currentTime % cycleTime) / cycleTime;

    const leftLegPhase = phase;
    const rightLegPhase = (phase + 0.5) % 1.0;

    const positions = {};

    const leftLeg = this.computeSidestepLeg(leftLegPhase, direction, params);
    const rightLeg = this.computeSidestepLeg(rightLegPhase, direction, params);

    positions['left_hip_pitch_joint'] = leftLeg.hipPitch;
    positions['left_hip_roll_joint'] = leftLeg.hipRoll;
    positions['left_hip_yaw_joint'] = leftLeg.hipYaw;
    positions['left_knee_joint'] = leftLeg.knee;
    positions['left_ankle_pitch_joint'] = leftLeg.anklePitch;
    positions['left_ankle_roll_joint'] = leftLeg.ankleRoll;

    positions['right_hip_pitch_joint'] = rightLeg.hipPitch;
    positions['right_hip_roll_joint'] = rightLeg.hipRoll;
    positions['right_hip_yaw_joint'] = rightLeg.hipYaw;
    positions['right_knee_joint'] = rightLeg.knee;
    positions['right_ankle_pitch_joint'] = rightLeg.anklePitch;
    positions['right_ankle_roll_joint'] = rightLeg.ankleRoll;

    positions['left_shoulder_pitch_joint'] = 0;
    positions['left_shoulder_roll_joint'] = 0.2;
    positions['left_shoulder_yaw_joint'] = 0;
    positions['left_elbow_pitch_joint'] = -0.5;

    positions['right_shoulder_pitch_joint'] = 0;
    positions['right_shoulder_roll_joint'] = -0.2;
    positions['right_shoulder_yaw_joint'] = 0;
    positions['right_elbow_pitch_joint'] = -0.5;

    positions['torso_joint'] = 0;

    return positions;
  }

  computeSidestepLeg(phase, direction, params = {}) {
    const stepWidth = params.stepWidth || 0.1;
    const stepHeight = params.stepHeight || this.stepHeight;

    let hipRoll, knee, ankleRoll;

    if (phase < 0.5) {
      const swingPhase = phase * 2.0;
      const heightCurve = Math.sin(swingPhase * Math.PI);
      const sidePosition = (swingPhase - 0.5) * stepWidth * direction;

      hipRoll = sidePosition * 0.5;
      knee = heightCurve * 0.3;
      ankleRoll = -hipRoll * 0.5;
    } else {
      const stancePhase = (phase - 0.5) * 2.0;
      const sidePosition = (0.5 - stancePhase) * stepWidth * direction;

      hipRoll = sidePosition * 0.3;
      knee = 0.05;
      ankleRoll = -hipRoll * 0.3;
    }

    return {
      hipPitch: 0,
      hipRoll: hipRoll,
      hipYaw: 0,
      knee: knee,
      anklePitch: 0,
      ankleRoll: ankleRoll
    };
  }

  generateTurnMotion(currentTime, params = {}) {
    const speed = params.speed || 1.0;
    const direction = params.direction === 'left' ? -1 : 1;

    const cycleTime = this.cycleTime / speed;
    const phase = (currentTime % cycleTime) / cycleTime;

    const leftLegPhase = phase;
    const rightLegPhase = (phase + 0.5) % 1.0;

    const positions = {};

    const turnAmount = 0.2 * direction;

    const leftLeg = this.computeTurnLeg(leftLegPhase, turnAmount, params);
    const rightLeg = this.computeTurnLeg(rightLegPhase, -turnAmount, params);

    positions['left_hip_pitch_joint'] = leftLeg.hipPitch;
    positions['left_hip_roll_joint'] = leftLeg.hipRoll;
    positions['left_hip_yaw_joint'] = leftLeg.hipYaw;
    positions['left_knee_joint'] = leftLeg.knee;
    positions['left_ankle_pitch_joint'] = leftLeg.anklePitch;
    positions['left_ankle_roll_joint'] = leftLeg.ankleRoll;

    positions['right_hip_pitch_joint'] = rightLeg.hipPitch;
    positions['right_hip_roll_joint'] = rightLeg.hipRoll;
    positions['right_hip_yaw_joint'] = rightLeg.hipYaw;
    positions['right_knee_joint'] = rightLeg.knee;
    positions['right_ankle_pitch_joint'] = rightLeg.anklePitch;
    positions['right_ankle_roll_joint'] = rightLeg.ankleRoll;

    positions['left_shoulder_pitch_joint'] = 0;
    positions['left_shoulder_roll_joint'] = 0.2;
    positions['left_shoulder_yaw_joint'] = turnAmount * 0.5;
    positions['left_elbow_pitch_joint'] = -0.5;

    positions['right_shoulder_pitch_joint'] = 0;
    positions['right_shoulder_roll_joint'] = -0.2;
    positions['right_shoulder_yaw_joint'] = -turnAmount * 0.5;
    positions['right_elbow_pitch_joint'] = -0.5;

    positions['torso_joint'] = turnAmount * 0.3;

    return positions;
  }

  computeTurnLeg(phase, turnAmount, params = {}) {
    const stepHeight = params.stepHeight || this.stepHeight;

    let hipPitch, hipYaw, knee, anklePitch;

    if (phase < 0.5) {
      const swingPhase = phase * 2.0;
      const heightCurve = Math.sin(swingPhase * Math.PI);

      hipPitch = 0;
      hipYaw = turnAmount * swingPhase;
      knee = heightCurve * 0.3;
      anklePitch = 0;
    } else {
      const stancePhase = (phase - 0.5) * 2.0;

      hipPitch = 0;
      hipYaw = turnAmount * (1.0 - stancePhase);
      knee = 0.05;
      anklePitch = 0;
    }

    return {
      hipPitch: hipPitch,
      hipRoll: 0,
      hipYaw: hipYaw,
      knee: knee,
      anklePitch: anklePitch,
      ankleRoll: 0
    };
  }
}

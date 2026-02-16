import { MotionCommand } from '../models/MotionCommand.js';

export class PathCompiler {
  constructor(calibrator) {
    this.calibrator = calibrator;
  }

  compile(waypoints, startPosition = { x: 0, y: 0 }, startYaw = 0) {
    if (waypoints.length < 2) return { commands: [], segments: [] };

    const commands = [];
    const segments = [];
    let currentX = startPosition.x;
    let currentY = startPosition.y;
    let currentYaw = startYaw;

    const turnLeftCal = this.calibrator.getCalibration('turn_left');
    const turnRightCal = this.calibrator.getCalibration('turn_right');
    const walkForwardCal = this.calibrator.getCalibration('walk_forward');

    if (!turnLeftCal || !turnRightCal || !walkForwardCal) {
      return { commands: [], segments: [], error: 'Missing motion calibrations' };
    }

    const turnLeftYaw = Math.abs(turnLeftCal.yawChange);
    const turnRightYaw = Math.abs(turnRightCal.yawChange);
    const walkDistance = walkForwardCal.forwardDistance;

    if (turnLeftYaw < 0.001 || turnRightYaw < 0.001 || walkDistance < 0.001) {
      return { commands: [], segments: [], error: 'Calibration values too small' };
    }

    for (let i = 1; i < waypoints.length; i++) {
      const target = waypoints[i];
      const dx = target.x - currentX;
      const dy = target.z !== undefined ? target.z - currentY : target.y - currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const targetYaw = Math.atan2(dy, dx);

      let yawDiff = targetYaw - currentYaw;
      while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
      while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;

      const segment = {
        from: { x: currentX, y: currentY },
        to: { x: target.x, y: target.z !== undefined ? target.z : target.y },
        distance,
        yawDiff,
        turnCommands: [],
        walkCommands: []
      };

      if (Math.abs(yawDiff) > 0.05) {
        if (yawDiff > 0) {
          const repeats = Math.max(1, Math.round(Math.abs(yawDiff) / turnLeftYaw));
          const cmd = new MotionCommand({
            motionId: 'turn_left',
            repeatCount: repeats
          });
          commands.push(cmd);
          segment.turnCommands.push({ motionId: 'turn_left', repeats });
          currentYaw += turnLeftYaw * repeats;
        } else {
          const repeats = Math.max(1, Math.round(Math.abs(yawDiff) / turnRightYaw));
          const cmd = new MotionCommand({
            motionId: 'turn_right',
            repeatCount: repeats
          });
          commands.push(cmd);
          segment.turnCommands.push({ motionId: 'turn_right', repeats });
          currentYaw -= turnRightYaw * repeats;
        }
      }

      if (distance > 0.05) {
        const repeats = Math.max(1, Math.round(distance / walkDistance));
        const cmd = new MotionCommand({
          motionId: 'walk_forward',
          repeatCount: repeats
        });
        commands.push(cmd);
        segment.walkCommands.push({ motionId: 'walk_forward', repeats });

        currentX += Math.cos(currentYaw) * walkDistance * repeats;
        currentY += Math.sin(currentYaw) * walkDistance * repeats;
      }

      segments.push(segment);
    }

    const flatCommands = this._flattenRepeats(commands);

    return {
      commands: flatCommands,
      segments,
      estimatedDuration: this._estimateDuration(flatCommands)
    };
  }

  _flattenRepeats(commands) {
    const flat = [];
    for (const cmd of commands) {
      for (let r = 0; r < cmd.repeatCount; r++) {
        flat.push(new MotionCommand({
          motionId: cmd.motionId,
          repeatCount: 1
        }));
      }
    }
    return flat;
  }

  _estimateDuration(commands) {
    let total = 0;
    for (const cmd of commands) {
      const cal = this.calibrator.getCalibration(cmd.motionId);
      if (cal) {
        total += cal.duration * cmd.repeatCount;
      }
    }
    return total;
  }

  getSummary(compileResult) {
    if (!compileResult || !compileResult.segments) return '';

    const lines = [];
    compileResult.segments.forEach((seg, i) => {
      const parts = [];
      seg.turnCommands.forEach(tc => {
        const dir = tc.motionId === 'turn_left' ? 'Left' : 'Right';
        parts.push(`Turn ${dir} x${tc.repeats}`);
      });
      seg.walkCommands.forEach(wc => {
        parts.push(`Walk Forward x${wc.repeats}`);
      });
      lines.push(`Seg ${i + 1}: ${parts.join(', ')} (${seg.distance.toFixed(2)}m)`);
    });

    lines.push(`Total: ${compileResult.commands.length} commands, ~${compileResult.estimatedDuration.toFixed(1)}s`);
    return lines.join('\n');
  }
}

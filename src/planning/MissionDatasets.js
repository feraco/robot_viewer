const CALIBRATION = {
  walk_forward: {
    forwardDistance: 1.359,
    yawChange: -0.031,
    duration: 2.0,
    local: { forward: 1.355, sideways: -0.072 }
  },
  turn_left: {
    yawChange: 1.234,
    duration: 3.0,
    local: { forward: 0.665, sideways: 1.028 }
  },
  turn_right: {
    yawChange: 1.353,
    duration: 2.0,
    local: { forward: 0.267, sideways: -0.882 }
  }
};

const MISSION_DEFINITIONS = [
  {
    name: 'Straight Line 5m',
    description: 'Walk 5 meters in a straight line',
    targets2d: [{ x: 5, y: 0 }]
  },
  {
    name: 'L-Shape 3x3',
    description: 'Walk 3m forward then turn left and walk 3m',
    targets2d: [{ x: 3, y: 0 }, { x: 3, y: 3 }]
  },
  {
    name: 'U-Turn',
    description: 'Walk 3m forward, turn around, walk back',
    targets2d: [{ x: 3, y: 0 }, { x: 0, y: 0.5 }]
  },
  {
    name: 'Square 2m',
    description: 'Walk a 2m x 2m square returning to start',
    targets2d: [{ x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 0, y: 0.1 }]
  },
  {
    name: 'Triangle 3m',
    description: 'Walk an equilateral triangle with 3m sides',
    targets2d: [{ x: 3, y: 0 }, { x: 1.5, y: 2.598 }, { x: 0, y: 0.1 }]
  },
  {
    name: 'Zigzag',
    description: 'Walk a zigzag pattern alternating left and right',
    targets2d: [
      { x: 2, y: 1.5 },
      { x: 4, y: -1.5 },
      { x: 6, y: 1.5 },
      { x: 8, y: -1.5 },
      { x: 10, y: 0 }
    ]
  }
];

function normalizeAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function compilePath(targets2d, cal) {
  const walkDist = cal.walk_forward.forwardDistance;
  const walkDur = cal.walk_forward.duration;
  const turnLeftYaw = Math.abs(cal.turn_left.yawChange);
  const turnRightYaw = Math.abs(cal.turn_right.yawChange);
  const turnLeftLocal = cal.turn_left.local;
  const turnRightLocal = cal.turn_right.local;

  const commands = [];
  let cx = 0, cy = 0, cYaw = 0;
  let cmdId = 1;

  const allWaypoints = [{ x: 0, y: 0 }, ...targets2d];

  for (let i = 1; i < allWaypoints.length; i++) {
    const tx = allWaypoints[i].x;
    const ty = allWaypoints[i].y;

    const targetYaw = Math.atan2(ty - cy, tx - cx);
    let yawDiff = normalizeAngle(targetYaw - cYaw);

    if (Math.abs(yawDiff) > 0.05) {
      if (yawDiff > 0) {
        const repeats = Math.max(1, Math.round(Math.abs(yawDiff) / turnLeftYaw));
        for (let r = 0; r < repeats; r++) {
          commands.push({
            id: `seed_${cmdId++}`,
            motionId: 'turn_left',
            duration: null,
            repeatCount: 1,
            transitionDelay: 0
          });
          const cosY = Math.cos(cYaw);
          const sinY = Math.sin(cYaw);
          cx += turnLeftLocal.forward * cosY - turnLeftLocal.sideways * sinY;
          cy += turnLeftLocal.forward * sinY + turnLeftLocal.sideways * cosY;
          cYaw += turnLeftYaw;
        }
      } else {
        const repeats = Math.max(1, Math.round(Math.abs(yawDiff) / turnRightYaw));
        for (let r = 0; r < repeats; r++) {
          commands.push({
            id: `seed_${cmdId++}`,
            motionId: 'turn_right',
            duration: null,
            repeatCount: 1,
            transitionDelay: 0
          });
          const cosY = Math.cos(cYaw);
          const sinY = Math.sin(cYaw);
          cx += turnRightLocal.forward * cosY - turnRightLocal.sideways * sinY;
          cy += turnRightLocal.forward * sinY + turnRightLocal.sideways * cosY;
          cYaw -= turnRightYaw;
        }
      }
    }

    const dx = tx - cx;
    const dy = ty - cy;
    const remaining = Math.sqrt(dx * dx + dy * dy);

    if (remaining > 0.05) {
      const exactRepeats = remaining / walkDist;
      const fullRepeats = Math.floor(exactRepeats);
      const fractional = exactRepeats - fullRepeats;

      for (let r = 0; r < fullRepeats; r++) {
        commands.push({
          id: `seed_${cmdId++}`,
          motionId: 'walk_forward',
          duration: null,
          repeatCount: 1,
          transitionDelay: 0
        });
      }

      if (fractional > 0.1 && walkDur > 0) {
        commands.push({
          id: `seed_${cmdId++}`,
          motionId: 'walk_forward',
          duration: fractional * walkDur,
          repeatCount: 1,
          transitionDelay: 0
        });
      }

      cx += Math.cos(cYaw) * remaining;
      cy += Math.sin(cYaw) * remaining;
    }
  }

  let totalDuration = 0;
  for (const cmd of commands) {
    if (cmd.motionId === 'walk_forward') {
      totalDuration += cmd.duration !== null ? cmd.duration : cal.walk_forward.duration;
    } else if (cmd.motionId === 'turn_left') {
      totalDuration += cal.turn_left.duration;
    } else if (cmd.motionId === 'turn_right') {
      totalDuration += cal.turn_right.duration;
    }
  }

  return { commands, estimatedDuration: totalDuration };
}

export function getDefaultMissions() {
  return MISSION_DEFINITIONS.map(def => {
    const { commands, estimatedDuration } = compilePath(def.targets2d, CALIBRATION);

    const waypoints3d = def.targets2d.map(t => ({
      x: t.x,
      y: 0,
      z: t.y
    }));

    return {
      name: def.name,
      description: def.description,
      waypoints: waypoints3d,
      compiled_commands: commands,
      estimated_duration: estimatedDuration,
      is_template: true
    };
  });
}

export function getCalibrationValues() {
  return CALIBRATION;
}

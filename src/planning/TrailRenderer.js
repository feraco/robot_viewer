import * as THREE from 'three';

export class TrailRenderer {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.trailPoints = [];
    this.trailLine = null;
    this.trailGroup = new THREE.Group();
    this.trailGroup.name = 'trailGroup';
    this.sceneManager.scene.add(this.trailGroup);
    this.isRecording = false;
    this.sampleInterval = 100;
    this._lastSampleTime = 0;
  }

  startRecording() {
    this.clearTrail();
    this.isRecording = true;
    this._lastSampleTime = 0;
    this._startTime = performance.now();
  }

  stopRecording() {
    this.isRecording = false;
  }

  samplePosition(robotModel) {
    if (!this.isRecording || !robotModel || !robotModel.threeObject) return;

    const now = performance.now();
    if (now - this._lastSampleTime < this.sampleInterval) return;
    this._lastSampleTime = now;

    const pos = robotModel.threeObject.position;
    const t = (now - this._startTime) / 1000;

    this.trailPoints.push({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      t
    });

    this._updateTrailLine();
    this.sceneManager.redraw();
  }

  _updateTrailLine() {
    if (this.trailLine) {
      this.trailGroup.remove(this.trailLine);
      this.trailLine.geometry.dispose();
      this.trailLine.material.dispose();
      this.trailLine = null;
    }

    if (this.trailPoints.length < 2) return;

    const points = this.trailPoints.map(p => new THREE.Vector3(p.x, p.y + 0.02, p.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xff9800,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    this.trailLine = new THREE.Line(geometry, material);
    this.trailGroup.add(this.trailLine);
  }

  clearTrail() {
    this.trailPoints = [];

    if (this.trailLine) {
      this.trailGroup.remove(this.trailLine);
      this.trailLine.geometry.dispose();
      this.trailLine.material.dispose();
      this.trailLine = null;
    }

    this.sceneManager.redraw();
  }

  getTrailData() {
    return this.trailPoints.map(p => ({ x: p.x, y: p.y, z: p.z, t: p.t }));
  }

  computeWaypointErrors(waypoints) {
    if (this.trailPoints.length === 0 || waypoints.length === 0) return [];

    return waypoints.map(wp => {
      let minDist = Infinity;
      const wpX = wp.x;
      const wpZ = wp.z !== undefined ? wp.z : wp.y;

      for (const tp of this.trailPoints) {
        const dx = tp.x - wpX;
        const dz = tp.z - wpZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) minDist = dist;
      }

      return {
        waypoint: wp,
        error: minDist
      };
    });
  }

  dispose() {
    this.clearTrail();
    this.sceneManager.scene.remove(this.trailGroup);
  }
}

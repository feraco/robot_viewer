import * as THREE from 'three';

export class WaypointManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.waypoints = [];
    this.waypointMeshes = [];
    this.pathLine = null;
    this.labelSprites = [];
    this.isPlanning = false;
    this.waypointGroup = new THREE.Group();
    this.waypointGroup.name = 'waypointGroup';
    this.sceneManager.scene.add(this.waypointGroup);

    this._onClickBound = this._onClick.bind(this);
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();

    this.onWaypointsChanged = null;
  }

  startPlanning() {
    this.isPlanning = true;
    this.sceneManager.canvas.addEventListener('mouseup', this._onClickBound);
    this.sceneManager.canvas.style.cursor = 'crosshair';
  }

  stopPlanning() {
    this.isPlanning = false;
    this.sceneManager.canvas.removeEventListener('mouseup', this._onClickBound);
    this.sceneManager.canvas.style.cursor = '';
  }

  _onClick(event) {
    if (!this.isPlanning) return;
    if (event.button !== 0) return;
    event.stopPropagation();

    const canvas = this.sceneManager.canvas;
    const rect = canvas.getBoundingClientRect();
    this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this.sceneManager.camera);

    const groundY = this.sceneManager.groundPlane
      ? this.sceneManager.groundPlane.position.y
      : 0;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
    const intersection = new THREE.Vector3();
    const hit = this._raycaster.ray.intersectPlane(plane, intersection);

    if (!hit) return;

    const existingIdx = this._findClickedWaypoint(event);
    if (existingIdx >= 0) {
      this.removeWaypoint(existingIdx);
      return;
    }

    this.addWaypoint(intersection.x, intersection.y, intersection.z);
  }

  _findClickedWaypoint(event) {
    if (this.waypointMeshes.length === 0) return -1;

    this._raycaster.setFromCamera(this._mouse, this.sceneManager.camera);
    const intersects = this._raycaster.intersectObjects(this.waypointMeshes, false);

    if (intersects.length > 0) {
      return this.waypointMeshes.indexOf(intersects[0].object);
    }
    return -1;
  }

  addWaypoint(x, y, z) {
    const wp = { x, y, z, index: this.waypoints.length };
    this.waypoints.push(wp);

    const geometry = new THREE.SphereGeometry(0.08, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x2196f3,
      emissive: 0x0d47a1,
      emissiveIntensity: 0.3,
      shininess: 80
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.waypointGroup.add(mesh);
    this.waypointMeshes.push(mesh);

    const label = this._createLabel(this.waypoints.length.toString(), x, y + 0.2, z);
    this.waypointGroup.add(label);
    this.labelSprites.push(label);

    this._updatePathLine();
    this.sceneManager.redraw();

    if (this.onWaypointsChanged) {
      this.onWaypointsChanged(this.waypoints);
    }
  }

  removeWaypoint(index) {
    if (index < 0 || index >= this.waypoints.length) return;

    this.waypoints.splice(index, 1);

    const mesh = this.waypointMeshes.splice(index, 1)[0];
    this.waypointGroup.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();

    const label = this.labelSprites.splice(index, 1)[0];
    this.waypointGroup.remove(label);
    if (label.material.map) label.material.map.dispose();
    label.material.dispose();

    this.waypoints.forEach((wp, i) => {
      wp.index = i;
    });
    this._rebuildLabels();
    this._updatePathLine();
    this.sceneManager.redraw();

    if (this.onWaypointsChanged) {
      this.onWaypointsChanged(this.waypoints);
    }
  }

  _rebuildLabels() {
    this.labelSprites.forEach(label => {
      this.waypointGroup.remove(label);
      if (label.material.map) label.material.map.dispose();
      label.material.dispose();
    });
    this.labelSprites = [];

    this.waypoints.forEach((wp, i) => {
      const label = this._createLabel((i + 1).toString(), wp.x, wp.y + 0.2, wp.z);
      this.waypointGroup.add(label);
      this.labelSprites.push(label);
    });
  }

  _createLabel(text, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(0.2, 0.2, 1);
    return sprite;
  }

  _updatePathLine() {
    if (this.pathLine) {
      this.waypointGroup.remove(this.pathLine);
      this.pathLine.geometry.dispose();
      this.pathLine.material.dispose();
      this.pathLine = null;
    }

    if (this.waypoints.length < 2) return;

    const points = this.waypoints.map(wp => new THREE.Vector3(wp.x, wp.y + 0.01, wp.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x2196f3,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    this.pathLine = new THREE.Line(geometry, material);
    this.waypointGroup.add(this.pathLine);
  }

  clearWaypoints() {
    this.waypointMeshes.forEach(mesh => {
      this.waypointGroup.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.waypointMeshes = [];

    this.labelSprites.forEach(label => {
      this.waypointGroup.remove(label);
      if (label.material.map) label.material.map.dispose();
      label.material.dispose();
    });
    this.labelSprites = [];

    if (this.pathLine) {
      this.waypointGroup.remove(this.pathLine);
      this.pathLine.geometry.dispose();
      this.pathLine.material.dispose();
      this.pathLine = null;
    }

    this.waypoints = [];
    this.sceneManager.redraw();

    if (this.onWaypointsChanged) {
      this.onWaypointsChanged(this.waypoints);
    }
  }

  getWaypoints() {
    return this.waypoints.map(wp => ({ x: wp.x, y: wp.y, z: wp.z }));
  }

  setWaypoints(waypointArray) {
    this.clearWaypoints();
    waypointArray.forEach(wp => {
      this.addWaypoint(wp.x, wp.y, wp.z);
    });
  }

  getTotalPathDistance() {
    let total = 0;
    for (let i = 1; i < this.waypoints.length; i++) {
      const a = this.waypoints[i - 1];
      const b = this.waypoints[i];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      total += Math.sqrt(dx * dx + dz * dz);
    }
    return total;
  }

  dispose() {
    this.stopPlanning();
    this.clearWaypoints();
    this.sceneManager.scene.remove(this.waypointGroup);
  }
}

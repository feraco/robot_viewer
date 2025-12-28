import * as d3 from 'd3';

export class JointGraphUI {
    constructor(csvMotionController) {
        this.csvMotionController = csvMotionController;
        this.container = null;
        this.svg = null;
        this.graphData = new Map();
        this.maxDataPoints = 300;
        this.selectedJoints = new Set();
        this.allJoints = [];
        this.isRecording = true;
        this.colors = d3.schemeCategory10;
        this.timeWindow = 10;
        this.startTime = null;

        this.margin = { top: 20, right: 120, bottom: 40, left: 60 };
        this.width = 0;
        this.height = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.csvMotionController) return;

        this.csvMotionController.on('onMotionLoad', (motionData) => {
            this.handleMotionLoad(motionData);
        });

        this.csvMotionController.on('onFrameChange', (frameIndex) => {
            this.handleFrameChange(frameIndex);
        });

        this.csvMotionController.on('onPlayStateChange', (isPlaying) => {
            if (!isPlaying) {
                this.startTime = null;
            }
        });
    }

    handleMotionLoad(motionData) {
        this.clearData();
        this.startTime = null;

        if (motionData && motionData.frames && motionData.frames.length > 0) {
            const firstFrame = motionData.frames[0];
            this.allJoints = Object.keys(firstFrame.joints);

            if (this.selectedJoints.size === 0 && this.allJoints.length > 0) {
                this.allJoints.slice(0, Math.min(5, this.allJoints.length)).forEach(joint => {
                    this.selectedJoints.add(joint);
                });
            }

            this.updateJointSelector();
        }
    }

    handleFrameChange(frameIndex) {
        if (!this.isRecording || !this.csvMotionController.motionData) return;

        const frame = this.csvMotionController.motionData.frames[Math.floor(frameIndex)];
        if (!frame) return;

        if (this.startTime === null) {
            this.startTime = performance.now();
        }

        const currentTime = (performance.now() - this.startTime) / 1000;

        for (const [jointName, angle] of Object.entries(frame.joints)) {
            if (!this.graphData.has(jointName)) {
                this.graphData.set(jointName, []);
            }

            const data = this.graphData.get(jointName);
            data.push({ time: currentTime, angle: angle });

            if (data.length > this.maxDataPoints) {
                data.shift();
            }
        }

        this.updateGraph();
    }

    initialize() {
        this.container = document.getElementById('joint-graph-container');
        if (!this.container) return;

        this.setupUI();
        this.initializeGraph();
    }

    setupUI() {
        const controlsHtml = `
            <div class="graph-controls">
                <div class="control-group">
                    <button id="graph-record-toggle" class="graph-btn active" title="Pause/Resume recording">
                        <span class="record-icon">⏸</span>
                    </button>
                    <button id="graph-clear" class="graph-btn" title="Clear graph data">
                        <span>🗑</span>
                    </button>
                </div>
                <div class="joint-selector-container">
                    <input type="text" id="joint-search" placeholder="Search joints..." class="joint-search">
                    <div id="joint-list" class="joint-list"></div>
                </div>
            </div>
            <div class="graph-canvas-container">
                <svg id="joint-graph-svg"></svg>
            </div>
        `;

        this.container.innerHTML = controlsHtml;

        const recordBtn = document.getElementById('graph-record-toggle');
        recordBtn?.addEventListener('click', () => this.toggleRecording());

        const clearBtn = document.getElementById('graph-clear');
        clearBtn?.addEventListener('click', () => this.clearData());

        const searchInput = document.getElementById('joint-search');
        searchInput?.addEventListener('input', (e) => this.filterJoints(e.target.value));
    }

    toggleRecording() {
        this.isRecording = !this.isRecording;
        const btn = document.getElementById('graph-record-toggle');
        const icon = btn?.querySelector('.record-icon');

        if (this.isRecording) {
            btn?.classList.add('active');
            if (icon) icon.textContent = '⏸';
            this.startTime = null;
        } else {
            btn?.classList.remove('active');
            if (icon) icon.textContent = '▶';
        }
    }

    clearData() {
        this.graphData.clear();
        this.startTime = null;
        this.updateGraph();
    }

    updateJointSelector() {
        const jointList = document.getElementById('joint-list');
        if (!jointList) return;

        jointList.innerHTML = '';

        this.allJoints.forEach((joint, index) => {
            const item = document.createElement('div');
            item.className = 'joint-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `joint-${index}`;
            checkbox.checked = this.selectedJoints.has(joint);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedJoints.add(joint);
                } else {
                    this.selectedJoints.delete(joint);
                }
                this.updateGraph();
            });

            const colorBox = document.createElement('span');
            colorBox.className = 'joint-color-box';
            colorBox.style.backgroundColor = this.getJointColor(joint);

            const label = document.createElement('label');
            label.htmlFor = `joint-${index}`;
            label.textContent = joint;

            item.appendChild(checkbox);
            item.appendChild(colorBox);
            item.appendChild(label);
            jointList.appendChild(item);
        });
    }

    filterJoints(searchTerm) {
        const items = document.querySelectorAll('.joint-item');
        const term = searchTerm.toLowerCase();

        items.forEach(item => {
            const label = item.querySelector('label');
            if (label && label.textContent.toLowerCase().includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    initializeGraph() {
        const svg = d3.select('#joint-graph-svg');
        this.svg = svg;

        const container = this.container.querySelector('.graph-canvas-container');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        this.width = rect.width - this.margin.left - this.margin.right;
        this.height = rect.height - this.margin.top - this.margin.bottom;

        svg.attr('width', rect.width)
           .attr('height', rect.height);

        svg.selectAll('*').remove();

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`);

        g.append('g')
            .attr('class', 'y-axis');

        g.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', this.width / 2)
            .attr('y', this.height + 35)
            .text('Time (s)');

        g.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.height / 2)
            .attr('y', -45)
            .text('Angle (rad)');

        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const container = this.container?.querySelector('.graph-canvas-container');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        this.width = rect.width - this.margin.left - this.margin.right;
        this.height = rect.height - this.margin.top - this.margin.bottom;

        this.svg?.attr('width', rect.width)
                 .attr('height', rect.height);

        this.svg?.select('g')
                 .select('.x-axis')
                 .attr('transform', `translate(0,${this.height})`);

        this.updateGraph();
    }

    updateGraph() {
        if (!this.svg || this.width <= 0 || this.height <= 0) return;

        const g = this.svg.select('g');

        const selectedData = Array.from(this.selectedJoints)
            .filter(joint => this.graphData.has(joint))
            .map(joint => ({
                joint: joint,
                data: this.graphData.get(joint)
            }))
            .filter(d => d.data.length > 0);

        if (selectedData.length === 0) {
            g.selectAll('.line-path').remove();
            return;
        }

        const allTimes = selectedData.flatMap(d => d.data.map(p => p.time));
        const allAngles = selectedData.flatMap(d => d.data.map(p => p.angle));

        const xScale = d3.scaleLinear()
            .domain([Math.min(...allTimes), Math.max(...allTimes)])
            .range([0, this.width]);

        const yScale = d3.scaleLinear()
            .domain([Math.min(...allAngles), Math.max(...allAngles)])
            .nice()
            .range([this.height, 0]);

        const xAxis = d3.axisBottom(xScale).ticks(8);
        const yAxis = d3.axisLeft(yScale).ticks(8);

        g.select('.x-axis')
            .transition()
            .duration(100)
            .call(xAxis);

        g.select('.y-axis')
            .transition()
            .duration(100)
            .call(yAxis);

        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.angle))
            .curve(d3.curveMonotoneX);

        const lines = g.selectAll('.line-path')
            .data(selectedData, d => d.joint);

        lines.exit().remove();

        lines.enter()
            .append('path')
            .attr('class', 'line-path')
            .attr('fill', 'none')
            .attr('stroke', d => this.getJointColor(d.joint))
            .attr('stroke-width', 2)
            .merge(lines)
            .attr('d', d => line(d.data));
    }

    getJointColor(jointName) {
        const index = this.allJoints.indexOf(jointName);
        return this.colors[index % this.colors.length];
    }

    show() {
        const panel = document.getElementById('floating-joint-graph-panel');
        if (panel) {
            panel.style.display = 'flex';
            this.handleResize();
        }
    }

    hide() {
        const panel = document.getElementById('floating-joint-graph-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
}

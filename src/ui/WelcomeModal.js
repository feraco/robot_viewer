export class WelcomeModal {
  constructor(sampleLoader, fileHandler) {
    this.sampleLoader = sampleLoader;
    this.fileHandler = fileHandler;
    this.modal = null;
    this.hasShown = localStorage.getItem('welcomeModalShown') === 'true';
  }

  show() {
    if (this.hasShown) return;

    this.modal = document.createElement('div');
    this.modal.id = 'welcome-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      padding: 40px;
      max-width: 700px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      transform: scale(0.9);
      transition: transform 0.3s var(--spring);
    `;

    content.innerHTML = `
      <h2 style="
        margin: 0 0 12px 0;
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary);
        text-align: center;
      ">Welcome to Robot Viewer</h2>

      <p style="
        margin: 0 0 32px 0;
        font-size: 16px;
        color: var(--text-secondary);
        text-align: center;
        line-height: 1.5;
      ">Get started by loading a sample robot model or uploading your own URDF, MJCF, or USD file.</p>

      <div id="sample-models-grid" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      "></div>

      <div style="
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      ">
        <button id="welcome-upload-btn" style="
          flex: 1;
          padding: 16px 24px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">Upload Your Files</button>

        <button id="welcome-browse-samples" style="
          flex: 1;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">Browse All Samples</button>
      </div>

      <button id="welcome-skip-btn" style="
        width: 100%;
        padding: 12px;
        background: transparent;
        color: var(--text-tertiary);
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      ">Skip - Start with empty scene</button>
    `;

    this.modal.appendChild(content);
    document.body.appendChild(this.modal);

    setTimeout(() => {
      this.modal.style.opacity = '1';
      content.style.transform = 'scale(1)';
    }, 10);

    this.populateSampleModels(content);
    this.setupEventListeners(content);
  }

  populateSampleModels(content) {
    const grid = content.querySelector('#sample-models-grid');
    const featuredSamples = [
      { name: 'G1 Robot (23 DOF)', path: 'g1/scene_23dof.xml' },
      { name: 'G1 Robot (29 DOF)', path: 'g1/scene_29dof.xml' }
    ];

    featuredSamples.forEach(sample => {
      const card = document.createElement('button');
      card.style.cssText = `
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      `;

      card.innerHTML = `
        <div style="color: var(--text-primary); font-size: 14px; font-weight: 600;">${sample.name}</div>
      `;

      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.background = 'rgba(255, 255, 255, 0.1)';
        card.style.borderColor = 'var(--accent)';
        card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.background = 'rgba(255, 255, 255, 0.05)';
        card.style.borderColor = 'var(--glass-border)';
        card.style.boxShadow = 'none';
      });

      card.addEventListener('click', async () => {
        await this.loadSample(sample.path);
        this.close();
      });

      grid.appendChild(card);
    });
  }

  setupEventListeners(content) {
    content.querySelector('#welcome-upload-btn').addEventListener('click', () => {
      this.fileHandler.triggerFileUpload();
      this.close();
    });

    content.querySelector('#welcome-browse-samples').addEventListener('click', () => {
      const samplesSelect = document.getElementById('sample-models-select');
      if (samplesSelect) {
        samplesSelect.focus();
        samplesSelect.click();
      }
      this.close();
    });

    content.querySelector('#welcome-skip-btn').addEventListener('click', () => {
      this.close();
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  async loadSample(path) {
    try {
      await this.sampleLoader.loadSample(`/${path}`);
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
  }

  close() {
    if (!this.modal) return;

    localStorage.setItem('welcomeModalShown', 'true');
    this.hasShown = true;

    this.modal.style.opacity = '0';
    const content = this.modal.querySelector('div');
    if (content) {
      content.style.transform = 'scale(0.9)';
    }

    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
    }, 300);
  }

  reset() {
    localStorage.removeItem('welcomeModalShown');
    this.hasShown = false;
  }
}

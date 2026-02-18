export class WelcomeModal {
  constructor(sampleLoader, fileHandler, tourManager = null) {
    this.sampleLoader = sampleLoader;
    this.fileHandler = fileHandler;
    this.tourManager = tourManager;
    this.modal = null;
    this.hasShown = localStorage.getItem('welcomeModalShown') === 'true';
    this.shouldStartTour = false;
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
      z-index: var(--z-modal);
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
      ">A powerful tool for visualizing and animating robot models. Start with a guided tour or explore on your own.</p>

      <button id="welcome-take-tour" style="
        width: 100%;
        padding: 18px;
        background: linear-gradient(135deg, #0a84ff 0%, #409cff 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 16px;
        box-shadow: 0 4px 16px rgba(10, 132, 255, 0.3);
      ">Take a Guided Tour</button>

      <button id="welcome-skip-btn" style="
        width: 100%;
        padding: 14px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      ">Skip and Explore</button>
    `;

    this.modal.appendChild(content);
    document.body.appendChild(this.modal);

    setTimeout(() => {
      this.modal.style.opacity = '1';
      content.style.transform = 'scale(1)';
    }, 10);

    this.setupEventListeners(content);
  }

  setupEventListeners(content) {
    content.querySelector('#welcome-take-tour').addEventListener('click', () => {
      this.shouldStartTour = true;
      this.close();
    });

    const takeTourBtn = content.querySelector('#welcome-take-tour');
    takeTourBtn.addEventListener('mouseenter', (e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 6px 20px rgba(10, 132, 255, 0.4)';
    });
    takeTourBtn.addEventListener('mouseleave', (e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 4px 16px rgba(10, 132, 255, 0.3)';
    });

    const skipBtn = content.querySelector('#welcome-skip-btn');
    skipBtn.addEventListener('mouseenter', (e) => {
      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
    });
    skipBtn.addEventListener('mouseleave', (e) => {
      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
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

      if (this.shouldStartTour && this.tourManager) {
        setTimeout(() => {
          this.tourManager.start();
        }, 500);
      }
      this.shouldStartTour = false;
    }, 300);
  }

  reset() {
    localStorage.removeItem('welcomeModalShown');
    this.hasShown = false;
  }
}

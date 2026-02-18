export class GuidedTourManager {
  constructor() {
    this.currentStep = 0;
    this.tourData = [];
    this.isActive = false;
    this.spotlightElement = null;
    this.contentElement = null;
    this.backdropElement = null;
    this.onComplete = null;
    this.storageKey = 'robot-viewer-tour-completed';
  }

  initialize(tourSteps, onCompleteCallback) {
    this.tourData = tourSteps;
    this.onComplete = onCompleteCallback;
    this.createTourElements();
    this.attachEventListeners();
  }

  createTourElements() {
    this.backdropElement = document.createElement('div');
    this.backdropElement.id = 'tour-backdrop';
    this.backdropElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 9998;
      display: none;
      transition: opacity 0.3s ease;
      opacity: 0;
    `;

    this.spotlightElement = document.createElement('div');
    this.spotlightElement.id = 'tour-spotlight';
    this.spotlightElement.style.cssText = `
      position: fixed;
      border: 3px solid #60a5fa;
      border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 20px rgba(96, 165, 250, 0.5);
      pointer-events: none;
      z-index: 9999;
      display: none;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    this.contentElement = document.createElement('div');
    this.contentElement.id = 'tour-content';
    this.contentElement.style.cssText = `
      position: fixed;
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(96, 165, 250, 0.3);
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      z-index: 10000;
      display: none;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      transform: scale(0.95);
    `;

    document.body.appendChild(this.backdropElement);
    document.body.appendChild(this.spotlightElement);
    document.body.appendChild(this.contentElement);
  }

  attachEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      if (e.key === 'Escape') {
        this.skip();
      } else if (e.key === 'ArrowRight') {
        this.next();
      } else if (e.key === 'ArrowLeft') {
        this.previous();
      }
    });

    window.addEventListener('resize', () => {
      if (this.isActive) {
        this.positionElements();
      }
    });
  }

  shouldShowTour() {
    const completed = localStorage.getItem(this.storageKey);
    return !completed;
  }

  start() {
    if (this.tourData.length === 0) return;

    this.isActive = true;
    this.currentStep = 0;
    this.backdropElement.style.display = 'block';

    setTimeout(() => {
      this.backdropElement.style.opacity = '1';
      this.showStep(0);
    }, 50);
  }

  showStep(index) {
    if (index < 0 || index >= this.tourData.length) return;

    const step = this.tourData[index];
    this.currentStep = index;

    if (step.action) {
      step.action();
    }

    setTimeout(() => {
      const targetElement = document.querySelector(step.target);

      if (targetElement) {
        this.highlightElement(targetElement);
        this.showContent(step);
      } else {
        this.showContentOnly(step);
      }
    }, 100);
  }

  highlightElement(element) {
    const rect = element.getBoundingClientRect();
    const padding = 8;

    this.spotlightElement.style.display = 'block';
    this.spotlightElement.style.top = `${rect.top - padding}px`;
    this.spotlightElement.style.left = `${rect.left - padding}px`;
    this.spotlightElement.style.width = `${rect.width + padding * 2}px`;
    this.spotlightElement.style.height = `${rect.height + padding * 2}px`;
  }

  showContent(step) {
    const stepData = this.tourData[this.currentStep];
    const targetElement = document.querySelector(stepData.target);

    this.contentElement.innerHTML = `
      <div style="color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #60a5fa;">${step.title}</h3>
          <span style="font-size: 14px; color: rgba(255, 255, 255, 0.5);">${this.currentStep + 1}/${this.tourData.length}</span>
        </div>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.9);">${step.content}</p>
        <div style="display: flex; gap: 12px; align-items: center; justify-content: space-between;">
          <button id="tour-skip" style="
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.7);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          ">Skip Tour</button>
          <div style="display: flex; gap: 8px;">
            ${this.currentStep > 0 ? `
              <button id="tour-previous" style="
                background: rgba(96, 165, 250, 0.1);
                border: 1px solid rgba(96, 165, 250, 0.3);
                color: #60a5fa;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
              ">Previous</button>
            ` : ''}
            <button id="tour-next" style="
              background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
              border: none;
              color: white;
              padding: 8px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            ">${this.currentStep === this.tourData.length - 1 ? 'Finish' : 'Next'}</button>
          </div>
        </div>
      </div>
    `;

    this.positionContent(targetElement);

    this.contentElement.style.display = 'block';
    setTimeout(() => {
      this.contentElement.style.opacity = '1';
      this.contentElement.style.transform = 'scale(1)';
    }, 50);

    document.getElementById('tour-skip')?.addEventListener('click', () => this.skip());
    document.getElementById('tour-previous')?.addEventListener('click', () => this.previous());
    document.getElementById('tour-next')?.addEventListener('click', () => this.next());

    const nextButton = document.getElementById('tour-next');
    nextButton?.addEventListener('mouseenter', (e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
    });
    nextButton?.addEventListener('mouseleave', (e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
    });
  }

  showContentOnly(step) {
    this.spotlightElement.style.display = 'none';

    this.contentElement.innerHTML = `
      <div style="color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #60a5fa;">${step.title}</h3>
          <span style="font-size: 14px; color: rgba(255, 255, 255, 0.5);">${this.currentStep + 1}/${this.tourData.length}</span>
        </div>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.9);">${step.content}</p>
        <div style="display: flex; gap: 12px; align-items: center; justify-content: space-between;">
          <button id="tour-skip" style="
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.7);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Skip Tour</button>
          <button id="tour-next" style="
            background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            border: none;
            color: white;
            padding: 8px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          ">${this.currentStep === this.tourData.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    `;

    this.contentElement.style.top = '50%';
    this.contentElement.style.left = '50%';
    this.contentElement.style.transform = 'translate(-50%, -50%)';

    this.contentElement.style.display = 'block';
    setTimeout(() => {
      this.contentElement.style.opacity = '1';
    }, 50);

    document.getElementById('tour-skip')?.addEventListener('click', () => this.skip());
    document.getElementById('tour-next')?.addEventListener('click', () => this.next());
  }

  positionContent(targetElement) {
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const contentRect = this.contentElement.getBoundingClientRect();
    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top, left;
    const step = this.tourData[this.currentStep];
    const preferredPosition = step.position || 'right';

    if (preferredPosition === 'right' && rect.right + contentRect.width + padding < viewportWidth) {
      left = rect.right + padding;
      top = rect.top + (rect.height / 2) - (contentRect.height / 2);
    } else if (preferredPosition === 'left' && rect.left - contentRect.width - padding > 0) {
      left = rect.left - contentRect.width - padding;
      top = rect.top + (rect.height / 2) - (contentRect.height / 2);
    } else if (preferredPosition === 'bottom' && rect.bottom + contentRect.height + padding < viewportHeight) {
      left = rect.left + (rect.width / 2) - (contentRect.width / 2);
      top = rect.bottom + padding;
    } else if (preferredPosition === 'top' && rect.top - contentRect.height - padding > 0) {
      left = rect.left + (rect.width / 2) - (contentRect.width / 2);
      top = rect.top - contentRect.height - padding;
    } else {
      left = viewportWidth / 2 - contentRect.width / 2;
      top = viewportHeight / 2 - contentRect.height / 2;
    }

    top = Math.max(padding, Math.min(top, viewportHeight - contentRect.height - padding));
    left = Math.max(padding, Math.min(left, viewportWidth - contentRect.width - padding));

    this.contentElement.style.top = `${top}px`;
    this.contentElement.style.left = `${left}px`;
    this.contentElement.style.transform = 'none';
  }

  positionElements() {
    const step = this.tourData[this.currentStep];
    const targetElement = document.querySelector(step.target);

    if (targetElement) {
      this.highlightElement(targetElement);
      this.positionContent(targetElement);
    }
  }

  next() {
    if (this.currentStep < this.tourData.length - 1) {
      this.contentElement.style.opacity = '0';
      this.contentElement.style.transform = 'scale(0.95)';

      setTimeout(() => {
        this.showStep(this.currentStep + 1);
      }, 200);
    } else {
      this.finish();
    }
  }

  previous() {
    if (this.currentStep > 0) {
      this.contentElement.style.opacity = '0';
      this.contentElement.style.transform = 'scale(0.95)';

      setTimeout(() => {
        this.showStep(this.currentStep - 1);
      }, 200);
    }
  }

  skip() {
    this.finish(true);
  }

  finish(skipped = false) {
    this.isActive = false;

    this.contentElement.style.opacity = '0';
    this.contentElement.style.transform = 'scale(0.95)';
    this.spotlightElement.style.display = 'none';
    this.backdropElement.style.opacity = '0';

    setTimeout(() => {
      this.contentElement.style.display = 'none';
      this.backdropElement.style.display = 'none';
    }, 300);

    localStorage.setItem(this.storageKey, 'true');

    if (this.onComplete) {
      this.onComplete(skipped);
    }
  }

  reset() {
    localStorage.removeItem(this.storageKey);
  }

  replay() {
    this.currentStep = 0;
    this.start();
  }
}

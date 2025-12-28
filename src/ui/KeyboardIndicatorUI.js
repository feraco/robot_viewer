export class KeyboardIndicatorUI {
  constructor() {
    this.container = null;
    this.keyElements = new Map();
    this.speedElement = null;
  }

  createIndicator() {
    this.container = document.createElement('div');
    this.container.className = 'keyboard-indicator';
    this.container.style.cssText = `
      position: fixed;
      bottom: 140px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 999;
      pointer-events: none;
    `;

    const keyContainer = document.createElement('div');
    keyContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    `;

    const topRow = document.createElement('div');
    topRow.style.cssText = `
      display: flex;
      gap: 4px;
    `;

    const middleRow = document.createElement('div');
    middleRow.style.cssText = `
      display: flex;
      gap: 4px;
    `;

    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = `
      display: flex;
      gap: 4px;
    `;

    const upKey = this.createKeyElement('↑', 'ArrowUp');
    const downKey = this.createKeyElement('↓', 'ArrowDown');
    const leftKey = this.createKeyElement('←', 'ArrowLeft');
    const rightKey = this.createKeyElement('→', 'ArrowRight');

    topRow.appendChild(upKey);
    middleRow.appendChild(leftKey);
    middleRow.appendChild(downKey);
    middleRow.appendChild(rightKey);

    keyContainer.appendChild(topRow);
    keyContainer.appendChild(middleRow);
    keyContainer.appendChild(bottomRow);

    const speedContainer = document.createElement('div');
    speedContainer.style.cssText = `
      background: rgba(0, 0, 0, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 8px 12px;
      color: white;
      font-family: 'Segoe UI', sans-serif;
      font-size: 12px;
      text-align: center;
      backdrop-filter: blur(10px);
    `;

    this.speedElement = document.createElement('div');
    this.speedElement.textContent = 'Speed: 1.0x';
    this.speedElement.style.cssText = `
      font-weight: 600;
      color: #4CAF50;
    `;

    speedContainer.appendChild(this.speedElement);

    this.container.appendChild(keyContainer);
    this.container.appendChild(speedContainer);

    return this.container;
  }

  createKeyElement(label, key) {
    const element = document.createElement('div');
    element.className = 'key-indicator';
    element.dataset.key = key;
    element.textContent = label;
    element.style.cssText = `
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.75);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 18px;
      font-weight: bold;
      transition: all 0.15s ease;
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    this.keyElements.set(key, element);
    return element;
  }

  updateKeyStates(activeKeys) {
    this.keyElements.forEach((element, key) => {
      const isActive = activeKeys.includes(key);

      if (isActive) {
        element.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        element.style.borderColor = '#4CAF50';
        element.style.color = 'white';
        element.style.transform = 'scale(0.95)';
        element.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.6)';
      } else {
        element.style.background = 'rgba(0, 0, 0, 0.75)';
        element.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        element.style.color = 'rgba(255, 255, 255, 0.6)';
        element.style.transform = 'scale(1)';
        element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      }
    });
  }

  updateSpeed(speed) {
    if (this.speedElement) {
      this.speedElement.textContent = `Speed: ${speed.toFixed(1)}x`;
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  dispose() {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    this.container = null;
    this.keyElements.clear();
    this.speedElement = null;
  }
}

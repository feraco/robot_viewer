export class KeyboardHelpOverlay {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'keyboard-help-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    `;

    const content = document.createElement('div');
    content.className = 'help-content';
    content.style.cssText = `
      background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      color: white;
      font-family: 'Segoe UI', sans-serif;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .help-content::-webkit-scrollbar {
        width: 8px;
      }
      .help-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      .help-content::-webkit-scrollbar-thumb {
        background: rgba(76, 175, 80, 0.5);
        border-radius: 4px;
      }
      .help-content::-webkit-scrollbar-thumb:hover {
        background: rgba(76, 175, 80, 0.7);
      }
    `;
    document.head.appendChild(style);

    const title = document.createElement('h2');
    title.textContent = 'Robot Viewer - Help & About';
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 28px;
      font-weight: 600;
      text-align: center;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Web-based 3D viewer for robot models';
    subtitle.style.cssText = `
      margin: 0 0 24px 0;
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    `;

    const aboutSection = document.createElement('div');
    aboutSection.style.cssText = `
      margin-bottom: 24px;
      padding: 20px;
      background: rgba(76, 175, 80, 0.08);
      border: 1px solid rgba(76, 175, 80, 0.2);
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.85);
    `;

    aboutSection.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong style="color: #4CAF50; font-size: 14px;">Developed by:</strong><br>
        <span style="color: rgba(255, 255, 255, 0.9);">Frederick Feraco</span><br>
        <a href="mailto:fred@robostore.com" style="color: #4CAF50; text-decoration: none;">fred@robostore.com</a><br>
        <a href="https://github.com/frederickferaco" target="_blank" rel="noopener" style="color: #4CAF50; text-decoration: none;">GitHub Profile</a>
      </div>

      <div style="margin-bottom: 16px;">
        <strong style="color: #4CAF50; font-size: 14px;">Built upon:</strong><br>
        <span style="color: rgba(255, 255, 255, 0.9);">Original Robot Viewer by <a href="https://github.com/fan-ziqi/robot_viewer" target="_blank" rel="noopener" style="color: #4CAF50; text-decoration: none;">fan-ziqi</a></span>
      </div>

      <div>
        <strong style="color: #4CAF50; font-size: 14px;">Enhanced Features Added:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: rgba(255, 255, 255, 0.8);">
          <li>CSV Motion Import & Playback - Load and replay motion sequences from CSV files</li>
          <li>Motion Sequence Builder - Create, edit, and chain multiple motion presets</li>
          <li>Joint Graph Visualization - Real-time joint angle plotting with D3.js</li>
          <li>Enhanced Keyboard Controls - Intuitive robot control via arrow keys</li>
          <li>Supabase Integration - Cloud storage for motion sequences</li>
          <li>Improved UI/UX - Floating panels with maximize/minimize controls</li>
        </ul>
      </div>
    `;

    const keyboardTitle = document.createElement('h3');
    keyboardTitle.textContent = 'Keyboard Controls';
    keyboardTitle.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #4CAF50;
    `;

    const shortcuts = [
      { key: '↑ Up Arrow', action: 'Walk Forward' },
      { key: '↓ Down Arrow', action: 'Walk Backward' },
      { key: '← Left Arrow', action: 'Turn Left' },
      { key: '→ Right Arrow', action: 'Turn Right' },
      { key: '+ or =', action: 'Increase Speed' },
      { key: '- or _', action: 'Decrease Speed' },
      { key: 'H', action: 'Toggle This Help' }
    ];

    const shortcutList = document.createElement('div');
    shortcutList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    shortcuts.forEach(({ key, action }) => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
      `;

      item.onmouseenter = () => {
        item.style.background = 'rgba(255, 255, 255, 0.08)';
        item.style.borderColor = 'rgba(76, 175, 80, 0.4)';
        item.style.transform = 'translateX(4px)';
      };

      item.onmouseleave = () => {
        item.style.background = 'rgba(255, 255, 255, 0.05)';
        item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        item.style.transform = 'translateX(0)';
      };

      const keyElement = document.createElement('div');
      keyElement.textContent = key;
      keyElement.style.cssText = `
        font-weight: 600;
        font-size: 14px;
        color: #4CAF50;
        font-family: 'Courier New', monospace;
      `;

      const actionElement = document.createElement('div');
      actionElement.textContent = action;
      actionElement.style.cssText = `
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
      `;

      item.appendChild(keyElement);
      item.appendChild(actionElement);
      shortcutList.appendChild(item);
    });

    const note = document.createElement('div');
    note.style.cssText = `
      margin-top: 24px;
      padding: 16px;
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid rgba(76, 175, 80, 0.3);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
      line-height: 1.6;
    `;

    note.innerHTML = `
      <strong style="color: #4CAF50;">Note:</strong> Keyboard controls are only active when the MuJoCo simulation is running.
      They automatically disable when typing in text fields or using UI controls.
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close (H)';
    closeButton.style.cssText = `
      width: 100%;
      margin-top: 24px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    `;

    closeButton.onmouseenter = () => {
      closeButton.style.transform = 'translateY(-2px)';
      closeButton.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
    };

    closeButton.onmouseleave = () => {
      closeButton.style.transform = 'translateY(0)';
      closeButton.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
    };

    closeButton.onclick = () => this.hide();

    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(aboutSection);
    content.appendChild(keyboardTitle);
    content.appendChild(shortcutList);
    content.appendChild(note);
    content.appendChild(closeButton);

    this.overlay.appendChild(content);

    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    };

    return this.overlay;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (this.overlay) {
      this.overlay.style.display = 'flex';
      this.isVisible = true;
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.isVisible = false;
    }
  }

  dispose() {
    if (this.overlay && this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
    }
    this.overlay = null;
    this.isVisible = false;
  }
}

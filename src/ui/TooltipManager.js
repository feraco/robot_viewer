export class TooltipManager {
  constructor() {
    this.tooltipRegistry = new Map();
    this.activeTooltip = null;
    this.showDelay = 300;
    this.hideDelay = 200;
    this.currentTarget = null;
    this.showTimer = null;
    this.hideTimer = null;
    this.tooltipElement = null;
    this.createTooltipElement();
  }

  createTooltipElement() {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.id = 'educational-tooltip';
    this.tooltipElement.style.cssText = `
      position: fixed;
      background: rgba(17, 24, 39, 0.98);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(96, 165, 250, 0.3);
      border-radius: 8px;
      padding: 16px;
      max-width: 320px;
      z-index: var(--z-tooltip);
      display: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      opacity: 0;
      transform: translateY(-5px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
      font-size: 14px;
      line-height: 1.6;
    `;
    document.body.appendChild(this.tooltipElement);
  }

  register(targetId, content) {
    this.tooltipRegistry.set(targetId, content);
  }

  registerBulk(tooltips) {
    tooltips.forEach(({ id, content }) => {
      this.register(id, content);
    });
  }

  attachToElement(element, content, position = 'top') {
    if (!element) return;

    element.addEventListener('mouseenter', () => {
      this.show(element, content, position);
    });

    element.addEventListener('mouseleave', () => {
      this.hide();
    });
  }

  show(targetElement, content, position = 'top') {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.currentTarget = targetElement;

    this.showTimer = setTimeout(() => {
      if (typeof content === 'object') {
        this.tooltipElement.innerHTML = this.formatRichContent(content);
      } else {
        this.tooltipElement.innerHTML = `<div style="color: rgba(255, 255, 255, 0.95);">${content}</div>`;
      }

      this.position(targetElement, position);

      this.tooltipElement.style.display = 'block';
      setTimeout(() => {
        this.tooltipElement.style.opacity = '1';
        this.tooltipElement.style.transform = 'translateY(0)';
      }, 10);

      this.activeTooltip = { targetElement, content, position };
    }, this.showDelay);
  }

  formatRichContent(content) {
    const { title, description, tips, icon } = content;

    let html = '<div style="color: white;">';

    if (title) {
      html += `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          ${icon ? `<span style="font-size: 18px;">${icon}</span>` : ''}
          <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: #60a5fa;">${title}</h4>
        </div>
      `;
    }

    if (description) {
      html += `<p style="margin: 0 0 12px 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">${description}</p>`;
    }

    if (tips && tips.length > 0) {
      html += '<div style="border-top: 1px solid rgba(96, 165, 250, 0.2); padding-top: 12px;">';
      html += '<p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.5px;">Tips</p>';
      html += '<ul style="margin: 0; padding-left: 20px; font-size: 13px; color: rgba(255, 255, 255, 0.85);">';
      tips.forEach(tip => {
        html += `<li style="margin-bottom: 4px;">${tip}</li>`;
      });
      html += '</ul>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  position(targetElement, preferredPosition) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const padding = 12;
    const arrowSize = 8;

    let top, left;

    switch (preferredPosition) {
      case 'top':
        top = rect.top - tooltipRect.height - padding - arrowSize;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;

      case 'bottom':
        top = rect.bottom + padding + arrowSize;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;

      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - padding - arrowSize;
        break;

      case 'right':
      default:
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + padding + arrowSize;
        break;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) {
      left = padding;
    } else if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }

    if (top < padding) {
      top = padding;
    } else if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  hide() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    this.hideTimer = setTimeout(() => {
      this.tooltipElement.style.opacity = '0';
      this.tooltipElement.style.transform = 'translateY(-5px)';

      setTimeout(() => {
        this.tooltipElement.style.display = 'none';
        this.activeTooltip = null;
        this.currentTarget = null;
      }, 200);
    }, this.hideDelay);
  }

  destroy() {
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }
    this.tooltipRegistry.clear();
    this.activeTooltip = null;
  }

  static getDefaultTooltips() {
    return [
      {
        id: 'files-panel-tooltip',
        content: {
          title: 'Files Panel',
          icon: '📁',
          description: 'Load and manage your robot models in various formats.',
          tips: [
            'Drag and drop URDF, MJCF, or USD files',
            'Browse the file structure and assets',
            'Load sample models to get started quickly'
          ]
        }
      },
      {
        id: 'joints-panel-tooltip',
        content: {
          title: 'Joint Controls',
          icon: '🎚️',
          description: 'Precisely control individual joint angles and positions.',
          tips: [
            'Adjust sliders to move joints in real-time',
            'Click joint names to see them highlighted',
            'Use the graph view to visualize joint relationships'
          ]
        }
      },
      {
        id: 'model-tree-tooltip',
        content: {
          title: 'Model Hierarchy',
          icon: '🌳',
          description: 'Navigate the complete structure of your robot model.',
          tips: [
            'Expand nodes to see child components',
            'Click items to highlight them in the 3D view',
            'Understand parent-child relationships'
          ]
        }
      },
      {
        id: 'visualization-tooltip',
        content: {
          title: 'Visualization Options',
          icon: '👁️',
          description: 'Toggle different visual elements to analyze your model.',
          tips: [
            'Show/hide visual and collision meshes',
            'Display center of mass indicators',
            'View inertial properties and frames'
          ]
        }
      },
      {
        id: 'motion-controls-tooltip',
        content: {
          title: 'Motion Playback',
          icon: '▶️',
          description: 'Play, record, and manage motion sequences.',
          tips: [
            'Load CSV or NPZ motion files',
            'Use timeline to scrub through animations',
            'Record custom motion sequences'
          ]
        }
      },
      {
        id: 'motion-library-tooltip',
        content: {
          title: 'Motion Library',
          icon: '📚',
          description: 'Access a collection of pre-made motion sequences.',
          tips: [
            'Filter by category and difficulty',
            'Preview motions before loading',
            'Search for specific movements'
          ]
        }
      },
      {
        id: 'code-editor-tooltip',
        content: {
          title: 'Code Editor',
          icon: '💻',
          description: 'View and edit model source code directly.',
          tips: [
            'Edit URDF/MJCF XML in real-time',
            'Changes update the 3D view automatically',
            'Use syntax highlighting for easier reading'
          ]
        }
      },
      {
        id: 'deployment-tooltip',
        content: {
          title: 'Deployment Planning',
          icon: '🗺️',
          description: 'Plan and execute robot missions with waypoints.',
          tips: [
            'Place waypoints to define paths',
            'Compile motion sequences for deployment',
            'Track execution accuracy and timing'
          ]
        }
      }
    ];
  }
}

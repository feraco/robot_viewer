import { MotionLibraryService } from '../services/MotionLibraryService.js';
import { isSupabaseEnabled } from '../utils/SupabaseClient.js';
import { CSVMotionLoader } from '../loaders/CSVMotionLoader.js';

export class MotionLibraryGalleryUI {
  constructor(motionController) {
    this.motionController = motionController;
    this.container = null;
    this.motions = [];
    this.filteredMotions = [];
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.intersectionObserver = null;
    this.renderedCards = new Set();
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('motionLibraryUpdated', () => {
      this.loadMotions();
    });
  }

  async createGalleryPanel() {
    const panel = document.createElement('div');
    panel.id = 'floating-motion-gallery-panel';
    panel.className = 'floating-panel';
    panel.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      width: 400px;
      height: 600px;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 100;
    `;

    panel.innerHTML = `
      <div class="floating-panel-header" style="
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(40, 40, 40, 0.8);
      ">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Motion Library</h3>
        <div style="display: flex; gap: 8px;">
          <button class="panel-minimize-btn" data-panel-id="floating-motion-gallery-panel"
            style="background: transparent; border: none; color: white; cursor: pointer;
            font-size: 18px; padding: 0 5px; line-height: 1;" title="Minimize">−</button>
          <button class="panel-maximize-btn" data-panel-id="floating-motion-gallery-panel"
            style="background: transparent; border: none; color: white; cursor: pointer;
            font-size: 16px; padding: 0 5px; line-height: 1;" title="Maximize">⛶</button>
          <button id="closeMotionGallery" style="background: transparent; border: none;
            color: white; cursor: pointer; font-size: 20px; padding: 0 5px;
            line-height: 1;">×</button>
        </div>
      </div>

      <div class="floating-panel-content" style="
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      ">
        <div style="padding: 15px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <input type="text" id="motionSearchInput" placeholder="Search motions..." style="
            width: 100%;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
            margin-bottom: 10px;
          ">

          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="category-filter-btn" data-category="all" style="
              padding: 6px 12px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 6px;
              color: white;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">All</button>
            <button class="category-filter-btn" data-category="walking" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: white;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">Walking</button>
            <button class="category-filter-btn" data-category="sports" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: white;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">Sports</button>
            <button class="category-filter-btn" data-category="dance" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: white;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">Dance</button>
            <button class="category-filter-btn" data-category="combat" style="
              padding: 6px 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: white;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s;
            ">Combat</button>
          </div>
        </div>

        <div id="motionGalleryGrid" style="
          flex: 1;
          overflow-y: auto;
          padding: 15px 20px;
        ">
          <div style="text-align: center; padding: 40px 20px; color: #999;">
            <p>Loading motion library...</p>
          </div>
        </div>
      </div>
    `;

    this.container = panel;
    document.body.appendChild(panel);

    this.setupIntersectionObserver();
    this.bindEventHandlers();
    await this.loadMotions();

    return panel;
  }

  setupIntersectionObserver() {
    const options = {
      root: this.container?.querySelector('#motionGalleryGrid'),
      rootMargin: '50px',
      threshold: 0.01
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const index = parseInt(card.dataset.motionIndex);

          if (!this.renderedCards.has(index)) {
            this.renderMotionCard(card, this.filteredMotions[index]);
            this.renderedCards.add(index);
          }
        }
      });
    }, options);
  }

  bindEventHandlers() {
    const closeBtn = this.container.querySelector('#closeMotionGallery');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const searchInput = this.container.querySelector('#motionSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.filterMotions();
      });
    }

    const categoryButtons = this.container.querySelectorAll('.category-filter-btn');
    categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-category');

        categoryButtons.forEach(b => {
          if (b === btn) {
            b.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            b.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          } else {
            b.style.background = 'rgba(255, 255, 255, 0.05)';
            b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }
        });

        this.filterMotions();
      });
    });
  }

  async loadMotions() {
    if (!isSupabaseEnabled()) {
      this.renderNoDatabase();
      return;
    }

    try {
      this.motions = await MotionLibraryService.getAllMotions();
      console.log('Loaded motions:', this.motions.length);
      console.log('Categories:', [...new Set(this.motions.map(m => m.category))]);
      this.filterMotions();
    } catch (error) {
      console.error('Failed to load motions:', error);
      this.renderError(error.message);
    }
  }

  filterMotions() {
    let filtered = this.motions;

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === this.selectedCategory);
      console.log(`Filtering by category "${this.selectedCategory}": ${filtered.length} motions`);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(this.searchQuery) ||
        (m.description && m.description.toLowerCase().includes(this.searchQuery)) ||
        (m.tags && m.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)))
      );
    }

    this.filteredMotions = filtered;
    this.renderedCards.clear();
    console.log('Filtered motions:', this.filteredMotions.length);
    this.render();
  }

  render() {
    const grid = this.container.querySelector('#motionGalleryGrid');
    if (!grid) return;

    if (this.filteredMotions.length === 0) {
      grid.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #999;">
          <p>No motions found</p>
          <p style="font-size: 12px; margin-top: 10px;">
            Try a different search or category filter
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.filteredMotions.map((motion, index) => this.createSkeletonCard(index)).join('');

    const cards = grid.querySelectorAll('.motion-card-skeleton');
    cards.forEach(card => {
      this.intersectionObserver.observe(card);
    });
  }

  createSkeletonCard(index) {
    return `
      <div class="motion-card-skeleton" data-motion-index="${index}" style="
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      </div>
    `;
  }

  renderMotionCard(container, motion) {
    if (!motion) return;

    container.innerHTML = this.createMotionCard(motion);
    container.classList.remove('motion-card-skeleton');
    container.classList.add('motion-card');
    container.style.cursor = 'pointer';
    container.style.transition = 'all 0.2s';

    container.addEventListener('click', () => {
      this.loadMotion(motion);
    });

    container.addEventListener('mouseenter', () => {
      container.style.background = 'rgba(255, 255, 255, 0.1)';
      container.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });

    container.addEventListener('mouseleave', () => {
      container.style.background = 'rgba(255, 255, 255, 0.05)';
      container.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
  }

  createMotionCard(motion) {
    const duration = motion.duration ? `${motion.duration.toFixed(1)}s` : 'N/A';
    const frames = motion.frame_count || 'N/A';
    const difficulty = motion.difficulty || '';
    const difficultyColors = {
      easy: '#4ade80',
      medium: '#fbbf24',
      hard: '#f87171'
    };
    const difficultyColor = difficultyColors[difficulty] || '#999';

    return `
      ${motion.thumbnail_url ? `
        <div style="
          width: 100%;
          height: 120px;
          background-image: url('${motion.thumbnail_url}');
          background-size: cover;
          background-position: center;
          border-radius: 6px;
          margin-bottom: 10px;
        "></div>
      ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600;">${this.escapeHtml(motion.name)}</h4>
          ${motion.is_featured ? '<span style="color: #fbbf24; font-size: 16px;">★</span>' : ''}
        </div>

        ${motion.description ? `
          <p style="
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #aaa;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          ">${this.escapeHtml(motion.description)}</p>
        ` : ''}

        <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
          <span style="
            padding: 3px 8px;
            background: rgba(102, 126, 234, 0.2);
            border-radius: 4px;
            font-size: 11px;
            color: #a5b4fc;
          ">${this.escapeHtml(motion.category)}</span>
          ${difficulty ? `
            <span style="
              padding: 3px 8px;
              background: rgba(${this.hexToRgb(difficultyColor)}, 0.2);
              border-radius: 4px;
              font-size: 11px;
              color: ${difficultyColor};
            ">${difficulty}</span>
          ` : ''}
        </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #666;">
        <span>${duration}</span>
        <span>${frames} frames</span>
      </div>
    `;
  }

  async loadMotion(motion) {
    console.log('Loading motion:', motion.name);
    console.log('Motion controller:', this.motionController);

    try {
      const response = await fetch(motion.file_url);
      if (!response.ok) throw new Error('Failed to fetch motion file');

      const csvText = await response.text();
      console.log('CSV loaded, length:', csvText.length);

      if (this.motionController) {
        const motionData = CSVMotionLoader.parseCSV(csvText, 'G1');
        console.log('Motion data parsed:', motionData);
        this.motionController.loadMotion(motionData, false);
        console.log('Motion loaded to controller');
      } else {
        throw new Error('Motion controller not available');
      }

      this.showNotification(`Loaded: ${motion.name}`, 'success');
    } catch (error) {
      console.error('Failed to load motion:', error);
      this.showNotification(`Failed to load motion: ${error.message}`, 'error');
    }
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transition = 'opacity 0.3s';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  renderNoDatabase() {
    const grid = this.container.querySelector('#motionGalleryGrid');
    if (!grid) return;

    grid.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <h4 style="color: #ff6b6b; margin: 0 0 10px 0;">Database Not Configured</h4>
        <p style="color: #999; font-size: 13px;">
          Configure Supabase to use the motion library feature.
        </p>
      </div>
    `;
  }

  renderError(message) {
    const grid = this.container.querySelector('#motionGalleryGrid');
    if (!grid) return;

    grid.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <h4 style="color: #ff6b6b; margin: 0 0 10px 0;">Error Loading Motions</h4>
        <p style="color: #999; font-size: 13px;">${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
    } else {
      this.createGalleryPanel();
      this.container.style.display = 'flex';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  toggle() {
    if (this.container && this.container.style.display === 'flex') {
      this.hide();
    } else {
      this.show();
    }
  }
}

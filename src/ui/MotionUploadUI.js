import { MotionLibraryService } from '../services/MotionLibraryService.js';
import { supabase, isSupabaseEnabled } from '../utils/SupabaseClient.js';

export class MotionUploadUI {
  constructor() {
    this.container = null;
  }

  createUploadPanel() {
    const panel = document.createElement('div');
    panel.id = 'motionUploadPanel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      overflow-y: auto;
      z-index: var(--z-motion-library);
      display: none;
    `;

    this.container = panel;
    this.render();
    document.body.appendChild(panel);

    return panel;
  }

  render() {
    if (!this.container) return;

    if (!isSupabaseEnabled()) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #ff6b6b;">Database Not Configured</h3>
          <p style="color: #999; font-size: 14px;">
            Supabase credentials are required to use the motion library.
          </p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 18px;">Upload Motion</h3>
        <button id="closeUploadPanel" style="
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>

      <form id="motionUploadForm">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #aaa;">
            CSV Motion File *
          </label>
          <input type="file" id="csvFile" accept=".csv" required style="
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
          ">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #aaa;">
            Motion Name *
          </label>
          <input type="text" id="motionName" required placeholder="e.g., Walking Forward" style="
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
          ">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #aaa;">
            Category *
          </label>
          <select id="motionCategory" required style="
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
          ">
            <option value="">Select a category</option>
            <option value="walking">Walking</option>
            <option value="running">Running</option>
            <option value="sports">Sports</option>
            <option value="dance">Dance</option>
            <option value="combat">Combat</option>
            <option value="gestures">Gestures</option>
            <option value="manipulation">Manipulation</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #aaa;">
            Difficulty
          </label>
          <select id="motionDifficulty" style="
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
          ">
            <option value="">Not specified</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #aaa;">
            Description
          </label>
          <textarea id="motionDescription" placeholder="Describe this motion..." style="
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
            resize: vertical;
            min-height: 60px;
          "></textarea>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #aaa;">
            Tags (comma-separated)
          </label>
          <input type="text" id="motionTags" placeholder="e.g., humanoid, bipedal, forward" style="
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
          ">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: flex; align-items: center; font-size: 13px; cursor: pointer;">
            <input type="checkbox" id="isFeatured" style="margin-right: 8px;">
            <span>Mark as Featured</span>
          </label>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #aaa;">
            Thumbnail (optional)
          </label>
          <input type="file" id="thumbnailFile" accept="image/*" style="
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: white;
            font-size: 13px;
          ">
        </div>

        <div id="uploadStatus" style="
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
          display: none;
        "></div>

        <button type="submit" id="uploadBtn" style="
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: opacity 0.2s;
        ">Upload Motion</button>
      </form>
    `;

    const closeBtn = this.container.querySelector('#closeUploadPanel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const form = this.container.querySelector('#motionUploadForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const csvFile = document.getElementById('csvFile').files[0];
    const name = document.getElementById('motionName').value.trim();
    const category = document.getElementById('motionCategory').value;
    const difficulty = document.getElementById('motionDifficulty').value || null;
    const description = document.getElementById('motionDescription').value.trim() || null;
    const tagsInput = document.getElementById('motionTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    const isFeatured = document.getElementById('isFeatured').checked;
    const thumbnailFile = document.getElementById('thumbnailFile').files[0];

    const statusDiv = document.getElementById('uploadStatus');
    const uploadBtn = document.getElementById('uploadBtn');

    try {
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading...';

      this.showStatus('Uploading CSV file...', 'info');

      const csvText = await csvFile.text();
      const metadata = await MotionLibraryService.parseCSVMetadata(csvText);

      const fileUrl = await MotionLibraryService.uploadMotionFile(csvFile, 'public');

      let thumbnailUrl = null;
      if (thumbnailFile) {
        this.showStatus('Uploading thumbnail...', 'info');
        thumbnailUrl = await MotionLibraryService.uploadThumbnail(thumbnailFile, 'public');
      }

      this.showStatus('Creating database entry...', 'info');

      const motionData = {
        name,
        category,
        file_url: fileUrl,
        duration: metadata.duration,
        difficulty,
        is_featured: isFeatured,
        thumbnail_url: thumbnailUrl,
        description,
        tags,
        frame_count: metadata.frameCount,
        created_by: null
      };

      await MotionLibraryService.createMotionEntry(motionData);

      this.showStatus('Motion uploaded successfully!', 'success');

      setTimeout(() => {
        this.hide();
        document.getElementById('motionUploadForm').reset();

        window.dispatchEvent(new CustomEvent('motionLibraryUpdated'));
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      this.showStatus(`Error: ${error.message}`, 'error');
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Motion';
    }
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    if (!statusDiv) return;

    const colors = {
      info: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#60a5fa' },
      success: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e', text: '#4ade80' },
      error: { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#f87171' }
    };

    const color = colors[type] || colors.info;

    statusDiv.style.display = 'block';
    statusDiv.style.background = color.bg;
    statusDiv.style.border = `1px solid ${color.border}`;
    statusDiv.style.color = color.text;
    statusDiv.textContent = message;
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    } else {
      this.createUploadPanel();
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  toggle() {
    if (this.container && this.container.style.display === 'block') {
      this.hide();
    } else {
      this.show();
    }
  }
}

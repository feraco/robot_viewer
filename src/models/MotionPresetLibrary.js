export class MotionPreset {
  constructor(options = {}) {
    this.id = options.id;
    this.name = options.name;
    this.description = options.description || '';
    this.url = options.url;
    this.category = options.category || 'general';
    this.defaultDuration = options.defaultDuration || null;
    this.icon = options.icon || '🤖';
    this.robotType = options.robotType || 'G1';
    this.loopable = options.loopable !== false;
  }
}

export class MotionPresetLibrary {
  constructor() {
    this.presets = new Map();
    this.categories = new Set();
    this.initializeDefaultPresets();
  }

  initializeDefaultPresets() {
    this.addPreset(new MotionPreset({
      id: 'walk_forward',
      name: 'Walk Forward',
      description: 'Walk forward motion',
      url: './g1_walk_forward.csv',
      category: 'locomotion',
      defaultDuration: 3.0,
      icon: '⬆️',
      robotType: 'G1',
      loopable: true
    }));

    this.addPreset(new MotionPreset({
      id: 'walk_backward',
      name: 'Walk Backward',
      description: 'Walk backward motion',
      url: './g1_walk_backward.csv',
      category: 'locomotion',
      defaultDuration: 3.0,
      icon: '⬇️',
      robotType: 'G1',
      loopable: true
    }));
  }

  addPreset(preset) {
    this.presets.set(preset.id, preset);
    this.categories.add(preset.category);
  }

  removePreset(id) {
    this.presets.delete(id);
  }

  getPreset(id) {
    return this.presets.get(id);
  }

  getAllPresets() {
    return Array.from(this.presets.values());
  }

  getPresetsByCategory(category) {
    return Array.from(this.presets.values()).filter(p => p.category === category);
  }

  getCategories() {
    return Array.from(this.categories);
  }

  hasPreset(id) {
    return this.presets.has(id);
  }

  searchPresets(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.presets.values()).filter(preset =>
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.description.toLowerCase().includes(lowerQuery) ||
      preset.category.toLowerCase().includes(lowerQuery)
    );
  }

  async discoverMotions(basePath = './') {
    const response = await fetch(basePath);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a[href$=".csv"]');

    links.forEach(link => {
      const url = link.href;
      const filename = url.split('/').pop();
      const id = filename.replace('.csv', '');

      if (!this.hasPreset(id)) {
        const name = id.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        this.addPreset(new MotionPreset({
          id,
          name,
          description: `Motion from ${filename}`,
          url,
          category: 'custom',
          icon: '📁'
        }));
      }
    });
  }
}

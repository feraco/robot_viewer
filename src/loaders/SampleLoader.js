import { SAMPLE_MODELS, SAMPLE_MOTIONS } from '../config/samples.js';

export class SampleLoader {
  constructor(fileHandler, csvMotionController, csvMotionUI) {
    this.fileHandler = fileHandler;
    this.csvMotionController = csvMotionController;
    this.csvMotionUI = csvMotionUI;
  }

  initializeSampleSelectors() {
    const modelsSelect = document.getElementById('sample-models-select');

    if (modelsSelect) {
      SAMPLE_MODELS.forEach((model, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = model.name;
        modelsSelect.appendChild(option);
      });

      modelsSelect.addEventListener('change', (e) => {
        if (e.target.value !== '') {
          this.loadSampleModel(parseInt(e.target.value));
          e.target.value = '';
        }
      });
    }
  }

  async loadSample(path) {
    const url = path.startsWith('/') ? `.${path}` : path;
    const type = path.endsWith('.xml') ? 'xml' : path.split('.').pop();
    const name = path.split('/').pop().replace(/\.[^.]+$/, '');
    await this._loadModelFromUrl(url, name, type);
  }

  async loadSampleModel(index) {
    const sample = SAMPLE_MODELS[index];
    if (!sample) return;
    await this._loadModelFromUrl(sample.url, sample.name, sample.type);
  }

  async _loadModelFromUrl(url, name, type) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const content = await response.text();
      const fileName = name.replace(/\s+/g, '_') + '.' + type;

      const file = new File([content], fileName, {
        type: 'text/xml'
      });

      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      file.userData = {
        baseUrl: baseUrl
      };

      this.fileHandler.fileMap.set(fileName, file);

      if (type === 'xml') {
        await this.loadMeshFiles(content, baseUrl);
      }

      await this.fileHandler.loadFile(file);

    } catch (error) {
      console.error('Failed to load sample model:', error);
      alert(`Failed to load sample model: ${error.message}`);
    }
  }

  async loadMeshFiles(xmlContent, baseUrl) {
    try {
      // Parse XML to find mesh references
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'application/xml');

      // Get compiler settings
      const compilerEl = doc.querySelector('compiler');
      const meshdir = compilerEl?.getAttribute('meshdir') || 'meshes';

      // Find all mesh elements
      const meshElements = doc.querySelectorAll('mesh[file]');
      const meshFiles = Array.from(meshElements).map(el => el.getAttribute('file'));

      if (meshFiles.length === 0) {
        return;
      }

      console.log(`Loading ${meshFiles.length} mesh files from ${baseUrl}${meshdir}/...`);

      // Load all mesh files in parallel
      const meshPromises = meshFiles.map(async (meshFile) => {
        try {
          const meshUrl = `${baseUrl}${meshdir}/${meshFile}`;
          const response = await fetch(meshUrl);

          if (!response.ok) {
            console.warn(`Failed to load mesh: ${meshFile} (${response.status})`);
            return;
          }

          const blob = await response.blob();
          const file = new File([blob], meshFile, { type: 'application/octet-stream' });

          // Add to fileMap with multiple path variations for MuJoCo to find
          this.fileHandler.fileMap.set(meshFile, file);
          this.fileHandler.fileMap.set(`${meshdir}/${meshFile}`, file);
          this.fileHandler.fileMap.set(`meshes/${meshFile}`, file);

        } catch (error) {
          console.warn(`Error loading mesh ${meshFile}:`, error);
        }
      });

      await Promise.all(meshPromises);
      console.log(`Successfully loaded ${meshFiles.length} mesh files`);

    } catch (error) {
      console.error('Error parsing mesh files from XML:', error);
    }
  }

  async loadSampleMotion(index) {
    const sample = SAMPLE_MOTIONS[index];
    if (!sample) return;

    try {
      const response = await fetch(sample.url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const content = await response.text();
      const fileName = sample.name.replace(/\s+/g, '_') + '.csv';

      const file = new File([content], fileName, {
        type: 'text/csv'
      });

      if (this.csvMotionUI) {
        await this.csvMotionUI.handleFileLoad(file);
      } else {
        console.warn('CSV Motion UI not initialized yet. Please load a model first.');
      }

    } catch (error) {
      console.error('Failed to load sample motion:', error);
      alert(`Failed to load sample motion: ${error.message}`);
    }
  }
}

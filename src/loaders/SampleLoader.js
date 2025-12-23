import { SAMPLE_MODELS, SAMPLE_MOTIONS } from '../config/samples.js';

export class SampleLoader {
  constructor(fileHandler, csvMotionController) {
    this.fileHandler = fileHandler;
    this.csvMotionController = csvMotionController;
  }

  initializeSampleSelectors() {
    const modelsSelect = document.getElementById('sample-models-select');
    const motionsSelect = document.getElementById('sample-motions-select');

    SAMPLE_MODELS.forEach((model, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = model.name;
      modelsSelect.appendChild(option);
    });

    SAMPLE_MOTIONS.forEach((motion, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${motion.name} (${motion.robotType})`;
      motionsSelect.appendChild(option);
    });

    modelsSelect.addEventListener('change', (e) => {
      if (e.target.value !== '') {
        this.loadSampleModel(parseInt(e.target.value));
        e.target.value = '';
      }
    });

    motionsSelect.addEventListener('change', (e) => {
      if (e.target.value !== '') {
        this.loadSampleMotion(parseInt(e.target.value));
        e.target.value = '';
      }
    });
  }

  async loadSampleModel(index) {
    const sample = SAMPLE_MODELS[index];
    if (!sample) return;

    try {
      const response = await fetch(sample.url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const content = await response.text();
      const fileName = sample.name.replace(/\s+/g, '_') + '.' + sample.type;

      const file = new File([content], fileName, {
        type: 'text/xml'
      });

      // Store the base URL for remote mesh loading (for MJCF files)
      file.userData = {
        baseUrl: sample.url.substring(0, sample.url.lastIndexOf('/') + 1)
      };

      await this.fileHandler.handleFiles([file]);

    } catch (error) {
      console.error('Failed to load sample model:', error);
      alert(`Failed to load sample model: ${error.message}`);
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

      if (this.csvMotionController && this.csvMotionController.ui) {
        await this.csvMotionController.ui.handleCSVFile(file);
      }

    } catch (error) {
      console.error('Failed to load sample motion:', error);
      alert(`Failed to load sample motion: ${error.message}`);
    }
  }
}

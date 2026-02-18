export const tourSteps = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to Robot Viewer! 🤖',
    content: 'Let\'s take a quick tour to help you get started. We\'ll show you the key features and how to use them effectively. Press Next to continue or Skip to explore on your own.',
    position: 'center'
  },
  {
    id: 'toolbar-overview',
    target: '#toolbar',
    title: 'Main Toolbar',
    content: 'This toolbar gives you access to all major features. From here you can load models, control joints, view code, and manage motion sequences.',
    position: 'bottom'
  },
  {
    id: 'files-panel',
    target: '#toggle-files-panel',
    title: 'Files Panel',
    content: 'Click here to open the Files Panel where you can load robot models (URDF, MJCF, USD), browse the file structure, and manage your assets. Try dragging and dropping files directly into the viewer!',
    position: 'right',
    action: () => {
      const button = document.querySelector('#toggle-files-panel');
      if (button && !button.classList.contains('active')) {
        button.click();
      }
    }
  },
  {
    id: 'joints-panel',
    target: '#toggle-joints-panel',
    title: 'Joint Controls',
    content: 'The Joints Panel lets you control individual joint angles with precise sliders. You can also see the joint hierarchy and relationships in a graph view.',
    position: 'right',
    action: () => {
      const filesButton = document.querySelector('#toggle-files-panel');
      if (filesButton && filesButton.classList.contains('active')) {
        filesButton.click();
      }
      const button = document.querySelector('#toggle-joints-panel');
      if (button && !button.classList.contains('active')) {
        button.click();
      }
    }
  },
  {
    id: 'model-tree',
    target: '#toggle-model-tree-panel',
    title: 'Model Hierarchy',
    content: 'View your robot\'s complete structure in a hierarchical tree. Click on any component to highlight it in the 3D view and understand parent-child relationships.',
    position: 'right',
    action: () => {
      const jointsButton = document.querySelector('#toggle-joints-panel');
      if (jointsButton && jointsButton.classList.contains('active')) {
        jointsButton.click();
      }
    }
  },
  {
    id: 'visualization',
    target: '#toggle-visual, #toggle-collision, #toggle-com, #toggle-inertia',
    title: 'Visualization Toggles',
    content: 'These buttons let you show or hide different visual elements. Toggle visual meshes, collision shapes, center of mass indicators, and inertial properties to analyze your model.',
    position: 'bottom'
  },
  {
    id: 'motion-library',
    target: '#toggle-motion-library',
    title: 'Motion Library',
    content: 'Access a curated collection of pre-made motion sequences. Browse by category, search for specific movements, and preview before loading. Perfect for testing and inspiration!',
    position: 'right',
    action: () => {
      const button = document.querySelector('#toggle-motion-library');
      if (button && !button.classList.contains('active')) {
        button.click();
      }
    }
  },
  {
    id: 'motion-controls',
    target: '#motion-controls',
    title: 'Motion Playback',
    content: 'Load and play motion files (CSV, NPZ, PKL), scrub through the timeline, and control playback speed. You can also record custom motion sequences by adjusting joints.',
    position: 'top'
  },
  {
    id: 'code-editor',
    target: '#toggle-code-editor',
    title: 'Code Editor',
    content: 'View and edit your model\'s source code directly in the browser. Changes are reflected in real-time, making it easy to experiment with model parameters.',
    position: 'right',
    action: () => {
      const motionLibButton = document.querySelector('#toggle-motion-library');
      if (motionLibButton && motionLibButton.classList.contains('active')) {
        motionLibButton.click();
      }
    }
  },
  {
    id: 'deployment-panel',
    target: '#toggle-deployment-panel',
    title: 'Deployment Planning',
    content: 'Plan robot missions by placing waypoints, compiling motion sequences, and tracking execution. Great for testing autonomous navigation and task planning.',
    position: 'right'
  },
  {
    id: 'camera-controls',
    target: '#canvas-container',
    title: '3D Viewport Controls',
    content: 'Interact with the 3D view using your mouse: Left-click + drag to rotate, right-click + drag to pan, and scroll to zoom. You can also click joints directly to manipulate them.',
    position: 'center'
  },
  {
    id: 'sequence-builder',
    target: '#toggle-sequence-builder',
    title: 'Sequence Builder',
    content: 'Create complex motion sequences by chaining individual movements together. Define transitions, set timing, and save sequences for reuse.',
    position: 'right'
  },
  {
    id: 'help-menu',
    target: '#help-button',
    title: 'Help & Documentation',
    content: 'Need assistance? Click the help button to access documentation, keyboard shortcuts, and restart this tour anytime.',
    position: 'left'
  },
  {
    id: 'complete',
    target: 'body',
    title: 'You\'re All Set! 🎉',
    content: 'You\'ve completed the tour! You now know the basics of Robot Viewer. Start by loading a sample model or uploading your own. Remember, you can always restart this tour from the help menu. Happy exploring!',
    position: 'center'
  }
];

export const getTourStepById = (id) => {
  return tourSteps.find(step => step.id === id);
};

export const getTourStepsByCategory = (category) => {
  const categories = {
    basics: ['welcome', 'toolbar-overview', 'files-panel', 'camera-controls'],
    joints: ['joints-panel', 'model-tree'],
    visualization: ['visualization'],
    motion: ['motion-library', 'motion-controls', 'sequence-builder'],
    advanced: ['code-editor', 'deployment-panel'],
    help: ['help-menu', 'complete']
  };

  const stepIds = categories[category] || [];
  return tourSteps.filter(step => stepIds.includes(step.id));
};

export const getCompleteTour = () => {
  return [...tourSteps];
};

export const getQuickTour = () => {
  const quickStepIds = [
    'welcome',
    'toolbar-overview',
    'files-panel',
    'joints-panel',
    'motion-library',
    'camera-controls',
    'complete'
  ];
  return tourSteps.filter(step => quickStepIds.includes(step.id));
};

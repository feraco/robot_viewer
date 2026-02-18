// MOTION LIBRARY BULK IMPORT EXAMPLE
// Copy this into your browser console after the app loads

// Example 1: Simple list with URLs
const simpleExample = [
  {
    name: 'Walk Forward Slow',
    url: 'https://your-server.com/motions/walk_forward_slow.csv',
    category: 'walking',
    tags: ['slow', 'walk', 'humanoid']
  },
  {
    name: 'Walk Forward Medium',
    url: 'https://your-server.com/motions/walk_forward_medium.csv',
    category: 'walking',
    tags: ['medium', 'walk', 'humanoid']
  }
];

// Example 2: Full metadata
const detailedExample = [
  {
    name: 'Soccer Kick Right Foot',
    url: 'https://your-server.com/motions/soccer_kick_right.csv',
    category: 'sports',
    difficulty: 'hard',
    isFeatured: true,
    thumbnailUrl: 'https://your-server.com/thumbnails/soccer_kick.jpg',
    description: 'Powerful right foot soccer kick motion with full body coordination',
    tags: ['soccer', 'kick', 'right', 'sports', 'humanoid', 'athletic']
  }
];

// Example 3: Generate list from numbered files
function generateMotionList(baseUrl, count, prefix = 'motion_') {
  const motionList = [];
  for (let i = 1; i <= count; i++) {
    const paddedNum = i.toString().padStart(4, '0');
    motionList.push({
      name: `Motion ${paddedNum}`,
      url: `${baseUrl}${prefix}${paddedNum}.csv`,
      category: 'other',
      tags: ['imported', 'batch']
    });
  }
  return motionList;
}

// Example 4: Categorized generation
function generateCategorizedMotions(baseUrl, pattern) {
  const motionList = [];
  const categories = {
    walk: { category: 'walking', count: 500 },
    run: { category: 'running', count: 300 },
    jump: { category: 'sports', count: 200 },
    turn: { category: 'walking', count: 400 },
    gesture: { category: 'gestures', count: 600 }
  };

  for (const [prefix, config] of Object.entries(categories)) {
    for (let i = 1; i <= config.count; i++) {
      const paddedNum = i.toString().padStart(4, '0');
      motionList.push({
        name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${paddedNum}`,
        url: `${baseUrl}${prefix}_${paddedNum}.csv`,
        category: config.category,
        tags: [prefix, config.category, 'humanoid'],
        description: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} motion ${paddedNum}`
      });
    }
  }

  return motionList;
}

// TO USE:
// 1. Adjust the examples above to match your file structure
// 2. Copy this entire file into the browser console
// 3. Generate your motion list:
//    const myMotions = generateMotionList('https://your-server.com/motions/', 2000);
// 4. Import in batches:
//    await importInBatches(myMotions, 50);

// Helper function to import in batches
async function importInBatches(motionList, batchSize = 50) {
  console.log(`Starting import of ${motionList.length} motions...`);

  let totalSuccess = 0;
  let totalFailed = 0;
  const allErrors = [];

  for (let i = 0; i < motionList.length; i += batchSize) {
    const batch = motionList.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(motionList.length / batchSize);

    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} motions)...`);

    const results = await BulkMotionImporter.importFromURLList(batch);
    totalSuccess += results.success;
    totalFailed += results.failed;

    console.log(`  ✓ ${results.success} imported, ✗ ${results.failed} failed`);

    if (results.errors.length > 0) {
      allErrors.push(...results.errors);
    }

    // Progress bar
    const progress = Math.round(((i + batch.length) / motionList.length) * 100);
    console.log(`  Progress: ${progress}%`);

    // Small delay between batches to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n=================================');
  console.log('IMPORT COMPLETE!');
  console.log('=================================');
  console.log(`✓ Total imported: ${totalSuccess}`);
  console.log(`✗ Total failed: ${totalFailed}`);

  if (allErrors.length > 0) {
    console.log('\nFailed imports:');
    allErrors.slice(0, 10).forEach(err => {
      console.log(`  - ${err.name}: ${err.error}`);
    });
    if (allErrors.length > 10) {
      console.log(`  ... and ${allErrors.length - 10} more errors`);
    }
  }

  return { totalSuccess, totalFailed, allErrors };
}

// QUICK START EXAMPLES:

// For local testing with public folder files:
// await BulkMotionImporter.importFromPublicFolder();

// For 2000 sequentially numbered files:
// const motions = generateMotionList('https://your-cdn.com/motions/', 2000, 'motion_');
// await importInBatches(motions, 50);

// For categorized files:
// const motions = generateCategorizedMotions('https://your-cdn.com/motions/');
// await importInBatches(motions, 50);

console.log('Motion import helpers loaded! See comments above for usage examples.');

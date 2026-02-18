// IMPORT SCRIPT FOR FERACO MOTION DATA
// 2001 humanoid motion CSV files from GitHub
// Copy this entire file and paste into browser console after app loads

async function importFeracoMotions() {
  console.log('Fetching motion list from GitHub...');

  const response = await fetch('https://raw.githubusercontent.com/feraco/motiondata/main/raw_csv_urls.txt');
  const urlText = await response.text();
  const urls = urlText.trim().split('\n').filter(url => url.length > 0);

  console.log(`Found ${urls.length} motion files`);

  const categoryMapping = {
    'basic_movements': 'walking',
    'combat_and_tactical_movements': 'combat',
    'daily_life_and_household_movements': 'other',
    'dance_and_performance_movements': 'dance',
    'imitation_character_movements': 'other',
    'medical_care_safety_movements': 'other',
    'metadata': 'other',
    'object_tool_use_movements': 'manipulation',
    'occupational_work_movements': 'other',
    'social_expressive_movements': 'gestures',
    'sports_movements': 'sports',
    'uncategorized': 'other'
  };

  const motionList = urls.map(url => {
    const folderMatch = url.match(/main\/([^/]+)\//);
    const folder = folderMatch ? folderMatch[1] : 'uncategorized';
    const category = categoryMapping[folder] || 'other';

    const fileName = url.split('/').pop();
    const decodedName = decodeURIComponent(fileName)
      .replace(/\.csv$/, '')
      .replace(/%2C/g, ',')
      .replace(/_/g, ' ');

    const tags = [folder.replace(/_/g, ' '), 'humanoid', 'feraco'];

    if (decodedName.toLowerCase().includes('walk')) tags.push('walking');
    if (decodedName.toLowerCase().includes('run')) tags.push('running');
    if (decodedName.toLowerCase().includes('jump')) tags.push('jumping');
    if (decodedName.toLowerCase().includes('dance')) tags.push('dancing');
    if (decodedName.toLowerCase().includes('kick')) tags.push('kicking');

    return {
      name: decodedName,
      url: url,
      category: category,
      tags: tags,
      description: `Humanoid motion: ${decodedName}`
    };
  });

  console.log('\nCategory breakdown:');
  const categoryCount = {};
  motionList.forEach(m => {
    categoryCount[m.category] = (categoryCount[m.category] || 0) + 1;
  });
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} motions`);
  });

  console.log('\n=== Starting Import ===\n');

  const batchSize = 25;
  let totalSuccess = 0;
  let totalFailed = 0;
  const allErrors = [];

  for (let i = 0; i < motionList.length; i += batchSize) {
    const batch = motionList.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(motionList.length / batchSize);

    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} motions)...`);

    try {
      const results = await BulkMotionImporter.importFromURLList(batch);
      totalSuccess += results.success;
      totalFailed += results.failed;

      if (results.errors.length > 0) {
        allErrors.push(...results.errors);
      }

      const progress = Math.round(((i + batch.length) / motionList.length) * 100);
      console.log(`  ✓ ${results.success} imported, ✗ ${results.failed} failed | Progress: ${progress}%`);

    } catch (error) {
      console.error(`  ✗ Batch failed:`, error.message);
      totalFailed += batch.length;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n=================================');
  console.log('IMPORT COMPLETE!');
  console.log('=================================');
  console.log(`✓ Successfully imported: ${totalSuccess} motions`);
  console.log(`✗ Failed: ${totalFailed} motions`);

  if (allErrors.length > 0) {
    console.log('\n⚠ Failed imports (first 20):');
    allErrors.slice(0, 20).forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.name.substring(0, 60)}`);
      console.log(`     Error: ${err.error}`);
    });
    if (allErrors.length > 20) {
      console.log(`  ... and ${allErrors.length - 20} more errors`);
    }
  }

  console.log('\n✅ Motion library is now populated!');
  console.log('Click the Library button in the toolbar to browse all motions.');

  return { totalSuccess, totalFailed, allErrors, motionList };
}

console.log('=================================');
console.log('FERACO MOTION IMPORT READY');
console.log('=================================');
console.log('This will import 2001 humanoid motion CSV files');
console.log('');
console.log('Categories:');
console.log('  • 217 basic movements → walking');
console.log('  • 102 combat & tactical → combat');
console.log('  • 301 daily life → other');
console.log('  • 46 dance & performance → dance');
console.log('  • 350 object/tool use → manipulation');
console.log('  • 179 occupational work → other');
console.log('  • 53 social & expressive → gestures');
console.log('  • 83 sports movements → sports');
console.log('  • 614 uncategorized → other');
console.log('  • 56 other → other');
console.log('');
console.log('To start import, run:');
console.log('  await importFeracoMotions()');
console.log('');
console.log('Import will take approximately 15-20 minutes');
console.log('=================================');

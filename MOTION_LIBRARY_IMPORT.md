# Motion Library Bulk Import Guide

This guide explains how to import your 2000+ CSV motion files into the motion library database.

## Option 1: Bulk Import from URL List (Recommended for Large Collections)

If your CSV files are hosted online, you can bulk import them using the browser console.

### Step 1: Prepare Your URL List

Create a JavaScript array with your motion data. Each motion should have:

```javascript
const motionList = [
  {
    name: 'Walking Forward Fast',
    url: 'https://example.com/motions/walk_forward_fast.csv',
    category: 'walking',           // walking, running, sports, dance, combat, gestures, manipulation, poses, vehicles, other
    difficulty: 'medium',          // easy, medium, hard (optional)
    isFeatured: false,             // true/false (optional)
    thumbnailUrl: null,            // URL to preview image (optional)
    description: 'Fast forward walking motion for humanoid robots',
    tags: ['humanoid', 'fast', 'forward', 'locomotion']
  },
  {
    name: 'Running Sprint',
    url: 'https://example.com/motions/run_sprint.csv',
    category: 'running',
    difficulty: 'hard',
    isFeatured: true,
    description: 'High-speed sprint motion',
    tags: ['humanoid', 'sprint', 'fast', 'running']
  }
  // ... add all your motions
];
```

### Step 2: Import Using Browser Console

1. Open your application in the browser
2. Open the browser console (F12 or Cmd+Option+J on Mac)
3. Paste your motion list array
4. Run the import:

```javascript
// Import your custom list
const results = await BulkMotionImporter.importFromURLList(motionList);

// Check results
console.log('Import complete:', results);
console.log('Success:', results.success);
console.log('Failed:', results.failed);
console.log('Errors:', results.errors);
```

### Step 3: Import Built-in Motions (Example)

To import the motions included in the public folder:

```javascript
const results = await BulkMotionImporter.importFromPublicFolder();
```

## Option 2: Manual Upload via UI

For smaller collections or individual files:

1. Click the **Upload** button in the toolbar
2. Fill in the form for each motion:
   - Select CSV file
   - Enter name
   - Choose category
   - Add optional metadata (difficulty, description, tags, thumbnail)
3. Click **Upload Motion**

## Categories

Use these standard categories for consistency:

- `walking` - Walking gaits and locomotion
- `running` - Running and jogging motions
- `sports` - Athletic movements (jumping, kicking, etc.)
- `dance` - Dance movements
- `combat` - Fighting and martial arts moves
- `gestures` - Hand and body gestures
- `manipulation` - Object manipulation tasks
- `poses` - Static poses and stances
- `vehicles` - Vehicle motions (cars, etc.)
- `other` - Miscellaneous motions

## Tips for Large Imports

### Batch Processing

For 2000+ files, process in batches:

```javascript
// Split into batches of 100
const batchSize = 100;
for (let i = 0; i < motionList.length; i += batchSize) {
  const batch = motionList.slice(i, i + batchSize);
  console.log(`Processing batch ${i / batchSize + 1}...`);
  const results = await BulkMotionImporter.importFromURLList(batch);
  console.log(`Batch complete: ${results.success} success, ${results.failed} failed`);

  // Small delay between batches
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Hosting Your CSV Files

If your CSV files are local, you need to host them somewhere accessible via URL:

1. **GitHub**: Upload to a GitHub repository and use raw URLs
2. **Cloud Storage**: Use AWS S3, Google Cloud Storage, or similar
3. **CDN**: Use a CDN service for faster downloads
4. **Local Server**: Run a simple HTTP server locally

Example using Python's HTTP server:
```bash
cd /path/to/your/csv/files
python3 -m http.server 8000
```

Then use URLs like: `http://localhost:8000/motion_file.csv`

### Auto-generating the Motion List

If you have consistent naming conventions, generate the list programmatically:

```javascript
// Example: Generate list from numbered files
const motionList = [];
for (let i = 1; i <= 2000; i++) {
  motionList.push({
    name: `Motion ${i}`,
    url: `https://example.com/motions/motion_${i.toString().padStart(4, '0')}.csv`,
    category: 'other',
    tags: ['imported']
  });
}
```

## Browsing the Library

After import:

1. Click the **Library** button in the toolbar
2. Use category filters or search to find motions
3. Click any motion card to load it into your robot
4. The motion will play automatically

## Database Schema

Motions are stored with these fields:

- `name` (required): Display name
- `category` (required): Category from list above
- `file_url` (required): Public URL to CSV file
- `duration`: Calculated from CSV automatically
- `frame_count`: Calculated from CSV automatically
- `difficulty`: easy, medium, or hard
- `is_featured`: Boolean for featured motions
- `thumbnail_url`: Optional preview image
- `description`: Optional text description
- `tags`: Array of searchable tags
- `created_at`: Auto-generated timestamp

## Troubleshooting

### Import Fails with CORS Error

Your CSV hosting needs to allow CORS. Add these headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```

### Import is Slow

- Use a CDN for hosting CSV files
- Process in smaller batches
- Ensure good network connection

### CSV Format Not Recognized

Ensure your CSV files match the expected format:
- First column: timestamp or frame number
- Following columns: joint angles
- Header row with joint names (optional but recommended)

## Example Complete Import Script

```javascript
// Complete example for importing 2000+ motions
const BASE_URL = 'https://your-cdn.com/motions/';

// Generate motion list
const motionList = [];
const categories = ['walking', 'running', 'jumping', 'turning'];

for (let i = 1; i <= 2000; i++) {
  const categoryIndex = (i - 1) % categories.length;
  motionList.push({
    name: `Motion ${i}`,
    url: `${BASE_URL}motion_${i.toString().padStart(4, '0')}.csv`,
    category: categories[categoryIndex],
    tags: [categories[categoryIndex], 'humanoid', 'g1'],
    description: `Auto-imported motion ${i}`
  });
}

// Import in batches
console.log(`Starting import of ${motionList.length} motions...`);
const batchSize = 50;
let totalSuccess = 0;
let totalFailed = 0;

for (let i = 0; i < motionList.length; i += batchSize) {
  const batch = motionList.slice(i, i + batchSize);
  const batchNum = Math.floor(i / batchSize) + 1;
  const totalBatches = Math.ceil(motionList.length / batchSize);

  console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} motions)...`);

  const results = await BulkMotionImporter.importFromURLList(batch);
  totalSuccess += results.success;
  totalFailed += results.failed;

  console.log(`  ✓ ${results.success} imported, ✗ ${results.failed} failed`);

  // Small delay between batches
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('\n=== FINAL RESULTS ===');
console.log(`Total imported: ${totalSuccess}`);
console.log(`Total failed: ${totalFailed}`);
console.log('Import complete!');
```

## Next Steps

After importing your motions:

1. Browse the library using the **Library** button
2. Use filters and search to find specific motions
3. Click motions to load them instantly
4. Combine motions in the sequence builder
5. Create deployment plans with motion sequences

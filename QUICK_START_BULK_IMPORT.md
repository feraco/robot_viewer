# Quick Start: Bulk Import Your 2000+ CSV Motions

## The Easiest Way

1. **Host your CSV files** somewhere accessible via URL (GitHub, S3, CDN, or local server)

2. **Open the app** in your browser

3. **Open browser console** (Press F12 or right-click → Inspect → Console)

4. **Create your motion list**:

```javascript
// Just give me URLs to your CSV files
const myMotions = [
  {
    name: 'Motion 1',
    url: 'https://example.com/motion1.csv',
    category: 'walking',
    tags: ['walk']
  },
  {
    name: 'Motion 2',
    url: 'https://example.com/motion2.csv',
    category: 'running',
    tags: ['run']
  }
  // ... repeat for all 2000+
];
```

5. **Import them**:

```javascript
// Import in batches of 50
for (let i = 0; i < myMotions.length; i += 50) {
  const batch = myMotions.slice(i, i + 50);
  console.log(`Batch ${i/50 + 1}...`);
  await BulkMotionImporter.importFromURLList(batch);
  await new Promise(r => setTimeout(r, 500)); // Small delay
}
```

## If You Have Numbered Files

If your files are like `motion_0001.csv`, `motion_0002.csv`, etc.:

```javascript
const motions = [];
for (let i = 1; i <= 2000; i++) {
  motions.push({
    name: `Motion ${i}`,
    url: `https://your-server.com/motions/motion_${i.toString().padStart(4, '0')}.csv`,
    category: 'other',
    tags: ['imported']
  });
}

// Import
for (let i = 0; i < motions.length; i += 50) {
  const batch = motions.slice(i, i + 50);
  await BulkMotionImporter.importFromURLList(batch);
  await new Promise(r => setTimeout(r, 500));
}
```

## Categories to Use

Pick from these:
- `walking` - Walking motions
- `running` - Running motions
- `sports` - Athletic movements
- `dance` - Dance moves
- `combat` - Fighting moves
- `gestures` - Hand/body gestures
- `manipulation` - Object handling
- `poses` - Static poses
- `vehicles` - Vehicle motions
- `other` - Everything else

## What You Get

After import:
- Click **Library** button to browse all motions
- Filter by category
- Search by name or tags
- Click any motion to load it instantly
- No sign-in required
- All motions public and shared

## Just Send Me Your URLs

Simply provide:
1. A list of URLs to your CSV files
2. What category each belongs to (or I can set them all to 'other')
3. Any naming pattern you're using

I can generate the complete import script for you!

Format can be as simple as:
```
motion1.csv -> walking
motion2.csv -> running
motion3.csv -> sports
...
```

Or just:
```
All files at: https://example.com/motions/
Pattern: motion_0001.csv through motion_2000.csv
Category: walking
```

## Alternative: Manual Upload UI

For small batches, use the Upload button in the toolbar:
1. Click **Upload** button
2. Select CSV file
3. Enter name and category
4. Click Upload Motion

But for 2000+ files, bulk import via console is much faster!

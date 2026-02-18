import { MotionLibraryService } from '../services/MotionLibraryService.js';
import { supabase, isSupabaseEnabled } from './SupabaseClient.js';

export class BulkMotionImporter {
  static async importFromURLList(urlList) {
    if (!isSupabaseEnabled()) {
      console.error('Supabase is not configured');
      return { success: 0, failed: 0, errors: [] };
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      imported: []
    };

    console.log(`Starting bulk import of ${urlList.length} motions...`);

    for (let i = 0; i < urlList.length; i++) {
      const item = urlList[i];
      const progress = `[${i + 1}/${urlList.length}]`;

      try {
        console.log(`${progress} Importing: ${item.name}`);

        const response = await fetch(item.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvText = await response.text();
        const metadata = await MotionLibraryService.parseCSVMetadata(csvText);

        const motionData = {
          name: item.name,
          category: item.category || 'other',
          file_url: item.url,
          duration: metadata.duration,
          difficulty: item.difficulty || null,
          is_featured: item.isFeatured || false,
          thumbnail_url: item.thumbnailUrl || null,
          description: item.description || null,
          tags: item.tags || [],
          frame_count: metadata.frameCount,
          created_by: null
        };

        const { data, error } = await supabase
          .from('motion_library')
          .insert([motionData])
          .select()
          .maybeSingle();

        if (error) throw error;

        results.success++;
        results.imported.push({ name: item.name, id: data.id });
        console.log(`${progress} ✓ Successfully imported: ${item.name}`);

      } catch (error) {
        results.failed++;
        results.errors.push({
          name: item.name,
          url: item.url,
          error: error.message
        });
        console.error(`${progress} ✗ Failed to import ${item.name}:`, error.message);
      }

      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n=== Bulk Import Complete ===');
    console.log(`✓ Success: ${results.success}`);
    console.log(`✗ Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\nFailed imports:');
      results.errors.forEach(err => {
        console.log(`  - ${err.name}: ${err.error}`);
      });
    }

    return results;
  }

  static async importFromPublicFolder() {
    const publicMotions = [
      {
        name: 'Car - Forward',
        url: '/car_forward.csv',
        category: 'vehicles',
        tags: ['car', 'forward'],
        description: 'Car moving forward motion'
      },
      {
        name: 'Car - Backward',
        url: '/car_backward.csv',
        category: 'vehicles',
        tags: ['car', 'backward'],
        description: 'Car moving backward motion'
      },
      {
        name: 'Car - Turn Left',
        url: '/car_turn_left.csv',
        category: 'vehicles',
        tags: ['car', 'turn', 'left'],
        description: 'Car turning left motion'
      },
      {
        name: 'Car - Turn Right',
        url: '/car_turn_right.csv',
        category: 'vehicles',
        tags: ['car', 'turn', 'right'],
        description: 'Car turning right motion'
      },
      {
        name: 'G1 - Stand',
        url: '/g1_stand.csv',
        category: 'poses',
        tags: ['g1', 'stand', 'humanoid'],
        description: 'G1 humanoid robot standing pose',
        isFeatured: true
      },
      {
        name: 'G1 - Walk Forward',
        url: '/g1_walk_forward.csv',
        category: 'walking',
        tags: ['g1', 'walk', 'forward', 'humanoid'],
        description: 'G1 humanoid robot walking forward',
        isFeatured: true
      },
      {
        name: 'G1 - Walk Backward',
        url: '/g1_walk_backward.csv',
        category: 'walking',
        tags: ['g1', 'walk', 'backward', 'humanoid'],
        description: 'G1 humanoid robot walking backward'
      },
      {
        name: 'G1 - Turn Left',
        url: '/g1_turn_left.csv',
        category: 'walking',
        tags: ['g1', 'turn', 'left', 'humanoid'],
        description: 'G1 humanoid robot turning left'
      },
      {
        name: 'G1 - Turn Right',
        url: '/g1_turn_right.csv',
        category: 'walking',
        tags: ['g1', 'turn', 'right', 'humanoid'],
        description: 'G1 humanoid robot turning right'
      },
      {
        name: 'G1 - Sidestep Left',
        url: '/g1_sidestep_left.csv',
        category: 'walking',
        tags: ['g1', 'sidestep', 'left', 'humanoid'],
        description: 'G1 humanoid robot sidestepping left'
      },
      {
        name: 'G1 - Sidestep Right',
        url: '/g1_sidestep_right.csv',
        category: 'walking',
        tags: ['g1', 'sidestep', 'right', 'humanoid'],
        description: 'G1 humanoid robot sidestepping right'
      }
    ];

    console.log('Importing motions from public folder...');
    return await this.importFromURLList(publicMotions);
  }

  static createTemplateForURLList() {
    return [
      {
        name: 'Motion Name',
        url: 'https://example.com/motion.csv',
        category: 'walking',
        difficulty: 'easy',
        isFeatured: false,
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        description: 'Description of the motion',
        tags: ['tag1', 'tag2', 'tag3']
      }
    ];
  }
}

if (typeof window !== 'undefined') {
  window.BulkMotionImporter = BulkMotionImporter;
}

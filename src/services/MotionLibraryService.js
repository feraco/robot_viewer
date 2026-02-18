import { supabase, isSupabaseEnabled } from '../utils/SupabaseClient.js';

export class MotionLibraryService {
  static async uploadMotionFile(file, userId) {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not configured');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('motion-files')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('motion-files')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  static async uploadThumbnail(file, userId) {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not configured');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('motion-thumbnails')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('motion-thumbnails')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  static async createMotionEntry(motionData) {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('motion_library')
      .insert([motionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAllMotions() {
    if (!isSupabaseEnabled()) {
      return [];
    }

    const { data, error } = await supabase
      .from('motion_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getMotionsByCategory(category) {
    if (!isSupabaseEnabled()) {
      return [];
    }

    const { data, error } = await supabase
      .from('motion_library')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async searchMotions(searchTerm) {
    if (!isSupabaseEnabled()) {
      return [];
    }

    const { data, error } = await supabase
      .from('motion_library')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFeaturedMotions() {
    if (!isSupabaseEnabled()) {
      return [];
    }

    const { data, error } = await supabase
      .from('motion_library')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateMotion(id, updates) {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('motion_library')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteMotion(id) {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase
      .from('motion_library')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async parseCSVMetadata(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const frameCount = lines.length - 1;

    let duration = 0;
    if (frameCount > 0) {
      const firstDataLine = lines[1].split(',');
      const lastDataLine = lines[lines.length - 1].split(',');
      if (firstDataLine.length > 0 && lastDataLine.length > 0) {
        const startTime = parseFloat(firstDataLine[0]) || 0;
        const endTime = parseFloat(lastDataLine[0]) || 0;
        duration = endTime - startTime;
      }
    }

    return {
      frameCount,
      duration: duration > 0 ? duration : frameCount / 30
    };
  }
}

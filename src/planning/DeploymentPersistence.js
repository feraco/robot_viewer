import { getDefaultMissions } from './MissionDatasets.js';

export class DeploymentPersistence {
  constructor() {
    this._supabase = null;
  }

  async _getClient() {
    if (this._supabase) return this._supabase;

    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    this._supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    return this._supabase;
  }

  async savePlan(name, waypoints, compiledCommands, estimatedDuration, options = {}) {
    const supabase = await this._getClient();
    const row = {
      name,
      waypoints,
      compiled_commands: compiledCommands.map(c => c.toJSON ? c.toJSON() : c),
      estimated_duration: estimatedDuration
    };
    if (options.is_template) row.is_template = true;
    if (options.description) row.description = options.description;

    const { data, error } = await supabase
      .from('deployment_plans')
      .insert(row)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async loadPlans() {
    const supabase = await this._getClient();
    const { data, error } = await supabase
      .from('deployment_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async deletePlan(planId) {
    const supabase = await this._getClient();
    const { error } = await supabase
      .from('deployment_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
  }

  async saveRun(planId, actualTrail, perWaypointError, totalTime, status) {
    const supabase = await this._getClient();
    const { data, error } = await supabase
      .from('deployment_runs')
      .insert({
        plan_id: planId,
        actual_trail: actualTrail,
        per_waypoint_error: perWaypointError,
        total_time: totalTime,
        status
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getRunsForPlan(planId) {
    const supabase = await this._getClient();
    const { data, error } = await supabase
      .from('deployment_runs')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async seedDefaultMissions() {
    const supabase = await this._getClient();
    const { data: existing } = await supabase
      .from('deployment_plans')
      .select('id')
      .eq('is_template', true)
      .limit(1);

    if (existing && existing.length > 0) return;

    const missions = getDefaultMissions();
    const rows = missions.map(m => ({
      name: m.name,
      description: m.description,
      waypoints: m.waypoints,
      compiled_commands: m.compiled_commands,
      estimated_duration: m.estimated_duration,
      is_template: true
    }));

    const { error } = await supabase
      .from('deployment_plans')
      .insert(rows);

    if (error) {
      console.warn('Failed to seed default missions:', error.message);
    }
  }
}

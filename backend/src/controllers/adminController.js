import { query } from '../utils/database.js';

/**
 * Get counts for admin dashboard
 * GET /api/v1/admin/stats
 */
export async function getStats(req, res) {
  try {
    // Run parallel COUNT queries
    const queries = {
      devices: 'SELECT COUNT(*)::int AS count FROM devices',
      problems: 'SELECT COUNT(*)::int AS count FROM problems',
      steps: 'SELECT COUNT(*)::int AS count FROM diagnostic_steps',
      sessions: 'SELECT COUNT(*)::int AS count FROM diagnostic_sessions',
      remotes: 'SELECT COUNT(*)::int AS count FROM remotes',
      tv_interfaces: 'SELECT COUNT(*)::int AS count FROM tv_interfaces',
      users: 'SELECT COUNT(*)::int AS count FROM users',
    };

    const promises = Object.entries(queries).map(async ([key, sql]) => {
      const r = await query(sql);
      return [key, r.rows[0]?.count || 0];
    });

    const results = await Promise.all(promises);
    const data = Object.fromEntries(results);

    return res.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in getStats:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default { getStats };

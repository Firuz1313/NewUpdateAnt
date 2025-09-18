import database from '../src/utils/database.js';

(async () => {
  try {
    console.log('🔧 Unmarking migration 002_add_indexes.sql...');
    const res = await database.query("DELETE FROM migrations WHERE filename = $1 RETURNING filename", ['002_add_indexes.sql']);
    if (res && res.rowCount > 0) {
      console.log('✅ Unmarked migration:', res.rows.map(r=>r.filename).join(', '));
    } else {
      console.log('ℹ️ Migration row not found, nothing to delete');
    }
    await database.closePool();
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed to unmark migration:', e && e.message ? e.message : e);
    try { await database.closePool(); } catch {};
    process.exit(1);
  }
})();

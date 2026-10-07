import cron from 'node-cron';

import { db } from '../services/db.service';

export function startCronJobs() {
  console.log('[Cron] Starting scheduler...');

  // 1. Every 30s: expire stale match_requests
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await db.query(
        `UPDATE match_requests SET status = 'expired' WHERE expires_at < now() AND status = 'pending'`
      );
    } catch (err) {
      console.error('[Cron] Error expiring requests', err);
    }
  });

  // 2. Every 30 min: close temporary conversations past expires_at
  cron.schedule('*/30 * * * *', async () => {
    try {
      await db.query(`UPDATE conversations SET status = 'expired' WHERE expires_at < now() AND status = 'active'`);
    } catch (err) {
      console.error('[Cron] Error expiring conversations', err);
    }
  });

  // 3. Every 5 min: detect no-shows
  cron.schedule('*/5 * * * *', () => {
    // console.log('[Cron] Detecting session no-shows...');
    // Implementation to follow in Phase 6
  });

  // 4. Nightly: recompute all accountability_scores (run at midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[Cron] Recomputing accountability scores...');
      await db.query(`
        WITH FocusStats AS (
          SELECT user_id, 
                 SUM(duration_min) AS total_attempted,
                 SUM(CASE WHEN completed THEN duration_min ELSE 0 END) AS total_completed
          FROM focus_timers
          GROUP BY user_id
        ),
        EventStats AS (
          SELECT user_id, SUM(points_delta) AS points
          FROM accountability_events
          GROUP BY user_id
        )
        INSERT INTO accountability_scores (user_id, reliability, focus_ratio, score, updated_at)
        SELECT 
          u.id,
          GREATEST(0, LEAST(100, 100 + COALESCE(e.points, 0))) AS reliability,
          COALESCE(ROUND((f.total_completed::NUMERIC / NULLIF(f.total_attempted, 0)), 4), 1.0000) AS focus_ratio,
          ROUND(0.6 * GREATEST(0, LEAST(100, 100 + COALESCE(e.points, 0))) + 
                0.4 * (100 * COALESCE(ROUND((f.total_completed::NUMERIC / NULLIF(f.total_attempted, 0)), 4), 1.0000)))::INT AS score,
          now()
        FROM users u
        LEFT JOIN FocusStats f ON u.id = f.user_id
        LEFT JOIN EventStats e ON u.id = e.user_id
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          reliability = EXCLUDED.reliability,
          focus_ratio = EXCLUDED.focus_ratio,
          score = EXCLUDED.score,
          updated_at = EXCLUDED.updated_at;
      `);
    } catch (err) {
      console.error('[Cron] Error recomputing scores', err);
    }
  });
}

import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db.service';

export const completeSession = async (req: Request, res: Response, next: NextFunction) => {
  const client = await db.connect();
  try {
    const { id } = req.params;
    const { userId } = req.body; // In real app, from JWT

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await client.query('BEGIN');

    // Mark session as completed
    await client.query(
      `UPDATE study_sessions SET status = 'completed', actual_end_at = now() WHERE id = $1 AND status = 'active'`,
      [id]
    );

    // Give accountability points
    await client.query(
      `INSERT INTO accountability_events (user_id, event_type, points_delta, session_id) 
       VALUES ($1, 'session_completed', 10, $2)`,
      [userId, id]
    );

    // Make user active again (or at least remove them from active session, spec says they manually toggle it back, but let's keep them inactive until they toggle)
    
    await client.query('COMMIT');
    res.json({ message: 'Session completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const recordFocusTimer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id, type, duration_min, completed, userId, started_at } = req.body;

    if (!userId || !session_id || !type || typeof duration_min !== 'number' || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Missing required focus timer fields' });
    }

    await db.query(
      `INSERT INTO focus_timers (user_id, session_id, type, started_at, ended_at, duration_min, completed)
       VALUES ($1, $2, $3, $4, now(), $5, $6)`,
      [userId, session_id, type, started_at || new Date(), duration_min, completed]
    );

    res.json({ message: 'Focus timer recorded' });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db.service';

export const getPool = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Return all active users (mock filtering for MVP)
    const result = await db.query(
      `SELECT u.id, u.full_name, u.department, u.graduation_year, s.score, s.reliability
       FROM users u
       LEFT JOIN accountability_scores s ON u.id = s.user_id
       WHERE u.is_active = true`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const createMatchRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sender_id, receiver_id, message } = req.body;
    
    if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: 'sender_id and receiver_id required' });
    }

    const expiresAt = new Date(Date.now() + 120 * 1000); // 120 seconds

    const result = await db.query(
      `INSERT INTO match_requests (sender_id, receiver_id, message, status, expires_at)
       VALUES ($1, $2, $3, 'pending', $4) RETURNING *`,
      [sender_id, receiver_id, message || null, expiresAt]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const acceptMatchRequest = async (req: Request, res: Response, next: NextFunction) => {
  const client = await db.connect();
  try {
    const { id } = req.params; // request id
    const { receiver_id } = req.body; // who is accepting

    if (!receiver_id) return res.status(400).json({ error: 'receiver_id is required' });

    await client.query('BEGIN');

    // 1. Lock receiver
    const userRes = await client.query(
      `SELECT is_active FROM users WHERE id = $1 FOR UPDATE`,
      [receiver_id]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You are no longer marked as active' });
    }

    // 2. Accept request
    const updateReq = await client.query(
      `UPDATE match_requests 
       SET status = 'accepted', responded_at = now() 
       WHERE id = $1 AND status = 'pending' RETURNING sender_id`,
      [id]
    );

    if (updateReq.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Request is no longer pending or expired' });
    }

    const sender_id = updateReq.rows[0].sender_id;

    // 3. Update users to inactive
    await client.query(
      `UPDATE users SET is_active = false WHERE id IN ($1, $2)`,
      [sender_id, receiver_id]
    );

    // 4. Create Session
    const sessionRes = await client.query(
      `INSERT INTO study_sessions (type, scheduled_start_at, status) 
       VALUES ('pair', now(), 'active') RETURNING id`
    );
    const session_id = sessionRes.rows[0].id;

    // 5. Create Match
    await client.query(
      `INSERT INTO matches (user_a_id, user_b_id, session_id, status) VALUES ($1, $2, $3, 'active')`,
      [sender_id, receiver_id, session_id]
    );

    // 6. Create Chat Conversation (expires in 2 days)
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO conversations (type, connection_type, expires_at, session_id) 
       VALUES ('direct', 'temporary', $1, $2)`,
      [expiresAt, session_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Match accepted!', session_id });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const declineMatchRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await db.query(
      `UPDATE match_requests SET status = 'rejected', responded_at = now() WHERE id = $1 AND status = 'pending'`,
      [id]
    );
    res.json({ message: 'Match declined' });
  } catch (error) {
    next(error);
  }
};

export const getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query; // Mock user extraction
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const incoming = await db.query(
      `SELECT * FROM match_requests WHERE receiver_id = $1 AND status = 'pending'`,
      [userId]
    );
    const outgoing = await db.query(
      `SELECT * FROM match_requests WHERE sender_id = $1 AND status = 'pending'`,
      [userId]
    );

    res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
  } catch (error) {
    next(error);
  }
};

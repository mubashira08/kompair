import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db.service';

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // In a real app we fetch conversation by sessionId and then messages
    const conv = await db.query(`SELECT id FROM conversations WHERE session_id = $1`, [sessionId]);
    if (conv.rows.length === 0) return res.json([]);

    const msgs = await db.query(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conv.rows[0].id]
    );

    res.json(msgs.rows);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, senderId, content } = req.body;

    const conv = await db.query(`SELECT id FROM conversations WHERE session_id = $1`, [sessionId]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    const conversationId = conv.rows[0].id;

    const msg = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [conversationId, senderId, content]
    );

    res.json(msg.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const handlePostSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, action } = req.body; // action: 'keep' | 'expire'

    const conv = await db.query(`SELECT id FROM conversations WHERE session_id = $1`, [sessionId]);
    if (conv.rows.length === 0) return res.status(404).json({ error: 'Conversation not found' });
    const conversationId = conv.rows[0].id;

    if (action === 'expire') {
      await db.query(`UPDATE conversations SET status = 'expired' WHERE id = $1`, [conversationId]);
    } else {
      // Keep for 2 days
      const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      await db.query(`UPDATE conversations SET expires_at = $1 WHERE id = $2`, [expiresAt, conversationId]);
    }

    res.json({ message: `Conversation marked as ${action}` });
  } catch (error) {
    next(error);
  }
};

export const getActiveChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Join to find active conversations for this user
    const result = await db.query(
      `SELECT c.id as conversation_id, c.session_id, c.expires_at, 
              u.id as partner_id, u.full_name as partner_name
       FROM conversations c
       JOIN matches m ON c.session_id = m.session_id
       JOIN users u ON (u.id = m.user_a_id OR u.id = m.user_b_id) AND u.id != $1
       WHERE (m.user_a_id = $1 OR m.user_b_id = $1)
         AND c.expires_at > now()
         AND c.status = 'active'`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db.service';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query; // Assuming user ID is passed or available from auth middleware
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const notifications = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    res.json(notifications.rows);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE notifications SET read_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const subscribePush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, subscription, platform } = req.body;
    if (!userId || !subscription) return res.status(400).json({ error: 'userId and subscription required' });

    // Assuming subscription is a JSON object
    await db.query(
      `INSERT INTO user_devices (user_id, device_token, platform, last_seen_at) 
       VALUES ($1, $2, $3, now())`,
      [userId, JSON.stringify(subscription), platform || 'web']
    );

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    next(error);
  }
};

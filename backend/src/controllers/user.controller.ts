import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db.service';

export const updateActiveStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real app, userId comes from the verified JWT in req.user
    // For now, we mock it or expect it in the body for testing
    const { is_active, userId } = req.body;
    
    if (typeof is_active !== 'boolean' || !userId) {
      return res.status(400).json({ error: 'is_active boolean and userId are required' });
    }

    await db.query(
      `UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2`,
      [is_active, userId]
    );

    res.json({ message: `Active status set to ${is_active}` });
  } catch (error) {
    next(error);
  }
};

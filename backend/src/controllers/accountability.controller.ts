import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db.service';

export const getMyScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query; // Mocked from query for now, usually req.user.userId
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const result = await db.query(
      `SELECT * FROM accountability_scores WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Default score
      return res.json({ reliability: 100, focus_ratio: 1.0, score: 100 });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

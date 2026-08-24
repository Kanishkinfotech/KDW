import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export const uploadFile = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const type = req.body.type || 'general';
    const filePath = `/uploads/${type}/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      url: filePath
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};

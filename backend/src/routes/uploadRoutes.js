/**
 * File Upload Routes
 * Handle image, invoice, and receipt uploads
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath;
    
    if (file.fieldname === 'image') {
      uploadPath = path.join(__dirname, '../../uploads/images');
    } else if (file.fieldname === 'invoice') {
      uploadPath = path.join(__dirname, '../../uploads/invoices');
    } else if (file.fieldname === 'receipt') {
      uploadPath = path.join(__dirname, '../../uploads/receipts');
    } else {
      uploadPath = path.join(__dirname, '../../uploads');
    }
    
    // Ensure directory exists
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (err) {
      console.error('Error creating upload directory:', err);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|jpeg|jpg|png/;
  
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (file.fieldname === 'image') {
    if (allowedImageTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  } else if (file.fieldname === 'invoice' || file.fieldname === 'receipt') {
    if (allowedDocTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed for documents'));
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// POST /api/upload/image - Upload property/guest image
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const fileUrl = `/uploads/images/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Image uploaded successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/upload/invoice - Upload invoice
router.post('/invoice', upload.single('invoice'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No invoice file provided'
      });
    }
    
    const fileUrl = `/uploads/invoices/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Invoice uploaded successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/upload/receipt - Upload receipt
router.post('/receipt', upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file provided'
      });
    }
    
    const fileUrl = `/uploads/receipts/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Receipt uploaded successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload receipt',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }
    
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/upload/:type/:filename - Delete uploaded file
router.delete('/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    const validTypes = ['images', 'invoices', 'receipts'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type'
      });
    }
    
    const filePath = path.join(__dirname, '../../uploads', type, filename);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

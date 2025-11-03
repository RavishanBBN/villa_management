const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  images: './uploads/images',
  invoices: './uploads/invoices',
  receipts: './uploads/receipts',
  temp: './uploads/temp'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created upload directory: ${dir}`);
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on fieldname
    let uploadPath = uploadDirs.temp;
    
    if (file.fieldname === 'passportPhotos' || file.fieldname === 'propertyImages') {
      uploadPath = uploadDirs.images;
    } else if (file.fieldname === 'invoiceFile') {
      uploadPath = uploadDirs.invoices;
    } else if (file.fieldname === 'receiptFile') {
      uploadPath = uploadDirs.receipts;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedName}_${uniqueSuffix}${ext}`);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  // Allowed document types
  const documentTypes = /pdf|doc|docx|xls|xlsx/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  // Check based on field name
  if (file.fieldname === 'passportPhotos' || file.fieldname === 'propertyImages') {
    // Validate image files
    if (imageTypes.test(extname) && mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed for ${file.fieldname}. Allowed: JPG, PNG, GIF, WEBP`));
    }
  } else if (file.fieldname === 'invoiceFile' || file.fieldname === 'receiptFile') {
    // Validate document files
    if (documentTypes.test(extname) || mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Only PDF and document files are allowed for ${file.fieldname}`));
    }
  } else {
    // Allow all for unknown fields (can be restricted)
    cb(null, true);
  }
};

// Upload configurations
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// Specific upload middleware
const uploadSingle = upload.single('file');
const uploadMultiple = upload.array('files', 10);
const uploadPassportPhotos = upload.array('passportPhotos', 5);
const uploadInvoice = upload.single('invoiceFile');
const uploadReceipt = upload.single('receiptFile');
const uploadPropertyImages = upload.array('propertyImages', 20);

// Upload fields for expenses (invoice + receipt)
const uploadExpenseFiles = upload.fields([
  { name: 'invoiceFile', maxCount: 1 },
  { name: 'receiptFile', maxCount: 1 }
]);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        maxSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024}MB`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadPassportPhotos,
  uploadInvoice,
  uploadReceipt,
  uploadPropertyImages,
  uploadExpenseFiles,
  handleUploadError
};

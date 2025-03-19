const cloudinary = require('cloudinary').v2;
const multer  = require('multer');
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", 'image/avif'];
const upload = multer({
    fileFilter: function fileFilter (req, file, cb) {
        if (imageMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
    limits: {
        files: 1,
        fileSize: 10000000 // 10MB
    }
});

cloudinary.config({
    secure: true
});


module.exports = {upload, cloudinary}




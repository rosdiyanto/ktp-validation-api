const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const app = express();

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const MIN_FILE_SIZE = 200 * 1024; // 200 KB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

// Middleware pengecekan API key, namanya apiKeyMiddleware
function apiKeyMiddleware(req, res, next) {
    const apiKeyHeader = req.header('x-api-key');
    if (!apiKeyHeader || apiKeyHeader !== API_KEY) {
        return res.status(401).json({ status: false, message: ['Unauthorized: API key missing or invalid'] });
    }
    next();
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Ekstensi file tidak diizinkan'));
        }
    }
});

app.post('/validate-ktp', apiKeyMiddleware, (req, res) => {
    upload.single('ktpImage')(req, res, async function (err) {
        let errorMessages = [];
        let isValid = true;

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                errorMessages.push('Ukuran gambar melebihi batas maksimal 1024 KB');
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                errorMessages.push('Ekstensi file tidak diizinkan');
            } else {
                errorMessages.push('Terjadi kesalahan upload');
            }

            return res.status(400).json({ status: false, message: errorMessages });
        }

        if (!req.file) {
            return res.status(400).json({
                status: false,
                message: ['Gambar KTP harus diupload']
            });
        }

        if (!req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({
                status: false,
                message: ['Gambar tidak dapat diproses. File kosong atau tidak valid.']
            });
        }

        if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
            errorMessages.push('Ekstensi file tidak diizinkan');
            isValid = false;
        }

        if (req.file.size < MIN_FILE_SIZE) {
            errorMessages.push('Ukuran gambar terlalu kecil. Minimal 200 KB');
            isValid = false;
        }

        try {
            const imageBuffer = req.file.buffer;
            const metadata = await sharp(imageBuffer).metadata();

            const minWidth = 600;
            const minHeight = 400;

            if (metadata.width < minWidth || metadata.height < minHeight) {
                errorMessages.push(`Dimensi gambar terlalu kecil. Minimal ${minWidth}x${minHeight}px`);
                isValid = false;
            }

            const smallImage = await sharp(imageBuffer)
                .resize(100, 100, { fit: 'inside' })
                .greyscale()
                .raw()
                .toBuffer();

            const totalBrightness = smallImage.reduce((sum, val) => sum + val, 0);
            const avgBrightness = totalBrightness / smallImage.length;

            if (avgBrightness < 60) {
                errorMessages.push('Gambar terlalu gelap');
                isValid = false;
            } else if (avgBrightness > 200) {
                errorMessages.push('Gambar terlalu terang');
                isValid = false;
            }

            const aspectRatio = metadata.width / metadata.height;
            if (aspectRatio < 1.4 || aspectRatio > 1.6) {
                errorMessages.push('Orientasi gambar kemungkinan miring atau tidak proporsional');
                isValid = false;
            }

            return res.json({
                status: isValid,
                message: isValid ? ['Validasi berhasil'] : errorMessages
            });
        } catch (error) {
            console.error('ERROR SHARP:', error.message);
            return res.status(400).json({
                status: false,
                message: ['File tidak valid atau gagal diproses sebagai gambar.']
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

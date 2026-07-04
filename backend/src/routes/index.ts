import { Router } from 'express';
import multer from 'multer';
import { getCurrentWeather, getIrrigationAdvice } from '../controllers/weatherController';
import { getCropRecommendation, detectDisease, getAiAdvisory } from '../controllers/aiController';
import { sendSMS, sendBulkAlerts } from '../controllers/smsController';

const router = Router();

// Multer for in-memory file uploads (disease detection images)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ─── Health Check ────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Kisan Alert API' });
});

// ─── Weather Routes ──────────────────────────────────────────────
router.get('/weather', getCurrentWeather);
router.post('/weather/irrigation', getIrrigationAdvice);

// ─── AI Routes ───────────────────────────────────────────────────
router.post('/ai/crop-recommendation', getCropRecommendation);
router.post('/ai/disease-detection', upload.single('image'), detectDisease);
router.post('/ai/advisory', getAiAdvisory);

// ─── SMS Routes ──────────────────────────────────────────────────
router.post('/sms/send', sendSMS);
router.post('/sms/bulk', sendBulkAlerts);

export default router;

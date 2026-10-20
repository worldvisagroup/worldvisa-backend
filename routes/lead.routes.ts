import { Router } from 'express';
import {
  handleLandingCapture,
  handleLandingAssessment,
} from '../controllers/lead.controller';

const router: Router = Router();

// ── Public landing page lead capture & assessment endpoints ───────────────────
router.post('/landing-capture', handleLandingCapture);
router.post('/landing-assessment', handleLandingAssessment);

export = router;

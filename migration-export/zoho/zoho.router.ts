import { Router } from 'express';
import { listZohoApplicationStatusHistoryHandler, listZohoSpouseSkillAssessmentsHandler, listZohoVisaApplicationsHandler } from './zoho.controller';

const router: Router = Router();

router.get('/visa-applications', listZohoVisaApplicationsHandler);
router.get('/spouse-skill-assessments', listZohoSpouseSkillAssessmentsHandler);
router.get('/application-status-history', listZohoApplicationStatusHistoryHandler);

export default router;

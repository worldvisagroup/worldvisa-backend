import type { NextFunction, Request, Response } from 'express';
import { sendValidationError } from '../shared/send-validation-error';
import { ZohoUnavailableError } from '../shared/zoho-read-client';
import { listZohoApplicationStatusHistoryCommand } from './usecases/list-zoho-application-status-history/list-zoho-application-status-history.command';
import { listZohoApplicationStatusHistory } from './usecases/list-zoho-application-status-history/list-zoho-application-status-history.usecase';
import { listZohoSpouseSkillAssessmentsCommand } from './usecases/list-zoho-spouse-skill-assessments/list-zoho-spouse-skill-assessments.command';
import { listZohoSpouseSkillAssessments } from './usecases/list-zoho-spouse-skill-assessments/list-zoho-spouse-skill-assessments.usecase';
import { listZohoVisaApplicationsCommand } from './usecases/list-zoho-visa-applications/list-zoho-visa-applications.command';
import { listZohoVisaApplications } from './usecases/list-zoho-visa-applications/list-zoho-visa-applications.usecase';

const handleError = (error: unknown, res: Response, next: NextFunction): void => {
  if (error instanceof ZohoUnavailableError) {
    res.status(503).json({ status: 'fail', message: error.message });
    return;
  }
  next(error);
};

export const listZohoVisaApplicationsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listZohoVisaApplicationsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listZohoVisaApplications(command.data));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const listZohoSpouseSkillAssessmentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listZohoSpouseSkillAssessmentsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listZohoSpouseSkillAssessments(command.data));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const listZohoApplicationStatusHistoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listZohoApplicationStatusHistoryCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listZohoApplicationStatusHistory(command.data));
  } catch (error) {
    handleError(error, res, next);
  }
};

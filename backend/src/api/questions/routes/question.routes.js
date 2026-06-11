import express from 'express';
import { searchQuestionsSemanticController, getSimilarQuestionsController } from '../controller/question.controller.js';
import { validateSearchQuestions, validateSimilarQuestions } from '../validations/question.validation.js';
import { authenticateUser } from '../../../middleware/authentication.js';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

const router = express.Router();

// Both endpoints are protected (Requires Bearer Token)
router.use(authenticateUser);

router.get(
  '/search',
  validateSearchQuestions,
  validationErrorHandler,
  searchQuestionsSemanticController
);

router.get(
  '/:questionHash/similar',
  validateSimilarQuestions,
  validationErrorHandler,
  getSimilarQuestionsController
);

export default router;

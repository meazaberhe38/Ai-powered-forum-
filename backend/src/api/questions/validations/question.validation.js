import { query, param } from 'express-validator';

export const validateSearchQuestions = [
  query('query')
    .isString()
    .withMessage('Query must be a string')
    .isLength({ min: 5 })
    .withMessage('Query must be at least 5 characters long'),
  
  query('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be an integer between 1 and 20'),
    
  query('threshold')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('threshold must be a float between 0 and 1'),
];

export const validateSimilarQuestions = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .isLength({ min: 16, max: 16 })
    .withMessage('Question hash must be exactly 16 characters long'),
    
  query('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be an integer between 1 and 20'),
    
  query('threshold')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('threshold must be a float between 0 and 1'),
];

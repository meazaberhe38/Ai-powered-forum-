import { StatusCodes } from 'http-status-codes';
import { searchQuestionsSemanticService, getSimilarQuestionsService } from '../service/question.service.js';

export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const { query } = req.query;
    const k = req.query.k ? parseInt(req.query.k, 10) : 5;
    const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 0.75;

    const data = await searchQuestionsSemanticService(query, k, threshold);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Semantic search completed successfully',
      data,
      meta: {
        total: data.length,
        k,
        threshold,
        query,
        questionHash: null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const k = req.query.k ? parseInt(req.query.k, 10) : 5;
    const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 0.75;

    const data = await getSimilarQuestionsService(questionHash, k, threshold);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Similar questions fetched successfully',
      data,
      meta: {
        total: data.length,
        k,
        threshold,
        query: null,
        questionHash
      }
    });
  } catch (error) {
    next(error);
  }
};

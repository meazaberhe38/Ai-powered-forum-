import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
// import questionRoutes from "./question/"; the main does not contain question.route.js
import answerRoutes from "./answer/routes/answer.route.js";

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);
// mainRouter.use("/questions", questionRoutes);
mainRouter.use("/answers", answerRoutes);

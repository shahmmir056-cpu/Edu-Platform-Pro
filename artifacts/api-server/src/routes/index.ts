import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiToolsRouter from "./ai-tools";
import classroomRouter from "./classroom";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiToolsRouter);
router.use(classroomRouter);
router.use(feedbackRouter);

export default router;

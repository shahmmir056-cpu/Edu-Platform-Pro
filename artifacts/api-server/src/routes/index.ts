import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiToolsRouter from "./ai-tools";
import feedbackRouter from "./feedback";
import pastPapersRouter from "./past-papers";
import debateMentorRouter from "./debate-mentor";
import ttsRouter from "./tts";
import whatsappRouter from "./whatsapp";
import emailRouter from "./email";
import testConductorRouter from "./test-conductor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiToolsRouter);
router.use(feedbackRouter);
router.use(pastPapersRouter);
router.use(debateMentorRouter);
router.use(ttsRouter);
router.use(whatsappRouter);
router.use(emailRouter);
router.use(testConductorRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import caseStudiesRouter from "./caseStudies";
import questionnairesRouter from "./questionnaires";
import projectsRouter from "./projects";
import chatRouter from "./chat";
import settingsRouter from "./settings";
import assistantRouter from "./assistant";
import uploadRouter from "./upload";
import documentsRouter from "./documents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(caseStudiesRouter);
router.use(questionnairesRouter);
router.use(projectsRouter);
router.use(chatRouter);
router.use(settingsRouter);
router.use(assistantRouter);
router.use(uploadRouter);
router.use(documentsRouter);

export default router;

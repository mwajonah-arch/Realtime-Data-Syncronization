import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import salesRouter from "./sales";
import stockUpdatesRouter from "./stockUpdates";
import transactionsRouter from "./transactions";
import activityLogRouter from "./activityLog";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/sales", salesRouter);
router.use("/stock-updates", stockUpdatesRouter);
router.use("/transactions", transactionsRouter);
router.use("/activity-log", activityLogRouter);

export default router;

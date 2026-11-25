import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"

import authRouter from "./routes/auth.routes.js"
import guestRouter from "./routes/guest.routes.js"
import attractionRouter from "./routes/attraction.routes.js"
import staffRouter from "./routes/staff.routes.js"
import shiftRouter from "./routes/shift.routes.js";

import { prisma } from "./lib/prisma.js"

const app = express()

app.use(helmet())

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
)

app.use(express.json())

app.use("/api/auth", authRouter) //npm run dev --workspace=@app/api
app.use("/api/guest", guestRouter)
app.use("/api/attractions", attractionRouter)
app.use("/api/staff", staffRouter)
app.use("/api/shifts", shiftRouter);

app.get("/api/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "SQP Queue API is running",
            database: "connected",
        })
    } catch (error) {
        console.error("Database health check failed:", error);

        res.status(503).json({
            success: false,
            message: "SQP Queue API is running, but database is unavailable",
            database: "disconnected",
        })
    }
})

export default app
import express from "express"
import cors from "cors"
import helmet from "helmet"

const app = express()

app.use(helmet())

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json())

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "SQP Queue API is running",
    })
})

export default app
import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./db/database";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "LaunchLock API",
    status: "running",
    database: db.open ? "connected" : "disconnected",
    version: "1.0.0"
  });
});

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LaunchLock API running on port ${PORT}`);
});

import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { runReservationExpiryChecks } from './modules/reservations/reservationExpiryJob.js';
import cron from 'node-cron';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173'];
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Start Application
const startServer = async () => {
  await connectDatabase();
  
  // Initial check on boot
  await runReservationExpiryChecks();
  
  // Daily cron scheduler (runs at 00:00 every day)
  cron.schedule('0 0 * * *', () => {
    console.log('[Cron] Running daily reservation expiry checks...');
    runReservationExpiryChecks();
  });
  
  server.listen(PORT, () => {
    console.log(`[Server] ERP Backend running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};
// Process Error Handling
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('[Process] Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

startServer();
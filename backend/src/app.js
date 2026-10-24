import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import studentsRoutes from './routes/students.routes.js';
import companiesRoutes from './routes/companies.routes.js';
import postingsRoutes from './routes/postings.routes.js';
import rankingsRoutes from './routes/rankings.routes.js';
import shortlistsRoutes from './routes/shortlists.routes.js';
import companyRankingsRoutes from './routes/companyRankings.routes.js';
import matchesRoutes from './routes/matches.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// CORS: FRONTEND_ORIGIN may list several origins separated by commas.
// In production it is required, so the API never silently accepts every origin.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',').map((o) => o.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('FRONTEND_ORIGIN must be set when NODE_ENV=production');
}
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', authRoutes);
app.use('/api', studentsRoutes);
app.use('/api', companiesRoutes);
app.use('/api', postingsRoutes);
app.use('/api', rankingsRoutes);
app.use('/api', shortlistsRoutes);
app.use('/api', companyRankingsRoutes);
app.use('/api', matchesRoutes);
app.use('/api', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  // Never leak database or internal details to clients in production.
  const message = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
  res.status(err.status || 500).json({ error: message });
});

// On Vercel the platform handles listening; locally we start our own server.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

export default app;

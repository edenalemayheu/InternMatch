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

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json());

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
  res.status(500).json({ error: err.message || 'Server error' });
});

// On Vercel the platform handles listening; locally we start our own server.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

export default app;

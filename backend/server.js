const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDB } = require('./database');
const requestsRouter = require('./routes/requests');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/requests', requestsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

initializeDB();
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));

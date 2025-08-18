const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const routes = require('./routes/index.routes');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS options example
const corsOptions = {
  origin: 'http://localhost:5173', // update with your frontend URL
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'yoursecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Connect to DB
connectDB();

// Routes
app.get('/test', (req, res) => res.send('Test route working'));
app.use('/api', routes);

// Error Handling
// app.use(errorHandler);

// Server Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import expenseRoutes from './routes/expenseRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import categoryRoutes from './routes/categoryRoutes';
import settingsRoutes from './routes/settingsRoutes';
import bankAccountRoutes from './routes/bankAccountRoutes';
import comparisonRoutes from './routes/comparisonRoutes';
import { errorHandler } from './middleware/errorHandler';
import { reloadCategoryKeywordsCache } from './utils/categoryDetector';
import { runDatabaseMigration } from './utils/migrationHelper';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', expenseRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', categoryRoutes);
app.use('/api', settingsRoutes);
app.use('/api', bankAccountRoutes);
app.use('/api', comparisonRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
        res.json({ status: 'ok', database: 'connected' });
    } else {
        res.status(503).json({ status: 'maintenance', database: 'disconnected' });
    }
});

app.post('/api/shutdown', async (req, res) => {
    try {
        res.json({ message: 'Server is shutting down...' });
        console.log('Shutdown request received. Stopping server in 1 second...');
        setTimeout(async () => {
            try {
                await mongoose.connection.close();
                console.log('Mongoose connection closed. Exiting process.');
            } catch (err) {
                console.error('Error closing Mongoose connection:', err);
            } finally {
                process.exit(0);
            }
        }, 1000);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 404 route handling for unmatched API endpoints
app.use((req, res, next) => {
    res.status(404).json({ error: `Endpoint ${req.originalUrl} not found` });
});

// Error handling
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_dashboard')
    .then(async () => {
        console.log('Connected to MongoDB');
        
        // Execute primary account workspace migration and default seeding
        await runDatabaseMigration();
        
        // Build keywords classification cache in memory
        await reloadCategoryKeywordsCache();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import expenseRoutes from './routes/expenseRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { errorHandler } from './middleware/errorHandler';

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

// Error handling
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_dashboard')
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });
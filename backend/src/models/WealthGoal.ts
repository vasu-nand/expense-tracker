import { Schema, model, Document } from 'mongoose';

export interface IWealthGoal extends Document {
    name: string;
    targetAmount: number;
    currentProgress: number; // e.g. amount achieved so far (or calculated dynamically)
    deadline: Date;
    createdAt: Date;
}

const WealthGoalSchema = new Schema<IWealthGoal>({
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentProgress: { type: Number, required: true, default: 0, min: 0 },
    deadline: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default model<IWealthGoal>('WealthGoal', WealthGoalSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    color: string;
    keywords: string[];
    isPredefined: boolean;
}

const CategorySchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    color: {
        type: String,
        required: true
    },
    keywords: {
        type: [String],
        default: []
    },
    isPredefined: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model<ICategory>('Category', CategorySchema);

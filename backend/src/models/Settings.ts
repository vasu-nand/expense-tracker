import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    bankAccountId: mongoose.Types.ObjectId;
    themeMode: string;
    themeConfig: {
        name: string;
        background: string;
        card: string;
        foreground: string;
        border: string;
        primary: string;
        btnGradientStart: string;
        btnGradientEnd: string;
        textGradientStart: string;
        textGradientEnd: string;
        radius: string;
        dark?: {
            background: string;
            card: string;
            foreground: string;
            border: string;
            primary: string;
            btnGradientStart: string;
            btnGradientEnd: string;
            textGradientStart: string;
            textGradientEnd: string;
        }
    }
}

const DarkThemeSchema = new Schema({
    background: { type: String, required: true },
    card: { type: String, required: true },
    foreground: { type: String, required: true },
    border: { type: String, required: true },
    primary: { type: String, required: true },
    btnGradientStart: { type: String, required: true },
    btnGradientEnd: { type: String, required: true },
    textGradientStart: { type: String, required: true },
    textGradientEnd: { type: String, required: true }
}, { _id: false });

const ThemeConfigSchema = new Schema({
    name: { type: String, required: true },
    background: { type: String, required: true },
    card: { type: String, required: true },
    foreground: { type: String, required: true },
    border: { type: String, required: true },
    primary: { type: String, required: true },
    btnGradientStart: { type: String, required: true },
    btnGradientEnd: { type: String, required: true },
    textGradientStart: { type: String, required: true },
    textGradientEnd: { type: String, required: true },
    radius: { type: String, default: '0.5rem' },
    dark: { type: DarkThemeSchema, required: false }
}, { _id: false });

const SettingsSchema: Schema = new Schema({
    bankAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true,
        unique: true,
        index: true
    },
    themeMode: {
        type: String,
        default: 'light',
        enum: ['light', 'dark', 'system']
    },
    themeConfig: {
        type: ThemeConfigSchema,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);

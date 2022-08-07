import mongoose from 'mongoose';

export interface Invite {
    id: string;
    channelId: string;
    guildId: string;
}

export const InviteSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    channelId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
});

export const Invite = mongoose.model<Invite>('Invite', InviteSchema);

import { withMeta } from 'express-zod-api';
import mongoose from 'mongoose';
import { z } from 'zod';

export interface GuildType {
    id: string;
    name: string;
    owner: string;
    members: string[];
}

export const GuildZod = withMeta(
    z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(32),
        ownerId: z.string().min(1), // TODO: Id or PublicUserZod?
    })
).example({
    id: '915047329042434',
    name: 'My guild',
    ownerId: '914997903364096',
});

export const GuildSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },
    members: {
        type: [String],
        required: true,
    },
});

export const Guild = mongoose.model<GuildType>('Guild', GuildSchema);

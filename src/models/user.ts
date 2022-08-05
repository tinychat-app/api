import { withMeta } from 'express-zod-api';
import mongoose from 'mongoose';
import { z } from 'zod';

export interface UserType {
    id: string;
    username: string;
    discriminator: string;
    email: string;
    hash: string;
}

export const UserSchema = new mongoose.Schema<UserType>({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    hash: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    discriminator: {
        type: String,
        required: true,
    },
});

export const PublicUserZod = withMeta(
    z.object({
        username: z.string().min(1),
        discriminator: z.string().min(1),
        id: z.string().min(1),
    })
).example({
    username: 'tea',
    id: '915655285018624',
    discriminator: '1000',
});

// prettier-ignore
export const UserZod = withMeta(
    z.object({
        email: z.string().min(1),
    })
    .merge(PublicUserZod)
).example({
    username: 'tea',
    id: '915655285018624',
    discriminator: '1000',
    email: 'teaishealthy@protonmail.com',
});

export const User = mongoose.model('User', UserSchema);

import { withMeta, z } from 'express-zod-api';

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

export const GuildZod = withMeta(
    z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(32),
        owner: PublicUserZod,
    })
).example({
    id: '915047329042434',
    name: 'My guild',
    owner: {
        id: '914997903364096',
        username: 'tea',
        discriminator: '1000',
    },
});

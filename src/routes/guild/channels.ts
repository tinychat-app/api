import { createHttpError, defaultEndpointsFactory, withMeta } from 'express-zod-api';
import { z } from 'zod';

import { AuthenticatedOptions, client, prisma, snowflake, verifyAuthMiddleware } from '../../common';
import { GuildZod } from '../../models';

export const createGuildChannel = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'post',
    description: 'Create a new channel',
    input: withMeta(
        z.object({
            name: z.string().min(1).max(32),
            id: z.string().min(1),
        })
    ).example({ name: 'My Channel', id: '915047329042434' }),
    output: z.object({
        id: z.string(),
        name: z.string(),
        guild: GuildZod,
    }),
    handler: async ({ input: { name, id }, options }) => {
        const { user } = options as AuthenticatedOptions;
        const guild = await prisma.guild.findFirst({
            where: {
                id: id,
                owner_id: user.id,
            },
        });

        if (!guild) {
            throw createHttpError(404, 'Guild not found');
        }

        const internalChannel = await prisma.guildChannel.create({
            data: {
                id: snowflake.generate().toString(),
                name,
                guild_id: id,
            },
        });

        const channel = {
            id: internalChannel.id,
            name: internalChannel.name,
            guild: {
                id: internalChannel.guild_id,
                name: guild.name,
                owner: {
                    id: guild.owner_id,
                    username: user.username,
                    discriminator: user.discriminator,
                },
            },
        };

        client.publish(
            'gateway',
            JSON.stringify({
                type: 'dispatch',
                data: {
                    type: 'channel_create',
                    id: user.id,
                    channel: channel,
                },
            })
        );

        return channel;
    },
});

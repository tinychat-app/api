import { createHttpError, defaultEndpointsFactory, withMeta } from 'express-zod-api';
import { z } from 'zod';

import { AuthenticatedOptions, client, snowflake, verifyAuthMiddleware } from '../../common';
import { Channel } from '../../models/channel';
import { Guild, GuildZod } from '../../models/guild';

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
    }),
    handler: async ({ input: { name, id }, options }) => {
        const { user } = options as AuthenticatedOptions;
        const guild = await Guild.findOne({
            id: id,
            owner: user.id,
        })
        if (!guild) {
            throw createHttpError(404, 'Guild not found');
        }

        const channel: Channel = {
            id: snowflake.generate().toString(),
            name,
        }
        guild.channels.push(channel);
        await guild.save();
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

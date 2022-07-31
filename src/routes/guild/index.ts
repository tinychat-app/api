import { createHttpError, defaultEndpointsFactory, withMeta, z } from 'express-zod-api';

import { AuthenticatedOptions, client, prisma, snowflake, verifyAuthMiddleware } from '../../common';
import { GuildZod } from '../../models';

export const createGuild = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'post',
    description: 'Create a new guild',
    input: withMeta(
        z.object({
            name: z.string().min(1).max(32),
        })
    ).example({ name: 'My Guild' }),
    output: GuildZod,
    handler: async ({ input: { name }, options, logger }) => {
        console.log(options);
        const { user } = options as AuthenticatedOptions;
        const guild = await prisma.guild.create({
            data: {
                id: snowflake.generate().toString(),
                name,
                owner_id: user.id,
            },
        });
        logger.debug(`Created guild '${name}' for user '${user.username}'`);

        await client.publish(
            'gateway',
            JSON.stringify({
                type: 'dispatch',
                data: {
                    type: 'guild_create',
                    id: user.id,
                    guild: guild,
                },
            })
        );

        return {
            id: guild.id,
            name: guild.name,
            owner: {
                id: guild.owner_id,
                username: user.username,
                discriminator: user.discriminator,
            },
        };
    },
});

export const getGuild = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'get',
    description: 'Get guild info',
    input: withMeta(
        z.object({
            id: z.string().min(1),
        })
    ).example({ id: '915047329042434' }),
    output: GuildZod,
    handler: async ({ input: { id }, options, logger }) => {
        const { user } = options as AuthenticatedOptions;

        const guild = await prisma.guild.findFirst({
            where: { id },
        });

        if (!guild) {
            logger.silly(`'${user.id}' tried to GET /guild/'${id}' but it does not exist`);
            throw createHttpError(404, 'Guild not found');
        }

        const owner = await prisma.user.findFirstOrThrow({
            where: { id: guild.owner_id },
        });

        logger.silly(`Got guild '${guild.name}' for user '${user.username}'`);
        return {
            id: guild.id,
            name: guild.name,
            owner: {
                id: owner.id,
                username: owner.username,
                discriminator: owner.discriminator,
            },
        };
    },
});

export const updateGuild = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'patch',
    description: 'Update guild info',
    input: withMeta(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1).max(32).optional(),
        })
    ).example({ id: '915047329042434', name: 'My Guild' }),
    output: GuildZod,
    handler: async ({ input: { id, name }, options, logger }) => {
        const { user } = options as AuthenticatedOptions;

        const guild = await prisma.guild.findFirst({
            where: { id },
        });

        if (!guild) {
            logger.silly(`'${user.id}' tried to PATCH /guild/'${id}' but it does not exist`);
            throw createHttpError(404, 'Guild not found');
        }

        if (guild.owner_id !== user.id) {
            logger.silly(`'${user.id}' tried to PATCH /guild/'${id}' but it is not their guild`);
            throw createHttpError(403, 'You are not the owner of this guild');
        }

        const owner = await prisma.user.findFirstOrThrow({
            where: { id: guild.owner_id },
        });

        const updatedGuild = await prisma.guild.update({
            where: { id },
            data: {
                name: name !== undefined ? name : guild.name,
            },
        });

        return {
            id: updatedGuild.id,
            name: updatedGuild.name,
            owner: {
                id: owner.id,
                username: owner.username,
                discriminator: owner.discriminator,
            },
        };
    },
});

export const deleteGuild = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'delete',
    description: 'Delete a guild',
    input: withMeta(
        z.object({
            id: z.string().min(1),
        })
    ).example({ id: '915047329042434' }),
    output: GuildZod,
    handler: async ({ input: { id }, options, logger }) => {
        const { user } = options as AuthenticatedOptions;

        const guild = await prisma.guild.findFirst({
            where: { id },
        });

        if (!guild) {
            logger.silly(`'${user.id}' tried to DELETE /guild/'${id}' but it does not exist`);
            throw createHttpError(404, 'Guild not found');
        }
        if (guild.owner_id !== user.id) {
            logger.silly(`'${user.id}' tried to DELETE /guild/'${id}' but it is not their guild`);
            throw createHttpError(403, 'You are not the owner of this guild');
        }

        await prisma.guild.delete({
            where: { id },
        });

        logger.silly(`Deleted guild '${guild.name}' for user '${user.username}'`);
        return {
            id: guild.id,
            name: guild.name,
            owner: {
                id: guild.owner_id,
                username: user.username,
                discriminator: user.discriminator,
            },
        };
    },
});

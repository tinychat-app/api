import { DependsOnMethod, Routing, ServeStatic, createConfig, createServer } from 'express-zod-api';
import { OpenAPI } from 'express-zod-api';
import { writeFileSync } from 'fs';
import path from 'path';

import { prisma } from './common';
import { createGuild, deleteGuild, getGuild, updateGuild } from './routes/guild';
import { createUserEndpoint as createUser, getUserTokenEndpoint, getUsersMe, patchUsersMe as updateUsersMe, deleteUserEndpoint as deleteUser } from './routes/users';

const config = createConfig({
    server: {
        listen: 3000,
    },
    cors: true,
    logger: {
        level: 'debug',
        color: true,
    },
});

const routing: Routing = {
    v1: {
        users: {
            '@me': {
                token: getUserTokenEndpoint,
                '': new DependsOnMethod({
                    get: getUsersMe,
                    post: createUser,
                    patch: updateUsersMe,
                    delete: deleteUser,
                }),
            },
        },
        guilds: {
            '': createGuild,
            ":id": new DependsOnMethod({
                get: getGuild,
                patch: updateGuild,
                delete: deleteGuild,
            })
        },
        
    },
    docs: new ServeStatic(path.join(__dirname, '..', 'public')),
};

const jsonSpec = new OpenAPI({
    routing,
    config,
    version: '0.1.0',
    title: 'tinychat API',
    serverUrl: 'http://localhost:3000',
}).getSpecAsJson();
writeFileSync(path.join(__dirname, '..', 'public/openapi.json'), jsonSpec);

const main = async () => {
    await prisma.$connect();
    createServer(config, routing);
};
main();

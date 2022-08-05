import { createConfig, DependsOnMethod, OpenAPI, Routing, ServeStatic } from "express-zod-api";
import { getUsersMe, createUserEndpoint, patchUsersMe, deleteUserEndpoint, getUserTokenEndpoint } from "./routes/users";
import { createGuild, deleteGuild, getGuild, updateGuild } from './routes/guild';
import path from "path";
import { writeFileSync } from "fs";
import { createGuildChannel } from "./routes/guild/channels";


export const config = createConfig({
    server: {
        listen: 3000,
    },
    cors: true,
    logger: {
        level: 'debug',
        color: true,
    },
});



export const routing: Routing = {
    v1: {
        users: {
            '@me': {
                token: getUserTokenEndpoint,
                '': new DependsOnMethod({
                    get: getUsersMe,
                    post: createUserEndpoint,
                    patch: patchUsersMe,
                    delete: deleteUserEndpoint,
                }),
            },
        },
        guilds: {
            '': createGuild,
            ':id': {
                '': new DependsOnMethod({
                    get: getGuild,
                    patch: updateGuild,
                    delete: deleteGuild,
                }),
                channels: new DependsOnMethod({
                    post: createGuildChannel,
                }),
            },
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
writeFileSync(path.join(__dirname, '..', 'public/openapi.json'), jsonSpec, { flag: 'w' });
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const app_1 = require("./app");
const port = Number(process.env.PORT ?? 3001);
(0, node_server_1.serve)({ fetch: app_1.app.fetch, port }, () => {
    console.log(`ERP API -> http://localhost:${port}`);
});

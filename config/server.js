import express, { json } from 'express';
const server = express();
import { setRoutes } from './routes';

server.use(json());

setRoutes(server);

export default { server };
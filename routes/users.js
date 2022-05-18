import express, { response } from 'express';

import { getUsers, createUsers } from '../controllers/users.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/create/:wallet', createUsers);

export default router;
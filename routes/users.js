import express, { response } from 'express';

import { getUsers, createUsers, getUser } from '../controllers/users.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/create/', createUsers);
router.get('/specific/:wallet', getUser);

export default router;
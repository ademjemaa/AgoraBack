import express, { response } from 'express';

import { PostTransaction } from '../controllers/accounts.js';

const router = express.Router();

router.get('/', PostTransaction);

export default router;
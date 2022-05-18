import express, { response } from 'express';


import { getTrans, getEarned } from '../controllers/accounts.js';

const router = express.Router();

router.post('/', getTrans);
router.get('/:to', getEarned);

export default router;
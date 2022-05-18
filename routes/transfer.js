import express, { response } from 'express';


import { getTrans } from '../controllers/accounts.js';

const router = express.Router();

router.get('/', getTrans);

export default router;
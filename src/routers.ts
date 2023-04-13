import express, {Request, Response} from 'express'
import { getGameInfo, myInfo, updateGameInfo } from './controllers/client';
import { totalHistory, totalUsers } from './controllers/admin';

const router = express.Router();

router.post('/my-info', myInfo);
router.get('/get-total-history', totalHistory);
router.get('/get-total-users', totalUsers);
router.get('/get-game-info', getGameInfo);
router.post("/update-game-info", updateGameInfo);

export default router
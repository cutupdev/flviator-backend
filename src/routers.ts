import express from 'express'
import {
    getGameInfo,
    myInfo,
    updateUserInfo,
    updateGameInfo,
    dayHistory,
    monthHistory,
    yearHistory,
    likesToChatFunc,
    GameLaunch,
    updateCashout,
    getAllChats
} from './controllers/client';
import { totalHistory, totalUsers } from './controllers/admin';

const router = express.Router();


router.get('/get-total-history', totalHistory);
router.get('/get-day-history', dayHistory);
router.get('/get-month-history', monthHistory);
router.get('/get-year-history', yearHistory);
router.get('/get-total-users', totalUsers);
router.get('/get-game-info', getGameInfo);

router.post('/GameLaunch', GameLaunch);
router.post('/my-info', myInfo);
router.post('/get-all-chat', getAllChats);
router.post('/like-chat', likesToChatFunc);
router.post('/update-info', updateUserInfo);
router.post("/update-game-info", updateGameInfo);
router.post("/update-cashout", updateCashout);

export default router
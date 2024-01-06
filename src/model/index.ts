import { MongoClient } from 'mongodb';

import projectConfig from '../config.json'
import { currentTime, setlog } from '../helper';
import { addCurrency } from './currency';
import { addGameSetting } from './gamesetting';
import { addCancelBet } from './cancelbet';
import { addCancelBetLog } from './cancelbetlog';

const dbUser = process.env.DB_USER || 'app';
const dbPwd = process.env.DB_PWD || '5uikrEmaEblyTmfa';
const dbHost = process.env.DB_HOST || '192.168.0.19';
const dbPort = process.env.DB_PORT || 27017;
const dbName = process.env.DB_NAME || 'crash';

// const mongoURL = process.env.NODE_ENV === 'development' ? 'mongodb://127.0.0.1:27017' : `mongodb://${dbUser}:${dbPwd}@${dbHost}:${dbPort}`;
const mongoURL = 'mongodb://127.0.0.1:27017';

const client = new MongoClient(mongoURL);
const db = client.db(dbName);
export const DEFAULT_GAMEID = 1

export const TblCurrency = db.collection<SchemaTblCurrency>('currency');
export const TblUser = db.collection<SchemaTblUser>('users');
export const TblSession = db.collection<SchemaTblSession>('sessions');
export const TblFlyDetail = db.collection<SchemaTblFlyDetail>('flydetail');
export const TblGameSetting = db.collection<SchemaTblGameSetting>('gamesetting');
export const TblBet = db.collection<SchemaTblBet>('bet');
export const TblCashout = db.collection<SchemaTblCashout>('cashout');
export const TblCancelBet = db.collection<SchemaTblCancelBet>('cancelbet');
export const TblBetLog = db.collection<SchemaTblBetLog>('betlog');
export const TblCashoutLog = db.collection<SchemaTblCashoutLog>('cashoutlog');
export const TblCancelBetLog = db.collection<SchemaTblCancelBetLog>('cancelbetlog');
export const TblAuthenticationLog = db.collection<SchemaTblAuthenticationLog>('authenticationlog');
export const TblGameLaunch = db.collection<SchemaTblGameLaunch>('gamelaunch');
export const TblChat = db.collection<SchemaTblChat>('chat');
export const TblBlock = db.collection<SchemaTblBlock>('block');

export const DGame = db.collection<SchemaGame>('game');
// export const DHistories = db.collection<SchemaHistory>('histories');
export const DChatHistories = db.collection<SchemaChatHistory>('chat-histories');

const lastIds = {
    lastHistoryId: 0,
    lastUserId: 0
}

// const addCurrencyManually = async () => {
//     await addCurrency("INR", "India, United Arab", "INR", true, "Admin")
//     await addCurrency("USD", "United States", "USD", true, "Admin")
// }

// const addGameSettingManually = async () => {
//     await addGameSetting(10, 100000, 95, 1 * 60 * 60 * 1000, true, true, true)
// }

// const addCancelBetManually = async () => {
//     await addCancelBet("Smith#167", "1703694643731", 20, "1703694737205", "0c42839d-c0c3-4441-a798-79ba006ad9a0", 2059.18, 2059.18, 2059.18, 1703694863731)
//     await addCancelBetLog("Smith#167", "1703694643731", "1703697537205", 200, "success", "8IHfN3bO/3xWkOP5tRpR8ZgazrHASQV+wbImKu605WM=", {
//         userID: "Smith#167",
//         betid: "1703694643731",
//         amount: 23.16,
//         currency: "INR",
//         Session_Token: "c2a66a27-bd9c-48ee-b5fb-4d90598f82f0",
//         cancelbetid: "1703697596360",
//     }, {
//         code: 200,
//         message: "success",
//         data: {
//             userID: "Smith_167",
//             betid: 1703697579442,
//             updatedBalance: 1919.55,
//             currency: "INR",
//             cashoutid: '1703697596360'
//         }
//     }, 1703697596195, 1703697597110);
//     console.log("Done");
// }

// addCancelBetManually()

// export const connect = async () => {
//     try {
//         await client.connect();
//         await TblUser.createIndex({ name: 1 }, { unique: true, name: 'users-name' });
//         await DHistories.createIndex({ name: 1 }, { unique: false, name: 'logs-name' });
//         await DHistories.createIndex({ date: 1 }, { unique: false, name: 'logs-date' });

//         const d = await DHistories.aggregate([{ $group: { _id: null, max: { $max: "$_id" } } }]).toArray();
//         lastIds.lastHistoryId = d?.[0]?.max || 0
//         const d1 = await TblUser.aggregate([{ $group: { _id: null, max: { $max: "$_id" } } }]).toArray();
//         lastIds.lastUserId = d1?.[0]?.max || 0
//         return true
//     } catch (error) {
//         setlog('mongodb-initialization', error)
//         return error
//     }
// }

export const getBettingAmounts = async () => {
    try {
        const d = await DGame.findOne({ _id: DEFAULT_GAMEID })
        const minBetAmount = d?.minBetAmount || projectConfig.betting.min;
        const maxBetAmount = d?.maxBetAmount || projectConfig.betting.max;
        return { minBetAmount, maxBetAmount }
    } catch (error) {
        setlog('getBettingAmounts', error)
        return { minBetAmount: projectConfig.betting.min, maxBetAmount: projectConfig.betting.max }
    }

}

// export const addHistory = async (userId: string, betAmount: number, cashoutAt: number, cashouted: boolean) => {
//     try {
//         await DHistories.insertOne({
//             _id: ++lastIds.lastHistoryId,
//             userId,
//             betAmount,
//             cashoutAt,
//             cashouted,
//             date: currentTime()
//         })
//         return true
//     } catch (error) {
//         setlog('addHistory', error)
//         return false
//     }
// }

// export const addUser = async (userId: string, name: string, balance: number, currency: string, img: string) => {
//     try {
//         const findUser = await TblUser.findOne({ userId });
//         if (!findUser) {
//             const now = currentTime()
//             await TblUser.insertOne({
//                 _id: ++lastIds.lastUserId,
//                 name,
//                 img: img || "./avatars/av-5.png",
//                 userId,
//                 currency,
//                 balance,
//                 soundStatus: true,
//                 musicStatus: true,
//                 msgVisible: false,
//                 session_created: now,
//                 updated: now,
//                 created: now,
//             })
//             return true
//         } else {
//             setlog('User already exists');
//             return false
//         }
//     } catch (error) {
//         setlog('addUser', error)
//         return false
//     }
// }

export const updateUserBalance = async (name: string, balance: number) => {
    try {
        await TblUser.updateOne({ name }, { $set: { balance } })
        return true
    } catch (error) {
        setlog('updateUserBalance', error)
        return false
    }
}

export const getAllChatHistory = async () => {
    const allHistories = await DChatHistories.find().limit(50).toArray();
    return allHistories;
}

export const likesToChat = async (chatID: number, userId: string) => {
    try {
        const result = await DChatHistories.findOne({ _id: chatID, likesIDs: { $in: [userId] } });
        let shouldAdd = result === null;

        const updateQuery: any = shouldAdd
            ? {
                $addToSet: { likesIDs: userId },
                $inc: { likes: 1 }
            }
            : {
                $pull: { likesIDs: userId },
                $inc: { likes: -1 }
            };

        await DChatHistories.updateOne({ _id: chatID }, updateQuery);
        return { status: true };
    } catch (error) {
        return { status: false };
    }
}

export const addChatHistory = async (userId: string, socketId: string, msgType: string, msg: string) => {
    try {
        var data: any = {
            _id: Date.now(),
            userId,
            socketId,
            msgType,
            msg,
            likes: 0,
            likesIDs: [],
            createdAt: Date.now()
        }
        await DChatHistories.insertOne(data)
        return {
            status: true,
            data
        }
    } catch (error) {
        setlog('addHistory', error)
        return {
            status: false,
            data: {}
        }
    }
}
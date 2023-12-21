import { MongoClient } from 'mongodb';

import projectConfig from '../config.json'
import { currentTime, setlog } from '../helper';

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

export const DUsers = db.collection<SchemaUser>('users');
export const DGame = db.collection<SchemaGame>('game');
export const DHistories = db.collection<SchemaHistory>('histories');
export const DChatHistories = db.collection<SchemaChatHistory>('chat-histories');

const lastIds = {
    lastHistoryId: 0,
    lastUserId: 0
}

export const connect = async () => {
    try {
        await client.connect();
        await DUsers.createIndex({ name: 1 }, { unique: true, name: 'users-name' });
        await DHistories.createIndex({ name: 1 }, { unique: false, name: 'logs-name' });
        await DHistories.createIndex({ date: 1 }, { unique: false, name: 'logs-date' });

        const d = await DHistories.aggregate([{ $group: { _id: null, max: { $max: "$_id" } } }]).toArray();
        lastIds.lastHistoryId = d?.[0]?.max || 0
        const d1 = await DUsers.aggregate([{ $group: { _id: null, max: { $max: "$_id" } } }]).toArray();
        lastIds.lastUserId = d1?.[0]?.max || 0
        return true
    } catch (error) {
        setlog('mongodb-initialization', error)
        return error
    }
}

export const getBettingAmounts = async () => {
    try {
        const d = await DGame.findOne({ _id: DEFAULT_GAMEID })
        const minBetAmount = d?.minBetAmount || projectConfig.betting.min;
        const maxBetAmount = d?.maxBetAmount || projectConfig.betting.max;
        return { minBetAmount, maxBetAmount }
    } catch (error) {
        setlog('addHistory', error)
        return { minBetAmount: projectConfig.betting.min, maxBetAmount: projectConfig.betting.max }
    }

}

export const addHistory = async (userId: string, betAmount: number, cashoutAt: number, cashouted: boolean) => {
    try {
        await DHistories.insertOne({
            _id: ++lastIds.lastHistoryId,
            userId,
            betAmount,
            cashoutAt,
            cashouted,
            date: currentTime()
        })
        return true
    } catch (error) {
        setlog('addHistory', error)
        return false
    }
}

export const addUser = async (userId: string, name: string, balance: number, currency: string, img: string) => {
    try {
        const findUser = await DUsers.findOne({ userId });
        if (!findUser) {
            const now = currentTime()
            await DUsers.insertOne({
                _id: ++lastIds.lastUserId,
                name,
                img,
                userId,
                currency,
                balance,
                soundStatus: false,
                musicStatus: false,
                msgVisible: false,
                session_created: now,
                updated: now,
                created: now,
            })
            return true
        } else {
            setlog('User already exists');
            return false
        }
    } catch (error) {
        setlog('addUser', error)
        return false
    }
}

export const updateUserBalance = async (name: string, balance: number) => {
    try {
        await DUsers.updateOne({ name }, { $set: { balance } })
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
        await DChatHistories.insertOne({
            _id: Date.now(),
            userId,
            socketId,
            msgType,
            msg,
            likes: 0,
            likesIDs: [],
            createdAt: Date.now()
        })
        return true
    } catch (error) {
        setlog('addHistory', error)
        return false
    }
}
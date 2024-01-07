// declare interface SchemaTblCurrency {
//     _id: number
//     currencyName: string
//     country: string
//     code: string
//     isActive: boolean
//     createdDate: number
//     createdBy: string
// }

// declare interface SchemaUserModel {
//     _id: number
//     userName: string
//     userId: string
//     currency: string
//     balance: number
//     avatar: string
//     isActive: boolean
//     isBetAllow: boolean
//     platform: string
//     createdDate: number
//     createdBy: string
//     isSoundEnable: boolean
//     isMusicEnable: boolean
//     isChatEnable: boolean
//     ipAddress: string
// }

// declare interface SchemaTblSession {
//     _id: number
//     userId: string
//     sessionToken: string
//     userToken: string
//     userBalance: number
//     startTime: number
//     endTime: number
//     ipAddress: string
// }

// declare interface SchemaTblFlyDetail {
//     _id: number
//     betId: string
//     betStartTime: number
//     betEndTime: number
//     flyStartTime: number
//     totalUsers: number
//     totalBets: number
//     totalBetsAmount: number
//     totalCashout: number
//     totalCashoutAmount: number
//     flyAway: number
//     flyEndTime: number
// }

// declare interface SchemaTblGameSetting {
//     _id: number
//     minBetAmount: number
//     maxBetAmount: number
//     RTP: number
//     userSessionTime: number
//     isChatEnable: boolean
//     isBetAllow: boolean
//     isGameEnable: boolean
// }

// declare interface SchemaTblBet {
//     _id: number
//     userId: string
//     betId: string
//     beforeBalance: number
//     betAmount: number
//     afterBalance: number
//     responseBalance: number
//     currency: string
//     sessionToken: string
//     createdDate: number
//     platform: string
//     isCancel: boolean
//     cancelTime: number
// }

// declare interface SchemaTblCashout {
//     _id: number
//     userId: string
//     betId: string
//     betAmount: number
//     afterBalance: number
//     cashoutId: number
//     cashoutAt: number
//     cashoutAmount: number
//     responseBalance: number
//     flyAway: number
//     sessionToken: string
//     createdDate: number
// }

// declare interface SchemaTblCancelBet {
//     _id: number
//     userId: string
//     betId: string
//     betAmount: number
//     cancelBetId: string
//     sessionToken: string
//     beforeBalance: number
//     afterBalance: number
//     responseBalance: number
//     createdDate: number
// }

// declare interface SchemaTblBetLog {
//     _id: number
//     userId: string
//     betId: string
//     code: number
//     message: string
//     hashKey: string
//     requestJson: object
//     responseJson: object
//     requestTime: number
//     responseTime: number
// }

// declare interface SchemaTblCashoutLog {
//     _id: number
//     userId: string
//     betId: string
//     cashoutID: number
//     code: number
//     message: string
//     hashKey: string
//     requestJson: object
//     responseJson: object
//     requestTime: number
//     responseTime: number
// }

// declare interface SchemaTblCancelBetLog {
//     _id: number
//     userId: string
//     betId: string
//     cancelBetID: string
//     code: number
//     message: string
//     hashKey: string
//     requestJson: object
//     responseJson: object
//     requestTime: number
//     responseTime: number
// }

// declare interface SchemaTblAuthenticationLog {
//     _id: number
//     userId: string
//     code: number
//     message: string
//     hashKey: string
//     requestJson: object
//     responseJson: object
//     requestTime: number
//     responseTime: number
// }

// declare interface SchemaTblGameLaunch {
//     _id: number
//     userId: string
//     code: number
//     message: string
//     hashKey: string
//     requestJson: object
//     responseJson: object
//     requestTime: number
//     responseTime: number
// }

// declare interface SchemaTblChat {
//     _id: number
//     userId: string
//     message: string
//     img: string
//     emoji: string
//     createdDate: number
//     likes: number
//     disLikes: number
// }

// declare interface SchemaTblBlock {
//     _id: number
//     text: string
//     emails: string
//     phoneno: string
//     urls: string
//     users: string
// }


































// declare interface SchemaUser {
//     _id: number
//     name: string
//     img: string
//     userId: string
//     currency: string
//     balance: number
//     soundStatus: boolean
//     isMusicEnable: boolean
//     msgVisible: boolean
//     session_created: number
//     updated: number
//     created: number
// }

// declare interface SchemaGame {
//     _id: number
//     minBetAmount: number
//     maxBetAmount: number
// }

// declare interface SchemaHistory {
//     _id: number
//     userId: string
//     betAmount: number
//     cashoutAt: number
//     cashouted: boolean
//     date: number
// }
declare interface SchemaChatHistory {
    _id: number
    userId: string
    socketId: string
    msgType: string
    msg: string
    likes: number
    likesIDs: Array
    createdAt: number
}
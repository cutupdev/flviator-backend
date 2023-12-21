declare interface SchemaUser {
    _id: number
    name: string
    img: string
    userId: string
    currency: string
    balance: number
    soundStatus: boolean
    musicStatus: boolean
    session_created: number
    updated: number
    created: number
}

declare interface SchemaGame {
    _id: number
    minBetAmount: number
    maxBetAmount: number
}

declare interface SchemaHistory {
    _id: number
    userId: string
    betAmount: number
    cashoutAt: number
    cashouted: boolean
    date: number
}
declare interface SchemaChatHistory {
    _id: number
    userId: string
    socketId: string
    msgType: string
    msg: string
    createdAt: number
}
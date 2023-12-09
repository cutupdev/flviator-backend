declare interface SchemaUser {
    _id: number
    name: string
    img: string
    userId: string
    currency: string
    balance: number
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
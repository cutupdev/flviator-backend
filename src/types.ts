
export interface UserType {
    userId: string
    userName: string
    currency: string
    balance: number
    avatar: string
    token: string
    socketId: string
    Session_Token: string
    bot: boolean
    userType: boolean
    isSoundEnable: boolean
    isMusicEnable: boolean
    f: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        betid: number
        betAmount: number
        cashAmount: number
        target: number
    }
    s: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        betid: number
        betAmount: number
        cashAmount: number
        target: number
    }
}

export interface PreHandType {
    name: string
    betAmount: number
    cashOut: number
    target: number
    avatar: string
    cashouted: boolean
}

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
    f: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        orderNo: number
        betAmount: number
        cashAmount: number
        target: number
    }
    s: {
        auto: boolean
        betted: boolean
        cashouted: boolean
        orderNo: number
        betAmount: number
        cashAmount: number
        target: number
    }
}

export interface PreHandType {
    img: string
    userName: string
    betted: boolean
    cashouted: boolean
    betAmount: number
    cashAmount: number
    target: number
}
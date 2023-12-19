const randomModule = require('random-name')

import localconfig from "../config.json";

export const DEFAULT_USER = {
    userId: '0',
    userName: 'test',
    currency: 'INR',
    balance: 0,
    avatar: './avatars/av-5.png',
    token: '',
    socketId: '',
    Session_Token: '',
    bot: false,
    userType: false,
    audioStatus: false,
    musicStatus: false,
    f: {
        auto: false,
        betted: false,
        cashouted: false,
        orderNo: 0,
        betAmount: 0,
        cashAmount: 0,
        target: 0,
    },
    s: {
        auto: false,
        betted: false,
        cashouted: false,
        orderNo: 0,
        betAmount: 0,
        cashAmount: 0,
        target: 0,
    }
}

export const RTP = localconfig.RTP;
export const READYTIME = 1000;
export const BETINGTIME = 5000;
export const GAMEENDTIME = 3000;



export const getMultiValue = (num: number) => {
    return (Math.floor(Math.random() * 10) + 1) * num;
}

export const getBotRandomBetAmount = () => {
    let a = 20, b = 50, c = 100;

    var rd = Math.floor(Math.random() * 6) + 1;

    if (rd === 1) {
        return getMultiValue(a);
    } else if (rd === 2) {
        return getMultiValue(b);
    } else if (rd === 3) {
        return getMultiValue(c);
    } else if (rd === 4) {
        return getMultiValue(a) + getMultiValue(b);
    } else if (rd === 5) {
        return getMultiValue(a) + getMultiValue(b) + getMultiValue(c);
    } else {
        return (Math.random() * 1000) + 1;
    }

}

export const getRandomName = () => {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result;
};

export const getRandomAvatar = () => {
    return `./avatars/av-${Math.floor(Math.random() * 71) + 1}.png`;
}
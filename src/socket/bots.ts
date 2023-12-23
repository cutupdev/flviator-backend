
import uniqid from 'uniqid';

export let botIds = [] as string[];

export const initBots = () => {
    for (var i = 0; i < 15; i++) {
        botIds.push(uniqid());
    }
}
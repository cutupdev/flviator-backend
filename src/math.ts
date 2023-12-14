const multipleFunction = (x: number) => {
    return 1 + 0.06 * x + Math.pow((0.06 * x), 2) - Math.pow((0.04 * x), 3) + Math.pow((0.04 * x), 4)
}
export const getTime = (x: number) => {
    let t = 0
    for (t = 0; t <= 100; t += 0.01) {
        if (x - multipleFunction(t) < 0) break;
    }
    return t;
}
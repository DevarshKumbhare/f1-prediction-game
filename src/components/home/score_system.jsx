export const calculateScore = (startingGrid, gpPred, gpResult, sprint, multiplier, rno) => {
    let score = 0;
    let copyQualiResult = true;
    let correctPlaces = 0;
    const boldMultiplier = {
        0: 1,
        1: 1.15,
        2: 1.4,
        3: 1.9,
        4: 2.5
    };

    //console.log(startingGrid, gpPred, gpResult, sprint, multiplier, rno);

    for (let i = 0; i < 3; i++) {
        copyQualiResult &= (startingGrid[gpPred[i]] === i + 1);
    }

    for (let i = 0; i < 3; i++) {
        if (!gpResult[gpPred[i]]) continue;

        if (gpResult[gpPred[i]] === i + 1) {
            correctPlaces++;
            score += 4 * (sprint ? 1 : boldMultiplier[Math.floor((startingGrid[gpPred[i]] - 1) / 4)]);
        } else if (Math.abs(gpResult[gpPred[i]] - (i + 1)) === 1) {
            score += 2 * (sprint ? 1 : boldMultiplier[Math.floor((startingGrid[gpPred[i]] - 1) / 4)]);
        }

        if (gpResult[gpPred[i]] <= 3) {
            score += 4 * (sprint ? 1 : boldMultiplier[Math.floor((startingGrid[gpPred[i]] - 1) / 4)]);
        }
    }

    if (correctPlaces === 2 && !sprint) score += 4;
    if (correctPlaces === 3 && !sprint) {
        score += 8;
    }

    score *= (copyQualiResult ? 0.8 : 1) * (sprint ? 0.5 : multiplier);
    let newMultiplier = (rno === 1 || (rno % 3 === 2 & rno>3)) ? 1.75 : 1;
    if (correctPlaces === 3 && !sprint)newMultiplier += 1;

    if (!sprint) rno++;

    return { score1: Math.round(score), score2: correctPlaces, newMultiplier, newRno: rno };
};

//1 1 1.75 1 1 1.75
//0 1 2 3 4  5  6


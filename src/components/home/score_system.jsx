export const calculateScore = (P1, P2, P3, top5Drivers) => {
    let score1 = 0, score2 = 0;

    // Assign points based on positions
    if (P1 === top5Drivers[0]) score1 += 25; // Exact match for P1
    if (P2 === top5Drivers[1]) score1 += 18; // Exact match for P2
    if (P3 === top5Drivers[2]) score1 += 15; // Exact match for P3

    // Bonus points for predicting any driver in the top 5
    [P1, P2, P3].forEach(prediction => {
        if (top5Drivers.includes(prediction)) {
            score2 += 5; // Add 5 points for correct top-5 drivers
        }
    });

    return { score1, score2 };
};

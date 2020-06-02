const pino = require("pino");

const { wait } = require("../utils");
const ValidatorHistory = require("../../models/ValidatorHistory");

const logger = pino();

async function getRewards(api, eraIndex) {
    try {
        const rewards = await Promise.all(
            eraIndex.map((i) => api.query.staking.erasValidatorReward(i))
        );
        return rewards;
    } catch (error) {
        logger.info(
            `caught error while fetching pointsHistoryWithTotalReward. Retrying in 15s`
        );
        await wait(15000);
        getRewards(api, eraIndex);
    }
}

async function getEraIndexes(api) {
    // get the latest eraIndex from the DB
    const lastIndexDB = await ValidatorHistory.find({})
        .sort({ eraIndex: -1 })
        .limit(1);
    // console.log(lastIndexDB);
    const historyDepth = await api.query.staking.historyDepth();
    const currentEra = await api.query.staking.currentEra();
    const lastAvailableEra = currentEra - historyDepth;
    // console.log(lastAvailableEra);
    // console.log(lastIndexDB.length);
    
    // check whether there is any previous data available inside the DB
    if (lastIndexDB.length !== 0) {
        // console.log(lastIndexDB[0].eraIndex);
        
        // check whether available eraIndex from DB is not very old
        if (lastIndexDB[0].eraIndex >= lastAvailableEra) {
            const indexCount = currentEra - lastIndexDB[0].eraIndex - 1;
            // console.log(indexCount);
            const eraIndex = [...Array(indexCount).keys()].map(
                (i) => i + (lastIndexDB[0].eraIndex + 1)
            );
            return eraIndex;
        }
    }
    const eraIndex = [...Array(historyDepth.toNumber()).keys()].map(
        (i) => i + lastAvailableEra
    );
    return eraIndex;
}

async function storeValidatorHistory(api, eraIndex) {
    const rewardsWithEraIndex = {};
    const totalRewards = await getRewards(api, eraIndex);
    console.log("got total rewards");
    //   console.log(JSON.stringify(totalRewards))
    totalRewards.forEach((x, i) => {
        rewardsWithEraIndex[eraIndex[i]] = x;
    });
    const erasRewardPointsArr = await Promise.all(
        eraIndex.map((i) => api.query.staking.erasRewardPoints(i))
    );

    const pointsHistory = eraIndex.map((i, index) => {
        return { eraIndex: i, erasRewardPoints: erasRewardPointsArr[index] };
    });
    
    console.log("waiting 15s");
    await wait(15000);
    pointsHistory.map((x) => {
        //   console.log(x)
        x.totalReward = rewardsWithEraIndex[x.eraIndex];
        // console.log(x)
        return x;
    });
    //   console.log(JSON.stringify(pointsHistory));
    const pointsHistoryWithTotalReward = JSON.parse(
        JSON.stringify(pointsHistory)
    );

    const valPrefs = {};
    const valExposure = {};
    const rewards = [];

    console.log(pointsHistoryWithTotalReward.length)
    for (let i = 0; i < pointsHistoryWithTotalReward.length; i++) {
        // const element = pointsHistoryWithTotalReward[i];
        console.log("waiting 5 secs");
        await wait(5000);
        valExposure[
            pointsHistoryWithTotalReward[i].eraIndex
        ] = await Promise.all(
            Object.keys(
                pointsHistoryWithTotalReward[i].erasRewardPoints.individual
            ).map((x) =>
                api.query.staking.erasStakers(
                    pointsHistoryWithTotalReward[i].eraIndex,
                    x.toString()
                )
            )
        );
        valPrefs[pointsHistoryWithTotalReward[i].eraIndex] = await Promise.all(
            Object.keys(
                pointsHistoryWithTotalReward[i].erasRewardPoints.individual
            ).map((x) =>
                api.query.staking.erasValidatorPrefs(
                    pointsHistoryWithTotalReward[i].eraIndex,
                    x.toString()
                )
            )
        );

        Object.keys(
            pointsHistoryWithTotalReward[i].erasRewardPoints.individual
        ).forEach((y, index) => {
            //
            // poolReward = eraPoints/totalErapoints * totalReward
            // validatorReward = (eraPoints/totalErapoints * totalReward) * ownStake/totalStake + commission
            //

            // poolreward calculation
            const poolReward =
                (pointsHistoryWithTotalReward[i].erasRewardPoints.individual[
                    y
                ] /
                    pointsHistoryWithTotalReward[i].erasRewardPoints.total) *
                pointsHistoryWithTotalReward[i].totalReward;
            // console.log(poolReward)

            // validator reward calculation
            const validatorReward =
                ((pointsHistoryWithTotalReward[i].erasRewardPoints.individual[
                    y
                ] /
                    pointsHistoryWithTotalReward[i].erasRewardPoints.total) *
                    pointsHistoryWithTotalReward[i].totalReward *
                    parseInt(
                        valExposure[pointsHistoryWithTotalReward[i].eraIndex][
                            index
                        ].own
                    )) /
                    parseInt(
                        valExposure[pointsHistoryWithTotalReward[i].eraIndex][
                            index
                        ].total
                    ) +
                parseInt(
                    valPrefs[pointsHistoryWithTotalReward[i].eraIndex][index]
                        .commission
                );
            // console.log(validatorReward)

            // nominator info calculation
            const nominatorsRewards = valExposure[
                pointsHistoryWithTotalReward[i].eraIndex
            ][index].others.map((x) => {
                const nomId = x.who.toString();
                const nomReward =
                    (((pointsHistoryWithTotalReward[i].erasRewardPoints
                        .individual[y] /
                        pointsHistoryWithTotalReward[i].erasRewardPoints
                            .total) *
                        pointsHistoryWithTotalReward[i].totalReward -
                        parseInt(
                            valPrefs[pointsHistoryWithTotalReward[i].eraIndex][
                                index
                            ].commission
                        )) *
                        parseInt(x.value)) /
                    parseInt(
                        valExposure[pointsHistoryWithTotalReward[i].eraIndex][
                            index
                        ].total
                    );
                return {
                    nomId: nomId,
                    nomReward: nomReward,
                    nomStake: parseInt(x.value),
                };
            });
            // console.log(JSON.stringify(nominatorsRewards))
            rewards.push({
                poolReward: poolReward,
                validatorReward: validatorReward,
                stashId: y,
                totalReward: pointsHistoryWithTotalReward[i].totalReward,
                commission: parseInt(
                    valPrefs[pointsHistoryWithTotalReward[i].eraIndex][index]
                        .commission
                ),
                eraIndex: pointsHistoryWithTotalReward[i].eraIndex,
                eraPoints:
                    pointsHistoryWithTotalReward[i].erasRewardPoints.individual[
                        y
                    ],
                totalEraPoints:
                    pointsHistoryWithTotalReward[i].erasRewardPoints.total,
                nominatorsRewards: nominatorsRewards,
            });
        });
    }
    
    // insert data into DB
    await ValidatorHistory.insertMany(rewards);
    // logger.info(rewards);
}

async function start(api) {
    const eraIndex = await getEraIndexes(api);
    console.log("eraIndex");
    console.log(eraIndex);
    if (eraIndex.length !== 0) {
        await storeValidatorHistory(api, eraIndex);
    }
}

module.exports = { start };

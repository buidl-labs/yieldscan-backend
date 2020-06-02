const mongoose = require("mongoose");

const ValidatorHistory = new mongoose.Schema(
    {
        stashId: String,
        poolReward: Number,
        validatorReward: Number,
        eraIndex: Number,
        commission: Number,
        eraPoints: Number,
        totalEraPoints: Number,
        totalReward: Number,
        nominatorsRewards: [
          {
            nomId: String,
            nomReward: Number,
            nomStake: Number
          }
        ]
    },
	{ timestamps: true }
);

module.exports = mongoose.model("validatorHistory", ValidatorHistory);
const mongoose = require("mongoose");

const Validators = new mongoose.Schema(
	{
		stashId: {
			type: String,
			maxlength: 255
		},
		eraPoints: [
			{
				eraIndex: { type: Number},
				points: { type: Number },
				total: {
					type: Number
				}
			}
		],
		totalStake: {
			type: Number,
			default: 0
		},
		commission: {
			type: Number,
		},
		name: {
			type: String,
			maxlength: 255
		},
		noOfNominators: {
			type: Number
		},
		nominators: [
			{
				stashId: String,
				value: Number
			}
		],
		riskscore: Number
	},
	{ timestamps: true }
);

module.exports = mongoose.model("validators", Validators);
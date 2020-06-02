const ValidatorHistory = require("../models/ValidatorHistory");

exports.getValidatorHistorById = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id)
        const result = await ValidatorHistory.find({ stashId: id }).lean();
        console.log(result);
        
        //If no validator found
        if (!(result.length > 0)) {
            res.json({ message: "No Validator found!", noValidator: true });
            return;
        }
        
        res.json(result);
    } catch (err) {
        res.status(400).send({ error: "Error", err: err });
    }
};

exports.getValidatorHistorByEraIndex = async (req, res) => {
    try {
        const era = req.params.era;
        console.log(era)
        const result = await ValidatorHistory.find({ eraIndex: era }).lean();
        console.log(result);
        
        //If no validator found
        if (!(result.length > 0)) {
            res.json({ message: "No Validator found for this era! ", noValidator: true });
            return;
        }
        
        res.json(result);
    } catch (err) {
        res.status(400).send({ error: "Error", err: err });
    }
};

exports.getValidatorHistorForPreviousEras = async (req, res) => {
    try {
        // max previous 10 era's data allowed to query
        const count = Math.min(req.params.count, 10);
        console.log(count)
        const lastIndexDB = await ValidatorHistory.find({})
        .sort({ eraIndex: -1 })
        .limit(1);
        const lastEraIndexDB = lastIndexDB[0].eraIndex
        const arr = [...Array(count).keys()].map(
            (i) => lastEraIndexDB - i
        );
        const result = await ValidatorHistory.find({ eraIndex: { $in: arr} }).lean();
        console.log(result);
        
        //If no validator found
        if (!(result.length > 0)) {
            res.json({ message: "No Validator found for this eras! ", noValidator: true });
            return;
        }
        
        res.json(result);
    } catch (err) {
        res.status(400).send({ error: "Error", err: err });
    }
};
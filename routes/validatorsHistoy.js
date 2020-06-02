const router = require('express').Router();
const validatorHistoryController = require('../controllers/validatorHistoryController');

router.get('/validator/:id', validatorHistoryController.getValidatorHistorById);
router.get('/previouseras/:count', validatorHistoryController.getValidatorHistorForPreviousEras);
router.get('/eraindex/:era', validatorHistoryController.getValidatorHistorByEraIndex);

module.exports = router;
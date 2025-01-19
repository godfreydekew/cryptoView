const express = require("express");
const { getAccountTransactions, storeTextOnBlockchain, retrieveTextFromBlockchain } = require("../controllers/interview.js");
const requireAuth = require("../middleware/requireAuth.js");

const router = express.Router();

router.use(requireAuth);

router.get("/:address", getAccountTransactions);
router.post("/text", storeTextOnBlockchain);
router.get("/text/:label", retrieveTextFromBlockchain);
module.exports = router;

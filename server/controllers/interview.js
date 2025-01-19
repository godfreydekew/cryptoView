const axios = require("axios");
require("dotenv").config();
const {Transaction, TextData} = require("../models/interviewModels");
const mongoose = require("mongoose");

const isValidDate = (dateString) => {
  //check if date is valid
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const saveTransactions = async (userId, address, transactionsData) => {
  try {
    //to remain with fresh transactions, delete all last 5 transactions
    await Transaction.deleteOne({ user: userId, address: address });

    const transaction = new Transaction({
      user: userId,
      address: address,
      transactions: transactionsData,
    });

    await transaction.save();
    console.log("Transactions saved successfully.");
  } catch (error) {
    console.error("Error saving transactions:", error);
  }
};

const getTransactionsByAddressAndDate = async (address, startDate, endDate) => {
  //get only transactions in the given range
  try {
    const transactions = await Transaction.find({
      address: address,
      "transactions.timeStamp": {
        $gte: new Date(startDate).getTime() / 1000,
        $lte: new Date(endDate).getTime() / 1000,
      },
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
};

const getAccountTransactions = async (req, res) => {
  //get the last 5 transactions
  try {
    const { address } = req.params;
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ error: "No such user" });
    }
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const params = {
      module: "account",
      action: "txlist",
      address: address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 5,
      sort: "desc",
      apikey: process.env.ETHERSCAN_API_KEY,
    };

    console.log("Fetching transactions data for address:", address);
    const response = await axios.get("https://api.etherscan.io/api", {
      params,
    });

    await saveTransactions(userId, address, response.data.result);

    let transactions;

    if (
      startDate &&
      endDate &&
      isValidDate(startDate) &&
      isValidDate(endDate)
    ) {
      transactions = await getTransactionsByAddressAndDate(
        address,
        startDate,
        endDate
      );
    } else {
      //get all 5 tranctions if not stated 
      transactions = response.data.result;
    }

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching transactions data" });
  }
};

const saveTextMetaData = async (userId, hash, label) => {
  try {
    const text = new TextData({
      user: userId,
      cid: hash,
      label: label
    });
    await text.save();
  } catch (error) {
    console.error("Error saving textdata", error);
  }
};
let heliaInstance = null;

// create a singleton, a single instance is created for each server
const getHeliaInstance = async () => {
  if (!heliaInstance) {
    const { createHelia } = await import("helia");
    heliaInstance = await createHelia();
  }
  return heliaInstance;
};

const storeTextOnBlockchain = async (req, res) => {
  try {
    const { text, label } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ error: "No such user" });
    }
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (!label) {
      return res.status(400).json({ error: "Label is required" });
    }

    const existingText = await TextData.findOne({ user: userId, label });

    if (existingText) {
      return res.status(400).json({ error: "Label already exists for this user" });
    }

    const { strings } = await import("@helia/strings");

    const helia = await getHeliaInstance();
    const s = strings(helia);

    const myImmutableAddress = await s.add(text);
    saveTextMetaData(userId, myImmutableAddress.toString(), label)

    res.status(201).json({
      message: "Text stored successfully",
      hash: myImmutableAddress.toString(),
    });
  } catch (error) {
    console.error("Error storing text on blockchain:", error);
    res.status(500).json({ error: "An error occurred while storing the text" });
  }
};

const retrieveTextFromBlockchain = async (req, res) => {
  try {
    const { label } = req.params;
    const userId = req.user.id; 

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ error: "No such user" });
    }
    if (!label) {
      return res.status(400).json({ error: "Label is required" });
    }

    const textData = await TextData.findOne({ user: userId, label });
    if (!textData) {
      return res.status(404).json({ error: "No text found with the given label" });
    }

    const hash = textData.cid;

    const { strings } = await import("@helia/strings");
    const { CID } = await import("multiformats/cid");

    console.log("Dependencies imported successfully");

    const helia = await getHeliaInstance();
    const s = strings(helia);

    console.log("Helia instance created");

    //change hash from string to CID object
    const cid = CID.parse(hash);
    console.log("Parsed CID:", cid);

    const retrievedText = await s.get(cid);
    console.log("Retrieved text:", retrievedText);

    if (!retrievedText) {
      return res
        .status(404)
        .json({ error: "Text not found for the provided hash" });
    }

    res.status(200).json({
      message: "Text retrieved successfully",
      data: retrievedText,
    });
  } catch (error) {
    console.error("Error retrieving text from blockchain:", error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the text" });
  }
};

module.exports = {
  storeTextOnBlockchain,
  retrieveTextFromBlockchain,
  getAccountTransactions,
};

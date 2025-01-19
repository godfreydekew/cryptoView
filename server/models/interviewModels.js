const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    transactions: [
      {
        blockNumber: {
          type: String,
          required: true,
        },
        timeStamp: {
          type: Date,
          required: true,
          get: (timestamp) => new Date(timestamp * 1000),
        },
        hash: {
          type: String,
          required: true,
          unique: true,
        },
        nonce: {
          type: Number,
          required: true,
        },
        blockHash: {
          type: String,
          required: true,
        },
        transactionIndex: {
          type: Number,
          required: true,
        },
        from: {
          type: String,
          required: true,
        },
        to: {
          type: String,
          default: null,
        },
        value: {
          type: String,
          required: true,
        },
        gas: {
          type: String,
          required: true,
        },
        gasPrice: {
          type: String,
          required: true,
        },
        isError: {
          type: Boolean,
          required: true,
        },
        txreceipt_status: {
          type: Boolean,
          required: true,
        },
        input: {
          type: String,
          required: true,
        },
        contractAddress: {
          type: String,
          default: null,
        },
        cumulativeGasUsed: {
          type: String,
          required: true,
        },
        gasUsed: {
          type: String,
          required: true,
        },
        confirmations: {
          type: Number,
          required: true,
        },
        methodId: {
          type: String,
          required: true,
        },
        functionName: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const textSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cid: {
      type: String,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);
const TextData = mongoose.model("TextData", textSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = { Transaction, TextData };

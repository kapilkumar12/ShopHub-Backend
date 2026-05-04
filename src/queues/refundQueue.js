const { Queue } = require("bullmq");
const connection = require("../config/redis");

const refundQueue = new Queue("refundQueue", {
  connection:{
    url: process.env.REDIS_URL,
  },
});

module.exports = refundQueue;
const { Queue } = require("bullmq");
const connection = require("../config/redis");

const refundQueue = new Queue("refundQueue", {
  connection,
});

module.exports = refundQueue;
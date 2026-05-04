const { Queue } = require("bullmq");
const connection = require("../config/redis");

const refundQueue = new Queue("refundQueue", {
  connection:{
    url: process.env.UPSTASH_REDIS_REST_URL,
  },
});

module.exports = refundQueue;
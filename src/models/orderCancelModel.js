const mongoose = require('mongoose')


const orderCancelSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
     order:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Order",
        required:true,
    },
    reason:{
        type:String,
        required:true
    },
    status:{
         type: String,
    enum: ["Requested", "Approved", "Rejected"],
    default: "Requested"
    }
}, {
    timestamps:true
})

const orderCancelModel = mongoose.model("OrderCancel",orderCancelSchema)

module.exports = orderCancelModel
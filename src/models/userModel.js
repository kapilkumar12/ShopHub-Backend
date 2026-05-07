const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
   name:{
      type: String,
      required: [true, "Name is required"],
      maxLength: [30, "Name cannot exceed 30 characters"]
   },
   email:{
      type:String,
      required: [true, "Email is required"],
      math:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please Enter a valid Email"],
      unique: true
   },
   password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password should be greater than 8 characters"],
      match: [
         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
         "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
      ],
   },
   isVerified: {
      type: Boolean,
      default: false
   },
   role: {
  type: String,
  enum: ["user", "admin"],
  default: "user"
}
},{
    timestamps: true
});

  userSchema.pre('save', async function(){
    if(!this.isModified('password')) return;
    try {
       const hash = await bcrypt.hash(this.password, 10);
       this.password = hash;
    } catch (error) {
       throw error;
    }
});


userSchema.methods.comparePassword = async function(password){
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
}

const userModel = mongoose.model("User", userSchema)

module.exports = userModel
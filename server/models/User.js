const mongoose = require("mongoose");

const UserSchema= new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            minlength:3,
            maxlength:20,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
        },
        password:{
            type:String,
            required:true,
            minlength:6,
        },
        avatar:{
            type:String,
            default:"",
        },
        bio:{
            type:String,
            default:"",
            maxlength:150,
        },
        totalStudyTime:{
            type:Number,
            default:0,
        },
        dailyStudyLog:[
            {
                date:{type:String},
                minutes:{type:Number,default:0},
            },
        ],
        roomsJoined:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Room",
            },
        ],
        savedMessages:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Message",
            },
        ],
        mutedRooms: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Room",
            },
        ],
        favoriteRooms: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Room",
            },
        ],
    },
    {timestamps:true}
);

module.exports = mongoose.model("User",UserSchema);
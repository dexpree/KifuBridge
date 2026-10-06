const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
{
    reportedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    againstUser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:null
    },

    donation:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Donation",
        default:null
    },

    title:{
        type:String,
        required:true
    },

    description:{
        type:String,
        required:true
    },

    category:{
        type:String,
        enum:[
            "Volunteer",
            "NGO",
            "Donor",
            "Donation",
            "Platform"
        ],
        required:true
    },

    priority:{
        type:String,
        enum:["Low","Medium","High"],
        default:"Medium"
    },

    status:{
        type:String,
        enum:[
            "Pending",
            "In Progress",
            "Resolved"
        ],
        default:"Pending"
    },

    adminReply:{
        type:String,
        default:""
    }

},
{
timestamps:true
}
);

module.exports=mongoose.model(
"Complaint",
complaintSchema
);
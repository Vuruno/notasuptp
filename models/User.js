const mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate')

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true
  },
  name: {
    type: Object,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  enrolled: [{
    id: {
      type: String,
      default: null
    },
    subject: {
      type: String,
      default: null
    }
  }]
});

UserSchema.plugin(findOrCreate);

const User = mongoose.model('User', UserSchema);

module.exports = User;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');
// ======== Updated cryptographic hash ========
const md5 = require('md5');
const mongodbErrorHandler = require('mongoose-mongodb-errors');

//========= Spelling Correction =========
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.Promise = global.Promise;

//========= Working With userSchema ==========

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please Supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  },
  // ======== Aded reset password tokens ==========
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// ========== Added passportLocalMongoose and mongodbErrorHandler ==========
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

// ========= virtualFieldsSchema updated  ========
userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);

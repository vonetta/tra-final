const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login',
  successRedirect: '/',
  successFlash: 'You are now logged in'
});
// ========= Added logout =========
exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out');
  res.redirect('/');
};

//========= Add middleware to check if the user is logged in ========
exports.isLoggedIn = (req, res, next) => {
  // ========= first check if the user is authenticated =========
  if (req.isAuthenticated()) {
    next(); // ========= if all good. user is logged in =========
    return;
  }
  req.flash('error', 'You must be logged in to perform that action');
  res.redirect('/login');
};

// ======== Added forgot password =========

exports.forgotPassword = async (req, res) => {
  // 1. See if a user with that email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'No account with that email exists');
    return res.redirect('/login');
  }
  // 2. Set reset tokens and expiration date on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();
  // 3. Send them an email with the token
  const resetURL = `http://${req.headers
    .host}/account/reset/${user.resetPasswordToken}`;
  req.flash(
    'success',
    `You have been emailed a password reset link. ${resetURL}`
  );
  // 4. redirect to login page
  res.redirect('/login');
};
// ========= Addeded exports.reset =========
exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  // view the user object
  console.log(user); // ADD THIS LINE
  // if there is a user, show the reset password form
  res.render('reset', { title: 'Reset your Password' });
};
// ======== Added conformedPasswodrd =========
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next(); // keep it going!
    return;
  }
  req.flash('error', 'Passwords do not match');
  res.redirect('back');
};
// ========= Added expors Update =========
exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  });

  if (!user) {
    req.flash('error', 'Password reset invalid or has expired');
    return res.redirect('/login');
  }

  const setPasswordPromisify = promisify(user.setPassword, user);
  await setPasswordPromisify(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Your password has been reset! You are now logged in');
  res.redirect('/');
};

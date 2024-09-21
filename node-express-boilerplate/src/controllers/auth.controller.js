const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const config = require('../config/config');


const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  
  // Generate email verification token
  console.log("generating verification token for new user");
  const verificationToken = await tokenService.generateVerifyEmailToken(user);
  
  // Send verification email
  console.log("awaiting email send");
  await emailService.sendVerificationEmail(user.email, verificationToken);
  console.log("finish email send");
  
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const { verifyingNewUser = true, newEmail = null } = req.body; // Get flag and new email if provided
  const user = await userService.getUserById(req.user.id);
  
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // If we are verifying a new user, check if email is already verified
  if (verifyingNewUser && user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already verified');
  }

  // If the flag is false, we are updating the email, so handle new email
  if (!verifyingNewUser) {
    if (!newEmail) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New email is required');
    }

    // Ensure the new email doesn't belong to another user
    const existingUser = await userService.getUserByEmail(newEmail);
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already taken');
    }

    // Store new email in the `unverifiedEmail` field
    user.unverifiedEmail = newEmail;
    await user.save();
  }

  // Generate a new email verification token
  const verificationToken = await tokenService.generateVerifyEmailToken(user);

  // Send verification email to either the new email or the existing one
  const emailToVerify = newEmail || user.email;
  await emailService.sendVerificationEmail(emailToVerify, verificationToken);
  
  res.status(httpStatus.NO_CONTENT).send();
});



const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;
  
  try {
    const payload = jwt.verify(token, config.jwt.secret); // Decode token
    
    // Find the user by ID from token payload
    const user = await userService.getUserById(payload.sub);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    
    // Check if this is a verification for a new email
    if (user.unverifiedEmail) {
      console.log("user unverified email is nu")
      user.email = user.unverifiedEmail;  // Move unverifiedEmail to primary email
      user.unverifiedEmail = null;        // Clear the unverifiedEmail field
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();
    
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }
});


module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};

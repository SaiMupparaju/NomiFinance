//user.controller.js: 
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const DeleteReason = require('../models/deleteReason.model');
const { userService } = require('../services');
const {User} = require('../models');
const {cleanupUserSubscription} = require('../utils/SubscriptionCleanup');


const getUserSubscriptionById = async (id) => {
  return User.findById(id).select(
    'subscriptionId subscriptionStatus subscriptionPlan subscriptionProductId subscriptionPriceId'
  );
};

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUserProfile = catchAsync(async (req, res) => {
  // The authenticated user's ID is available in req.user.id
  const user = await userService.getUserById(req.user.id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getSubscriptionDetails = catchAsync(async (req, res) => {
  const userId = req.user.id; // Assuming you're using JWT and have the user ID in req.user

  const user = await getUserSubscriptionById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).send(user);
});



const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.userId;

  // Ensure that the user can only delete their own account or admin can delete any account
  if (req.user.id !== userId && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own account');
  }

  // Fetch the user to get email and other info before deletion
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    // Handle subscription cleanup if it exists
    if (user.subscriptionId && user.stripeCustomerId) {
      await cleanupUserSubscription(user);
    }

    // Save the delete reason if provided
    const { reason } = req.body;
    if (reason && reason.trim() !== '') {
      await DeleteReason.create({
        userId: user._id,
        email: user.email,
        reason: reason.trim(),
      });
    }

    // Delete the user (this will trigger the cascade)
    await userService.deleteUserById(userId);

    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    console.error('Error during user deletion:', error);
    if (error.type === 'StripeError') {

      console.error('Stripe cleanup failed but proceeding with user deletion:', error);
      await userService.deleteUserById(userId);
      res.status(httpStatus.NO_CONTENT).send();
    } else {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to delete user account'
      );
    }
  }
});


const getPlaidToken = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const plaidToken = user.plaidAccessToken;
  if (!plaidToken) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plaid access token not found');
  }
  res.send({ plaidToken });
});


module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getPlaidToken,
  getUserProfile,
  getSubscriptionDetails,
  getUserSubscriptionById,
};

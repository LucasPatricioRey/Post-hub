const request = require("supertest");

const app = require("../../app");
const User = require("../../models/User");
const generateToken = require("../../utils/generateToken");

const {
  fakeUser,
  fakeAdmin,
  fakePost,
  fakeComment,
} = require("./testData");

const registerUser = async (overrides = {}) => {
  const data = fakeUser(overrides);

  const response = await request(app)
    .post("/api/auth/register")
    .send(data);

  return {
    response,
    data,
    user: response.body.user,
    token: response.body.token,
  };
};

const createAdminAndToken = async (overrides = {}) => {
  const data = fakeAdmin(overrides);

  const admin = await User.create(data);
  const token = generateToken(admin._id);

  return {
    data,
    user: admin,
    token,
  };
};

const createPost = async (token, overrides = {}) => {
  const data = fakePost(overrides);

  const response = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send(data);

  return {
    response,
    data,
    post: response.body.post,
  };
};

const createComment = async (token, postId, overrides = {}) => {
  const data = fakeComment(overrides);

  const response = await request(app)
    .post(`/api/posts/${postId}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send(data);

  return {
    response,
    data,
    comment: response.body.comment,
  };
};

module.exports = {
  registerUser,
  createAdminAndToken,
  createPost,
  createComment,
};
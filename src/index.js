"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./modules/main");
const exchangeAccessTokenForUserToken = main_1.exchangeAccessTokenForUserToken;
const exchangeUserTokenForXSTSIdentity = main_1.exchangeUserTokenForXSTSIdentity;
const authenticate = main_1.authenticate;

export default {
  exchangeAccessTokenForUserToken,
  exchangeUserTokenForXSTSIdentity,
  authenticate
};


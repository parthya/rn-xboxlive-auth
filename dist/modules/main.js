"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("superagent");
const agent = request.agent();
const XboxLiveAuthError = require("./errors");
const querystring_1 = require("query-string");
const main_1 = require("./__typings__/main");
const { version } = require("../../package.json");
const USER_AGENT = `Mozilla/5.0 (XboxReplay; XboxLiveAuth ${version}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36`;

const _getMatchForIndex = (entry, regex, index = 0) => {
    const match = entry.match(regex);
    if (match === null)
        return null;
    if (match[index] === void 0)
        return null;
    return String(match[index] || '');
};
const _preAuth = () => new Promise((resolve, reject) => {
    const authorizeQuery = {
        client_id: '0000000048093EE3',
        redirect_uri: 'https://login.live.com/oauth20_desktop.srf',
        response_type: 'token',
        scope: 'service::user.auth.xboxlive.com::MBI_SSL',
        display: 'touch',
        locale: 'en'
    };

    agent
      .get(main_1.LiveEndpoints.Authorize +
            '?' +
            unescape(querystring_1.stringify(authorizeQuery)))
      .accept('text/html; charset=utf-8')
      .set('Accept-Language','en-US')
      .set('User-Agent',USER_AGENT)
      .then(res => {
         const matches = {
            PPFT: _getMatchForIndex(res.text, /sFTTag:'.*value=\"(.*)\"\/>'/, 1),
            urlPost: _getMatchForIndex(res.text, /urlPost:'([A-Za-z0-9:\?_\-\.&\\/=]+)/, 1)
          };
          if (matches.PPFT === null) {
            return reject(XboxLiveAuthError.matchError('Cannot match "PPFT" parameter'));
          }
          else if (matches.urlPost === null) {
            return reject(XboxLiveAuthError.matchError('Cannot match "urlPost" parameter'));
          }

          return resolve({
            set_cookie: res.headers['set-cookie'],
            matches: matches
          });
      })
      .catch(err => {
         if (err)
            return reject(XboxLiveAuthError.internal(err.message));
      });
});

const _logUser = (preAuthResponse, credentials) => new Promise((resolve, reject) => {
    agent
      .post(preAuthResponse.matches.urlPost)
      .send(`login=${credentials.email}`)
      .send(`loginfmt=${credentials.email}`)
      .send(`passwd=${credentials.password}`)
      .send(`PPFT=${preAuthResponse.matches.PPFT}`)
      .accept('text/html; charset=utf-8')
      .set('Accept-Language','en-US')
      .set('User-Agent',USER_AGENT)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Cookie', preAuthResponse.set_cookie)
      .then(res => {
          const responseURL = res.req.xhr.responseURL;
          if (responseURL === void 0) {
              return reject(XboxLiveAuthError.invalidCredentials());
          }
          const matches = {
              accessToken: _getMatchForIndex(responseURL, /access_token=(.+?)&/, 1),
              refreshToken: _getMatchForIndex(responseURL, /refresh_token=(.+?)&/, 1)
          };
          if (matches.accessToken === null) {
              return reject(XboxLiveAuthError.matchError('Cannot match "access_token" parameter'));
          }
          return resolve(matches);
      })
      .catch(err => {
        console.log(err);
        if (err)
            return reject(XboxLiveAuthError.internal(err.message));
      });
});

exports.exchangeAccessTokenForUserToken = (accessToken) => new Promise((resolve, reject) => {
  agent
    .post(main_1.XboxLiveEndpoints.UserAuthenticate)
    .send({
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
        Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: accessToken
        }
    })
    .accept('text/html; charset=utf-8')
    .set('Accept-Language','en-US')
    .set('User-Agent',USER_AGENT)
    .set({'x-xbl-contract-version': 0})
    .then(res => {
      if (res.statusCode !== 200) {
        return reject(XboxLiveAuthError.exchangeFailure('Cannot exchange "accessToken"'));
      }
      const body = JSON.parse(res.text);
      return resolve(body.Token);
    })
    .catch(err => {
      if (err)
          return reject(XboxLiveAuthError.internal(err.message));
    });
});

exports.exchangeUserTokenForXSTSIdentity = (userToken, XSTSRelyingParty = 'http://xboxlive.com') => new Promise((resolve, reject) => {
  agent
    .post(main_1.XboxLiveEndpoints.XSTSAuthorize)
    .send({
        RelyingParty: XSTSRelyingParty,
        TokenType: 'JWT',
        Properties: {
            UserTokens: [userToken],
            SandboxId: 'RETAIL'
        }
    })
    .accept('text/html; charset=utf-8')
    .set('Accept-Language','en-US')
    .set('User-Agent',USER_AGENT)
    .set({'x-xbl-contract-version': 0})
    .then(res => {
      if (res.statusCode !== 200) {
        return reject(XboxLiveAuthError.exchangeFailure('Cannot exchange "userToken"'));
      }

      const body = JSON.parse(res.text);
      return resolve({
          userHash: String(body.DisplayClaims.xui[0].uhs),
          XSTSToken: String(body.Token)
      });
    })
    .catch(err => {
      if (err)
          return reject(XboxLiveAuthError.internal(err.message));
    });
});
exports.authenticate = (email, password, options = {}) => __awaiter(this, void 0, void 0, function* () {
    const preAuthResponse = yield _preAuth();
    const logUser = yield _logUser(preAuthResponse, { email, password });
    const userToken = yield exports.exchangeAccessTokenForUserToken(logUser.accessToken);
    return exports.exchangeUserTokenForXSTSIdentity(userToken, options.XSTSRelyingParty);
});

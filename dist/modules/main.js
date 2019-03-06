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
const XboxLiveAuthError = require("./errors");
const fs_1 = require("react-native-fs");
const querystring_1 = require("query-string");
const main_1 = require("./__typings__/main");
const { version } = JSON.parse(fs_1.readFileSync('package.json', 'utf-8'));
const USER_AGENT = `Mozilla/5.0 (XboxReplay; XboxLiveAuth ${version}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36`;
const BASE_HEADERS = {
    Accept: 'text/html; charset=utf-8',
    'Accept-Language': 'en-US',
    'User-Agent': USER_AGENT
};
const _getMatchForIndex = (entry, regex, index = 0) => {
    const match = entry.match(regex);
    if (match === null)
        return null;
    if (match[index] === void 0)
        return null;
    return String(match[index] || '');
};
const _preAuth = () => new Promise((resolve, reject) => {
    const jar = request.jar();
    const authorizeQuery = {
        client_id: '0000000048093EE3',
        redirect_uri: 'https://login.live.com/oauth20_desktop.srf',
        response_type: 'token',
        scope: 'service::user.auth.xboxlive.com::MBI_SSL',
        display: 'touch',
        locale: 'en'
    };
    request({
        uri: main_1.LiveEndpoints.Authorize +
            '?' +
            unescape(querystring_1.stringify(authorizeQuery)),
        headers: BASE_HEADERS,
        jar
    }, (err, _, body) => {
        if (err)
            return reject(XboxLiveAuthError.internal(err.message));
        const matches = {
            PPFT: _getMatchForIndex(body, /sFTTag:'.*value=\"(.*)\"\/>'/, 1),
            urlPost: _getMatchForIndex(body, /urlPost:'([A-Za-z0-9:\?_\-\.&\\/=]+)/, 1)
        };
        if (matches.PPFT === null) {
            return reject(XboxLiveAuthError.matchError('Cannot match "PPFT" parameter'));
        }
        else if (matches.urlPost === null) {
            return reject(XboxLiveAuthError.matchError('Cannot match "urlPost" parameter'));
        }
        return resolve({
            jar,
            matches: matches
        });
    });
});
const _logUser = (preAuthResponse, credentials) => new Promise((resolve, reject) => {
    request({
        uri: preAuthResponse.matches.urlPost,
        method: 'POST',
        followRedirect: false,
        headers: Object.assign({}, BASE_HEADERS, { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: preAuthResponse.jar.getCookieString(main_1.LiveEndpoints.Authorize) }),
        body: querystring_1.stringify({
            login: credentials.email,
            loginfmt: credentials.email,
            passwd: credentials.password,
            PPFT: preAuthResponse.matches.PPFT
        })
    }, (err, response) => {
        if (err)
            return reject(XboxLiveAuthError.internal(err.message));
        const location = response.headers.location;
        if (location === void 0) {
            return reject(XboxLiveAuthError.invalidCredentials());
        }
        const matches = {
            accessToken: _getMatchForIndex(location, /access_token=(.+?)&/, 1),
            refreshToken: _getMatchForIndex(location, /refresh_token=(.+?)&/, 1)
        };
        if (matches.accessToken === null) {
            return reject(XboxLiveAuthError.matchError('Cannot match "access_token" parameter'));
        }
        return resolve(matches);
    });
});
exports.exchangeAccessTokenForUserToken = (accessToken) => new Promise((resolve, reject) => {
    request({
        uri: main_1.XboxLiveEndpoints.UserAuthenticate,
        method: 'POST',
        headers: Object.assign({}, BASE_HEADERS, { 'x-xbl-contract-version': 0 }),
        json: {
            RelyingParty: 'http://auth.xboxlive.com',
            TokenType: 'JWT',
            Properties: {
                AuthMethod: 'RPS',
                SiteName: 'user.auth.xboxlive.com',
                RpsTicket: accessToken
            }
        }
    }, (err, response, body) => {
        if (err)
            return reject(XboxLiveAuthError.internal(err.message));
        else if (response.statusCode !== 200)
            return reject(XboxLiveAuthError.exchangeFailure('Cannot exchange "accessToken"'));
        return resolve(body.Token);
    });
});
exports.exchangeUserTokenForXSTSIdentity = (userToken, XSTSRelyingParty = 'http://xboxlive.com') => new Promise((resolve, reject) => {
    request({
        uri: main_1.XboxLiveEndpoints.XSTSAuthorize,
        method: 'POST',
        headers: Object.assign({}, BASE_HEADERS, { 'x-xbl-contract-version': 0 }),
        json: {
            RelyingParty: XSTSRelyingParty,
            TokenType: 'JWT',
            Properties: {
                UserTokens: [userToken],
                SandboxId: 'RETAIL'
            }
        }
    }, (err, response, body) => {
        if (err)
            return reject(XboxLiveAuthError.internal(err.message));
        else if (response.statusCode !== 200)
            return reject(XboxLiveAuthError.exchangeFailure('Cannot exchange "userToken"'));
        return resolve({
            userHash: String(body.DisplayClaims.xui[0].uhs),
            XSTSToken: String(body.Token)
        });
    });
});
exports.authenticate = (email, password, options = {}) => __awaiter(this, void 0, void 0, function* () {
    const preAuthResponse = yield _preAuth();
    const logUser = yield _logUser(preAuthResponse, { email, password });
    const userToken = yield exports.exchangeAccessTokenForUserToken(logUser.accessToken);
    return exports.exchangeUserTokenForXSTSIdentity(userToken, options.XSTSRelyingParty);
});

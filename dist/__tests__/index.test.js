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
const XboxLiveAuth = require("../");
beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});
it('should authenticate with success', () => __awaiter(this, void 0, void 0, function* () {
    const authorization = {
        userHash: '1234567890123456',
        XSTSToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.WyJBcmUgeW91IGxvb2tpbmcgZm9yIHNvbWV0aGluZz8iXQ.OfRjqsoMbmeksokqRHXE7BgjblODCZ-m0c5PQ3PIFWc'
    };
    const mock = jest.spyOn(XboxLiveAuth, 'authenticate');
    mock.mockReturnValueOnce(new Promise(resolve => resolve(authorization)));
    const response = yield XboxLiveAuth.authenticate('email', 'password');
    expect(response).toEqual(authorization);
}));
it('should exchange "accessToken" for "userToken"', () => __awaiter(this, void 0, void 0, function* () {
    const userToken = 'EwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoA';
    const mock = jest.spyOn(XboxLiveAuth, 'exchangeAccessTokenForUserToken');
    mock.mockReturnValueOnce(new Promise(resolve => resolve(userToken)));
    const response = yield XboxLiveAuth.exchangeAccessTokenForUserToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.WyJaZW55IElDIl0.uhbX3bSPxuuAsz3wxWPIsdzlczxI1LHRGFaX1HoBnzM');
    expect(response).toEqual(userToken);
}));
it('should exchange "userToken" for "XSTSIdentity"', () => __awaiter(this, void 0, void 0, function* () {
    const authorization = {
        userHash: '1234567890123456',
        XSTSToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.WyJBcmUgeW91IGxvb2tpbmcgZm9yIHNvbWV0aGluZz8iXQ.OfRjqsoMbmeksokqRHXE7BgjblODCZ-m0c5PQ3PIFWc'
    };
    const mock = jest.spyOn(XboxLiveAuth, 'exchangeUserTokenForXSTSIdentity');
    mock.mockReturnValueOnce(new Promise(resolve => resolve(authorization)));
    const response = yield XboxLiveAuth.exchangeUserTokenForXSTSIdentity('EwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoAEwAoA');
    expect(response).toEqual(authorization);
}));
it('should try to authenticate, and fail', () => __awaiter(this, void 0, void 0, function* () {
    try {
        yield XboxLiveAuth.authenticate('email', 'password');
    }
    catch (err) {
        expect(err.message).toMatch('Invalid credentials');
    }
}));
it('should try to exchange "accessToken", and fail', () => __awaiter(this, void 0, void 0, function* () {
    try {
        yield XboxLiveAuth.exchangeAccessTokenForUserToken('fake');
    }
    catch (err) {
        expect(err.message).toMatch('Cannot exchange "accessToken"');
    }
}));
it('should try to exchange "userToken", and fail', () => __awaiter(this, void 0, void 0, function* () {
    try {
        yield XboxLiveAuth.exchangeUserTokenForXSTSIdentity('fake');
    }
    catch (err) {
        expect(err.message).toMatch('Cannot exchange "userToken"');
    }
}));

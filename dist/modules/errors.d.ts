import { IExtraErrorProperties } from './__typings__/errors';
declare class XboxLiveAuthError extends Error {
    XBLAuthError: boolean;
    extra: any;
    constructor(message?: string, extra?: IExtraErrorProperties);
}
declare const errors: {
    internal: (message?: string) => XboxLiveAuthError;
    matchError: (message?: string) => XboxLiveAuthError;
    invalidCredentials: (message?: string) => XboxLiveAuthError;
    exchangeFailure: (message?: string) => XboxLiveAuthError;
};
export = errors;

import { IExchangeUserTokenResponse, IAuthUserResponse, IAuthOptions } from './__typings__/main';
export declare const exchangeAccessTokenForUserToken: (accessToken: string) => Promise<string>;
export declare const exchangeUserTokenForXSTSIdentity: (userToken: string, XSTSRelyingParty?: string) => Promise<IExchangeUserTokenResponse>;
export declare const authenticate: (email: string, password: string, options?: IAuthOptions) => Promise<IAuthUserResponse>;

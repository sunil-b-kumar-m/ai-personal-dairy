declare module "passport-microsoft" {
  import { Strategy as PassportStrategy } from "passport";

  interface MicrosoftStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  type VerifyCallback = (
    error: Error | null,
    user?: Express.User | false,
    info?: { message: string },
  ) => void;

  type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      displayName?: string;
      emails?: { value: string }[];
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ) => void;

  class Strategy extends PassportStrategy {
    constructor(options: MicrosoftStrategyOptions, verify: VerifyFunction);
  }

  export default Strategy;
  export { Strategy };
}

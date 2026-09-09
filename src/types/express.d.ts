import { JwtPayload } from '../utils/jwt.util';

// Augment Express's Request type so `req.user` is strongly typed
// after the auth middleware attaches the decoded JWT payload.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};

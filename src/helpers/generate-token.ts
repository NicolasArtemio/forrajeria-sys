// test/helpers/generate-token.ts
import * as jwt from 'jsonwebtoken';
import { jwtConstants } from '../../src/auth/constants';

interface TokenPayload {
  sub: number;
  username: string;
  role: string;
}

export function generateToken(payload: TokenPayload, expiresIn = '1h'): string {
  return jwt.sign(payload, jwtConstants.secret, { expiresIn }  as any);
}

import * as bcrypt from 'bcrypt'
export class BcryptHelper {
    private static readonly SALTS_ROUNDS = 10

    static async hashPassword(password:string):Promise<string> {
        return bcrypt.hash(password, this.SALTS_ROUNDS);
    }

    comparePassword(){}
}
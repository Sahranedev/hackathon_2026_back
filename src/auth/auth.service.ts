import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../common/password.util';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByMail(createUserDto.mail);
    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    if (!createUserDto.password) {
      throw new BadRequestException('Le mot de passe est requis');
    }

    return this.usersService.create(createUserDto);
  }

  async signIn(loginDto: LoginDto) {
    const user = await this.usersService.findByMail(loginDto.mail);
    if (!user?.password) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await verifyPassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { sub: user.id, email: user.mail, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  generateToken() {
    const payload = { role: 'admin' };
    return this.jwtService.sign(payload);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { hashPassword } from '../common/password.util';
import { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType } from '../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUserProfile, SafeUser } from './types/safe-user.type';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const data = createUserDto.password
      ? {
          ...createUserDto,
          password: await hashPassword(createUserDto.password),
        }
      : createUserDto;

    const user = await this.prisma.user.create({ data });

    return this.toSafeUser(user);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
    });

    return users.map((user) => this.toSafeUser(user));
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.toSafeUser(user);
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByMail(mail: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { mail },
    });
  }

  async getCurrentUserProfile(id: number): Promise<CurrentUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mail: true,
        roles: true,
        accountType: true,
        points: true,
        currentTier: true,
        referralCode: true,
        stravaAccount: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const { stravaAccount, ...safeUser } = user;

    return {
      ...safeUser,
      stravaLinked: stravaAccount !== null,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return this.toSafeUser(user);
  }

  async updateAccountType(
    id: number,
    accountType: AccountType,
  ): Promise<SafeUser> {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { accountType },
    });

    return this.toSafeUser(user);
  }

  async remove(id: number): Promise<SafeUser> {
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
    });

    return this.toSafeUser(user);
  }

  toSafeUser(user: User): SafeUser {
    const { password, ...safeUser } = user;

    return safeUser;
  }
}

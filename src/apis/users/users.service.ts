import { CreateCommonUserInput } from './dto/createCommonUser.input';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
  CACHE_MANAGER,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput } from './dto/createUser.input';
import { User, USER_TYPE_ENUM } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { ISmsToken, SMS_TOKEN_KEY_PREFIX } from 'src/common/types/auth.types';
import { CreateCreatorInput } from './dto/createCreator.input';
import axios from 'axios';
import { Point, POINT_STATUS_ENUM } from '../points/entities/point.entity';
import { PointsService } from '../points/points.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(Point)
    private readonly pointsRepository: Repository<Point>,

    private readonly pointsService: PointsService,
  ) {}

  private readonly encryptPassword = async (inputPassword): Promise<string> => {
    //LOGGING
    console.log(new Date(), ' | UsersService.encryptPassword()');

    return await bcrypt.hash(inputPassword, parseInt(process.env.BCRYPT_SALT));
  };

  async findAllCreator({ page }) {
    //LOGGING
    console.log(new Date(), ' | UsersService.findAllCreator()');

    if (!page)
      return await this.usersRepository
        .createQueryBuilder('user')
        .where('user.userType = :userType', {
          userType: USER_TYPE_ENUM.CREATOR,
        })
        .getMany();

    return await this.usersRepository
      .createQueryBuilder('user')
      .where('user.userType = :userType', { userType: USER_TYPE_ENUM.CREATOR })
      .skip((page - 1) * 6)
      .take(6)
      .getMany();
  }

  async findOneByUserId(userId) {
    //LOGGING
    console.log(new Date(), ' | UsersService.findOneByUserId()');

    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async findAllCreatorBySnsType({ snsType }) {
    //LOGGING
    console.log(new Date(), ' | UsersService.findAllCreatorBySnsType()');

    return await this.usersRepository
      .createQueryBuilder('user')
      .where('user.userType = :userType', { userType: USER_TYPE_ENUM.CREATOR })
      .andWhere('user.snsChannel = :snsType', { snsType })
      .getMany();
  }

  async findOneByEmail(email) {
    //LOGGING
    console.log(new Date(), ' | UsersService.findOneByEmail()');

    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByNickName(nickname) {
    //LOGGING
    console.log(new Date(), ' | UsersService.findOneByNickName()');

    return this.usersRepository.findOne({ where: { nickname } });
  }

  async isSameLoginPassword(userId, password) {
    //LOGGING
    console.log(new Date(), ' | UsersService.isSameLoginPassword()');

    const user = await this.findOneByUserId(userId);
    return await bcrypt.compare(password, user.password);
  }

  private async checkSmsAuth(phoneNumber: string, signupId: string) {
    //LOGGING
    console.log(new Date(), ' | UsersService.checkSmsAuth()');

    const smsToken: ISmsToken = await this.cacheManager.get(
      SMS_TOKEN_KEY_PREFIX + phoneNumber,
    );

    if (!smsToken || !smsToken?.isAuth || smsToken?.signupId !== signupId)
      return false;

    await this.cacheManager.del(SMS_TOKEN_KEY_PREFIX + phoneNumber);

    return true;
  }

  async checkUserBeforeCreate(
    signupId: string,
    createUserInput:
      | CreateUserInput
      | CreateCommonUserInput
      | CreateCreatorInput,
  ) {
    //LOGGING
    console.log(new Date(), ' | UsersService.checkUserBeforeCreate()');

    const user = await this.usersRepository.findOne({
      where: { email: createUserInput.email },
    });
    if (user) throw new ConflictException('이미 등록된 아이디입니다.');

    const isValidSmsAuth = await this.checkSmsAuth(
      createUserInput.phoneNumber,
      signupId,
    );
    if (!isValidSmsAuth) {
      throw new UnprocessableEntityException(
        '핸드폰 번호가 인증되지 않았거나 존재하지 않습니다',
      );
    }
  }
  async getYoutubeInfo({ chennelId }) {
    //LOGGING
    console.log(new Date(), ' | UsersService.getYoutubeInfo()');

    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: {
          part: 'snippet,statistics',
          id: chennelId,
          key: process.env.YOUTUBE_API_KEY,
          fields:
            'items(snippet(title, description),statistics(viewCount,subscriberCount,videoCount,hiddenSubscriberCount))',
        },
      },
    );

    return data;
  }

  async createUserInFinalStep(
    createUserInput:
      | CreateUserInput
      | CreateCommonUserInput
      | CreateCreatorInput,
  ) {
    //LOGGING
    console.log(new Date(), ' | UsersService.createUserInFinalStep()');

    createUserInput.password = await this.encryptPassword(
      createUserInput.password,
    );
    return await this.usersRepository.save(createUserInput);
  }

  async create(
    signupId: string,
    createUserInput:
      | CreateUserInput
      | CreateCommonUserInput
      | CreateCreatorInput,
  ) {
    //LOGGING
    console.log(new Date(), ' | UsersService.create()');

    await this.checkUserBeforeCreate(signupId, createUserInput);

    createUserInput.password = await this.encryptPassword(
      createUserInput.password,
    );

    const created = await this.createUserInFinalStep(createUserInput);

    await this.pointsRepository.save({
      user: created,
      point: 50000,
      status: POINT_STATUS_ENUM.GIFTED,
    });
    const result = await this.pointsService.updateUserPoint({
      userId: created.id,
    });

    return result;
  }

  async createUserObj(email: string, nickname: string, profileImg: string) {
    return await this.usersRepository.create({ email, nickname, profileImg });
  }

  async update({ userId, updateUserInput }) {
    //LOGGING
    console.log(new Date(), ' | UsersService.update()');

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (updateUserInput.password) {
      updateUserInput.password = await this.encryptPassword(
        updateUserInput.password,
      );
    }
    if (updateUserInput.snsChannel !== user.snsChannel) {
      throw new UnprocessableEntityException('SNS 채널은 변경할 수 없습니다.');
    }

    const result = this.usersRepository.save({
      ...user,
      ...updateUserInput,
      userType: user.userType,
      point: user.point,
    });

    return result;
  }

  async delete(userId: string) {
    //LOGGING
    console.log(new Date(), ' | UsersService.delete()');

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user)
      throw new UnprocessableEntityException(
        '해당 유저 정보를 찾을 수 없습니다.',
      );
    if (user.point < 0) {
      throw new UnprocessableEntityException(
        '포인트가 0보다 작은 유저는 삭제할 수 없습니다.',
      );
    }

    const upRst = await this.usersRepository.save({
      ...user,
      id: userId,
      email: null,
      password: null,
      nickname: user.nickname + '(탈퇴)',
    });

    // const result = await this.usersRepository.softDelete({
    //   id: userId,
    // });
    if (upRst) return true;
    else return false;
  }
}

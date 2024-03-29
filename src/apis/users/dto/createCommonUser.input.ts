import { InputType, OmitType } from '@nestjs/graphql';
import { CreateUserInput } from './createUser.input';

@InputType()
export class CreateCommonUserInput extends OmitType(
  CreateUserInput,
  [
    'snsId',
    'snsName',
    'snsChannel',
    'isAuthedCreator',
    'followerNumber',
    'creatorAuthImg',
    'mainContents',
    'introduce',
    'userType',
  ],
  InputType,
) {}

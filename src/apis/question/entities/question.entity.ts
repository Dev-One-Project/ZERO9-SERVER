import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Answer } from 'src/apis/answer/entites/answer.entity';
import { Product } from 'src/apis/product/entities/product.entity';
import { User } from 'src/apis/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QUESTION_STATUS_TYPE_ENUM {
  PROGRESS = 'PROGRESS',
  SOLVED = 'SOLVED',
}
registerEnumType(QUESTION_STATUS_TYPE_ENUM, {
  name: 'QUESTION_STATUS_TYPE_ENUM',
});

@Entity()
@ObjectType()
export class Question {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String, { nullable: true })
  question: string;

  @Column({
    type: 'enum',
    enum: QUESTION_STATUS_TYPE_ENUM,
    nullable: true,
    default: QUESTION_STATUS_TYPE_ENUM.PROGRESS,
  })
  @Field(() => QUESTION_STATUS_TYPE_ENUM, {
    nullable: false,
    defaultValue: QUESTION_STATUS_TYPE_ENUM.PROGRESS,
  })
  status: QUESTION_STATUS_TYPE_ENUM;

  @CreateDateColumn()
  @Field(() => Date, { nullable: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  @Field(() => Date, { nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Product, { nullable: true })
  @Field(() => Product, { nullable: true })
  product: Product;

  @JoinColumn()
  @OneToOne(() => Answer, { nullable: true })
  @Field(() => Answer, { nullable: true })
  answer: Answer;

  @ManyToOne(() => User, { nullable: true })
  @Field(() => User)
  user: User;
}

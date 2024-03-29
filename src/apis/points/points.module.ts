import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Point } from './entities/point.entity';
import { PointsResolver } from './points.resolver';
import { PointsService } from './points.service';

@Module({
  imports: [TypeOrmModule.forFeature([Point, User, Product])],
  providers: [PointsResolver, PointsService],
})
export class PointsModule {}

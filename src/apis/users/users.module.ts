import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { JwtAccessStrategy } from 'src/common/auth/jwt-access.strategy';
import { Image } from '../images/entities/image.entity';
import { Product } from '../product/entities/product.entity';
import { IamportService } from '../iamport/iamport.service';
import { ProductService } from '../product/product.service';
import { ProductDetailService } from '../productDetail/productDetail.service';
import { ProductDetail } from '../productDetail/entities/productDetail.entity';
import { Point } from '../points/entities/point.entity';
import { PointsService } from '../points/points.service';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, //
      Image,
      Product,
      ProductDetail,
      Point,
      Order,
    ]),
  ],
  providers: [
    JwtAccessStrategy, //
    UsersResolver,
    UsersService,
    IamportService,
    ProductService,
    ProductDetailService,
    PointsService,
  ],
})
export class UsersModule {}

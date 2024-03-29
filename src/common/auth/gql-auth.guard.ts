import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

export class GqlAuthAccessGuard extends AuthGuard('access') {
  getRequest(context: ExecutionContext) {
    //LOGGING
    console.log(new Date(), ' | GqlAuthAccessGuard: getRequest');

    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext().req;
  }
}

export class GqlAuthRefreshGuard extends AuthGuard('refresh') {
  getRequest(context: ExecutionContext) {
    //LOGGING
    console.log(new Date(), ' | GqlAuthRefreshGuard: getRequest');

    const gqlContext = GqlExecutionContext.create(context);
    return gqlContext.getContext().req;
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response as ExpressResponse } from 'express';

export interface Response<T> {
  status: number;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T> | StreamableFile>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | StreamableFile> {
    return next.handle().pipe(
      map((data: unknown): Response<T> | StreamableFile => {
        // Skip transformation for StreamableFile responses (file downloads)
        if (data instanceof StreamableFile) {
          return data;
        }

        const response = context.switchToHttp().getResponse<ExpressResponse>();

        // Check if data has meta property (e.g. from pagination)
        // We cast to Record<string, unknown> to safely access properties
        const dataObj = data as Record<string, unknown>;
        const hasMeta = data && typeof data === 'object' && 'meta' in dataObj;
        const hasData = data && typeof data === 'object' && 'data' in dataObj;

        const meta = hasMeta ? dataObj.meta : undefined;

        // If data was already formatted with data/meta, use it
        // Otherwise wrap the whole data
        const finalData = hasData && hasMeta ? dataObj.data : data;

        return {
          status: response.statusCode,
          message: 'Success',
          data: finalData as T,
          meta,
        };
      }),
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log(`[HTTP] ${request.method} ${request.url}`);
    
    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          console.log(`[HTTP] Response ${event.status} ${request.url}:`, event.body);
        }
      })
    );
  }
}

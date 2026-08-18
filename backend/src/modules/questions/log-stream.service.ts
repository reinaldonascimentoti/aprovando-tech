import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class LogStreamService {
  private logSubject = new Subject<MessageEvent>();

  pushLog(message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') {
    this.logSubject.next({
      data: {
        message,
        type,
        time: new Date().toISOString(),
      },
    } as MessageEvent);
  }

  getStream(): Observable<MessageEvent> {
    return this.logSubject.asObservable();
  }
}

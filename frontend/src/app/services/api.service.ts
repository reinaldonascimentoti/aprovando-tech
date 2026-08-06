import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService,
  ) {}

  /** Constrói headers com Authorization JWT quando disponível */
  private getHeaders(): HttpHeaders {
    const token = this.supabaseService.accessToken;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** Constrói headers para FormData (sem Content-Type manual) */
  private getFormHeaders(): HttpHeaders {
    const token = this.supabaseService.accessToken;
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // ----------------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------------

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, password }, {
      headers: this.getHeaders()
    });
  }

  signup(email: string, password: string, full_name?: string, role?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/signup`, { email, password, full_name, role }, {
      headers: this.getHeaders()
    });
  }

  // ----------------------------------------------------------------
  // PDF PROCESSING
  // ----------------------------------------------------------------

  uploadLessonPdf(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/pdf/upload-lesson`, formData, {
      headers: this.getFormHeaders()
    });
  }

  // ----------------------------------------------------------------
  // EDITAIS
  // ----------------------------------------------------------------

  uploadEdital(
    file: File | null,
    title: string,
    link: string,
    userId: string,
    userContext: {
      cargo: string;
      concurso?: string;
      dataProva?: string;
      horasPorDia?: number;
      diasPorSemana?: number;
    },
  ): Observable<any> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('title', title);
    if (link) formData.append('link', link);
    formData.append('userId', userId);

    // Contexto do candidato
    if (userContext.cargo)         formData.append('cargo', userContext.cargo);
    if (userContext.concurso)      formData.append('concurso', userContext.concurso);
    if (userContext.dataProva)     formData.append('dataProva', userContext.dataProva);
    if (userContext.horasPorDia)   formData.append('horasPorDia', String(userContext.horasPorDia));
    if (userContext.diasPorSemana) formData.append('diasPorSemana', String(userContext.diasPorSemana));

    return this.http.post(`${this.baseUrl}/editais/upload`, formData, {
      headers: this.getFormHeaders()
    });
  }

  /** Public list of editais with limited metadata */
  getPublicEditais(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/public/editais`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  getEditais(userId?: string): Observable<any[]> {
    const params = userId ? `?userId=${userId}` : '';
    return this.http.get<any[]>(`${this.baseUrl}/editais${params}`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  getEditalDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/editais/${id}`, {
      headers: this.getHeaders()
    });
  }

  analyzeEditalPareto(id: string, userContext?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/editais/${id}/analisar-pareto`, userContext || {}, {
      headers: this.getHeaders()
    });
  }

  toggleTopic(editalId: string, topicId: string, userId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/editais/${editalId}/toggle-topic`,
      { topicId, userId },
      { headers: this.getHeaders() }
    );
  }

  sendEditalToUser(editalId: string, userId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/editais/${editalId}/send-to-user`,
      { userId },
      { headers: this.getHeaders() }
    );
  }

  updateEditalContext(
    id: string,
    userContext: {
      cargo: string;
      concurso?: string;
      dataProva?: string;
      horasPorDia?: number;
      diasPorSemana?: number;
    },
  ): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/editais/${id}/context`,
      {
        cargo: userContext.cargo,
        concurso: userContext.concurso,
        dataProva: userContext.dataProva,
        horasPorDia: userContext.horasPorDia != null ? String(userContext.horasPorDia) : undefined,
        diasPorSemana: userContext.diasPorSemana != null ? String(userContext.diasPorSemana) : undefined,
      },
      { headers: this.getHeaders() }
    );
  }

  reanalyzeEdital(
    id: string,
    file: File | null,
    link: string,
    userContext: {
      cargo: string;
      concurso?: string;
      dataProva?: string;
      horasPorDia?: number;
      diasPorSemana?: number;
    },
  ): Observable<any> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (link) formData.append('link', link);
    if (userContext.cargo)         formData.append('cargo', userContext.cargo);
    if (userContext.concurso)      formData.append('concurso', userContext.concurso);
    if (userContext.dataProva)     formData.append('dataProva', userContext.dataProva);
    if (userContext.horasPorDia)   formData.append('horasPorDia', String(userContext.horasPorDia));
    if (userContext.diasPorSemana) formData.append('diasPorSemana', String(userContext.diasPorSemana));
    return this.http.post(`${this.baseUrl}/editais/${id}/reanalyze`, formData, {
      headers: this.getFormHeaders()
    });
  }

  dismissEdital(id: string, userId: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/editais/${id}/dismiss`,
      { headers: this.getHeaders(), body: { userId } }
    );
  }

  deleteEdital(id: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/editais/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // ----------------------------------------------------------------
  // QUESTIONS
  // ----------------------------------------------------------------

  getQuestions(releasedOnly = false): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/questions?releasedOnly=${releasedOnly}`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  getQuestionQualityAnalysis(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/questions/quality-analysis`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of({})));
  }

  toggleQuestionRelease(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/questions/${id}/toggle-release`, {}, {
      headers: this.getHeaders()
    });
  }

  // ----------------------------------------------------------------
  // USERS (Admin)
  // ----------------------------------------------------------------

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`, {
      headers: this.getHeaders()
    }).pipe(catchError(() => of([])));
  }

  updateUserRole(id: string, role: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${id}/role`, { role }, {
      headers: this.getHeaders()
    });
  }
}

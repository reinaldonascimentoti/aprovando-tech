import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async login(email: string, pass: string) {
    const client = this.supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Supabase não está configurado no servidor.');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error || !data.user) {
      throw new UnauthorizedException(error?.message || 'Credenciais inválidas.');
    }

    // Busca perfil do usuário
    const adminClient = this.supabaseService.getAdminClient();
    const { data: profile } = adminClient
      ? await adminClient
          .from('profiles')
          .select('full_name, role')
          .eq('id', data.user.id)
          .single()
      : { data: null };

    return {
      token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name ?? data.user.email?.split('@')[0],
        role: profile?.role ?? 'user',
      },
    };
  }

  async signup(email: string, pass: string, fullName: string, role = 'user') {
    const client = this.supabaseService.getClient();
    if (!client) {
      throw new UnauthorizedException('Supabase não está configurado no servidor.');
    }

    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: fullName || email.split('@')[0] },
      },
    });

    if (error || !data.user) {
      throw new UnauthorizedException(error?.message || 'Erro ao criar conta.');
    }

    // Define role via admin se diferente de 'user'
    if (role === 'admin') {
      const adminClient = this.supabaseService.getAdminClient();
      if (adminClient) {
        await adminClient.auth.admin.updateUserById(data.user.id, {
          app_metadata: { role: 'admin' },
        });
        await adminClient
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', data.user.id);
      }
    }

    return {
      token: data.session?.access_token ?? null,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || email.split('@')[0],
        role,
      },
      message: data.session
        ? 'Conta criada com sucesso.'
        : 'Conta criada. Verifique seu e-mail para confirmar o cadastro.',
    };
  }
}

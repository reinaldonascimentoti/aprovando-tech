import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as ws from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as any },
});

async function main() {
  const targetEmail = 'reinaldo_sn@yahoo.com.br';
  console.log(`Buscando usuário com e-mail: ${targetEmail}...`);

  // 1. List all auth users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    console.error('Erro ao listar usuários do auth:', listError);
    return;
  }

  const foundUsers = users.filter((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
  console.log(`Encontrados no Auth: ${foundUsers.length} usuário(s)`);

  for (const u of foundUsers) {
    console.log(`ID no Auth: ${u.id}, Email: ${u.email}, Criado em: ${u.created_at}`);

    // Limpar tabelas públicas relacionadas se existirem
    try {
      await supabase.from('profiles').delete().eq('id', u.id);
      await supabase.from('user_topic_progress').delete().eq('user_id', u.id);
      await supabase.from('user_edital_assignments').delete().eq('user_id', u.id);
      await supabase.from('user_edital_dismissals').delete().eq('user_id', u.id);
      console.log(`Dados relacionados ao ID ${u.id} removidos de tabelas públicas.`);
    } catch (e: any) {
      console.warn('Aviso ao remover tabelas públicas:', e?.message);
    }

    // Excluir de auth.users via admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(u.id);
    if (deleteError) {
      console.error(`Erro ao deletar usuário ${u.id} do Auth:`, deleteError);
    } else {
      console.log(`✅ Usuário ${u.id} (${u.email}) excluído com sucesso do Supabase Auth!`);
    }
  }

  // Também verificar se restou algum registro em profiles por email
  const { data: profiles } = await supabase.from('profiles').select('*').eq('email', targetEmail);
  if (profiles && profiles.length > 0) {
    console.log(`Encontrado(s) ${profiles.length} perfil(is) em public.profiles:`, profiles);
    await supabase.from('profiles').delete().eq('email', targetEmail);
    console.log(`Perfis com email ${targetEmail} excluídos.`);
  }

  console.log('Concluído! O e-mail agora está 100% liberado para novo cadastro.');
}

main().catch(console.error);

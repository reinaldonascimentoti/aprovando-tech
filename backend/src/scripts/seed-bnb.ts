const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://eclvgwqpalgaotwqjgpq.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const testData = {
  edital: "Banco do Nordeste - Edital nº 1/2022",
  cargo: "Analista de Sistemas - Perfil 1: Desenvolvimento de Sistemas",
  conteudo_programatico: {
    conhecimentos_gerais: [
      {
        disciplina: "Língua Portuguesa",
        topicos: [
          {
            nome: "Interpretação de textos",
            subtopicos: [
              "Compreensão global",
              "Ideias principais",
              "Inferência de informações implícitas"
            ]
          },
          {
            nome: "Gramática",
            subtopicos: [
              "Ortografia oficial",
              "Morfologia",
              "Sintaxe",
              "Semântica"
            ]
          },
          {
            nome: "Redação oficial",
            subtopicos: [
              "Estrutura de documentos",
              "Clareza e objetividade"
            ]
          }
        ]
      },
      {
        disciplina: "Raciocínio Lógico",
        topicos: [
          {
            nome: "Estruturas lógicas",
            subtopicos: [
              "Proposições",
              "Tabelas verdade"
            ]
          },
          {
            nome: "Problemas matemáticos",
            subtopicos: [
              "Conjuntos",
              "Sequências numéricas"
            ]
          }
        ]
      }
    ],
    conhecimentos_especificos: [
      {
        disciplina: "Lógica de Programação",
        topicos: [
          {
            nome: "Algoritmos",
            subtopicos: [
              "Construção de algoritmos",
              "Blocos de comandos"
            ]
          },
          {
            nome: "Estruturas de controle",
            subtopicos: [
              "Seleção",
              "Repetição",
              "Desvio"
            ]
          },
          {
            nome: "Programação avançada",
            subtopicos: [
              "Recursividade",
              "Orientação a objetos",
              "Métodos de ordenação, pesquisa e hashing"
            ]
          }
        ]
      },
      {
        disciplina: "Arquitetura de Software",
        topicos: [
          {
            nome: "Padrões arquiteturais",
            subtopicos: [
              "MVC",
              "Microsserviços",
              "Arquitetura orientada a eventos"
            ]
          },
          {
            nome: "Integração e DevOps",
            subtopicos: [
              "APIs",
              "CI/CD",
              "Integração contínua"
            ]
          }
        ]
      },
      {
        disciplina: "Engenharia de Software",
        topicos: [
          {
            nome: "Processo de desenvolvimento",
            subtopicos: [
              "Iterativo e incremental",
              "Práticas ágeis (Scrum, Kanban)",
              "TDD, BDD, ATDD"
            ]
          },
          {
            nome: "Requisitos e prototipação",
            subtopicos: [
              "Elicitação",
              "Histórias de usuário",
              "Critérios de aceitação",
              "Prototipação"
            ]
          },
          {
            nome: "Testes de software",
            subtopicos: [
              "Unitário",
              "Integração",
              "Funcional",
              "Desempenho",
              "Carga",
              "Vulnerabilidade"
            ]
          }
        ]
      },
      {
        disciplina: "Linguagens e Tecnologias de Programação",
        topicos: [
          {
            nome: "Linguagens",
            subtopicos: [
              "Java",
              "Spring Boot",
              ".Net Core",
              "Python",
              "JavaScript"
            ]
          },
          {
            nome: "Tecnologias",
            subtopicos: [
              "HTML5",
              "CSS3",
              "Mobile (Android, iOS, Ionic)",
              "IA e Machine Learning",
              "RPA",
              "Low/No Code"
            ]
          }
        ]
      },
      {
        disciplina: "Bancos de Dados",
        topicos: [
          {
            nome: "Modelagem",
            subtopicos: [
              "Conceitual",
              "Lógica",
              "Física",
              "Normalização",
              "Integridade referencial"
            ]
          },
          {
            nome: "SQL e SGBD",
            subtopicos: [
              "DDL",
              "DML",
              "Transações",
              "NoSQL"
            ]
          },
          {
            nome: "Big Data e BI",
            subtopicos: [
              "ETL",
              "Data Lakes",
              "Dashboards",
              "Governança de dados (DAMA-DMBoK)"
            ]
          }
        ]
      },
      {
        disciplina: "Computação em Nuvem",
        topicos: [
          {
            nome: "Modelos de serviço",
            subtopicos: [
              "IaaS",
              "PaaS",
              "SaaS"
            ]
          },
          {
            nome: "Modelos de implantação",
            subtopicos: [
              "Privada",
              "Pública",
              "Híbrida"
            ]
          },
          {
            nome: "Conceitos avançados",
            subtopicos: [
              "Alta disponibilidade",
              "Escalabilidade",
              "Elasticidade",
              "Infrastructure as Code (IaC)",
              "Automação"
            ]
          }
        ]
      }
    ]
  }
};

function buildMapaGeral(cp: any) {
  const formatGroup = (list: any[], isBasica: boolean) => {
    return (list || []).map((d: any) => ({
      nome: d.disciplina,
      percentual_questoes: isBasica ? 10 : 30,
      prioridade: isBasica ? 'COMPLEMENTAR' : 'PRIORITÁRIA',
      percentual_tempo: isBasica ? 10 : 30,
      camada_2_topicos: (d.topicos || []).map((t: any, i: number) => ({
        nome: t.nome,
        frequencia_historica: '[Aguardando Análise Pareto]',
        temperatura: isBasica ? 'MORNO' : 'QUENTE',
        ordem_estudo: i + 1,
        camada_3_subtopicos: (t.subtopicos || []).map((sub: string) => ({
          nome: sub,
          frequencia: 'Média',
          dificuldade: 'Médio',
          custo_beneficio: 'Médio',
          incluir: true,
          justificativa: '[Conteúdo Extraído do Edital]'
        }))
      }))
    }));
  };

  const basicas = formatGroup(cp.conhecimentos_gerais, true);
  const especificas = formatGroup(cp.conhecimentos_especificos, false);

  return {
    disciplinas_basicas: basicas,
    disciplinas_especificas: especificas
  };
}

async function seed() {
  console.log('🌱 Semeando Edital do Banco do Nordeste 2022 no Supabase...');

  const mapaGeral = buildMapaGeral(testData.conteudo_programatico);

  const paretoData = {
    concurso_info: {
      concurso: testData.edital,
      cargo: testData.cargo,
      banca: 'Cesgranrio',
      mensagem_confirmacao: 'Edital do Banco do Nordeste 2022 carregado com sucesso.'
    },
    conteudo_programatico: testData.conteudo_programatico,
    mapa_completo: mapaGeral,
    mapa_geral: mapaGeral,
    mapa_geral_extraido: mapaGeral,
    pareto_analisado: false,
    total_subjects: mapaGeral.disciplinas_basicas.length + mapaGeral.disciplinas_especificas.length,
    high_priority_subjects: mapaGeral.disciplinas_especificas.length,
    coverage_percentage: 100,
    relevance_summary: `Mapa Geral das Disciplinas para ${testData.cargo}. Clique no botão "Análise de Pareto" no topo para gerar o Pareto 80/20 sob demanda.`
  };

  const editalId = 'edital-bnb-2022';

  const { data: edital, error: editalError } = await supabase
    .from('editais')
    .upsert({
      id: editalId,
      title: testData.edital,
      cargo: testData.cargo,
      concurso: 'Banco do Nordeste',
      status: 'completed',
      pareto_data: paretoData,
      uploader_name: 'Sistema (Seed Teste)'
    }, { onConflict: 'id' })
    .select()
    .single();

  if (editalError) {
    console.error('❌ Erro ao inserir na tabela editais:', editalError.message);
    return;
  }

  console.log('✅ Edital inserido/atualizado na tabela public.editais com ID:', edital.id);

  try {
    const { error: cpError } = await supabase
      .from('conteudo_programatico')
      .upsert({
        edital_id: editalId,
        cargo: testData.cargo,
        concurso: 'Banco do Nordeste',
        mapa_geral: mapaGeral,
        raw_json: testData.conteudo_programatico
      }, { onConflict: 'edital_id' });

    if (cpError) {
      console.warn('⚠️ Nota sobre public.conteudo_programatico:', cpError.message);
    } else {
      console.log('✅ Conteúdo programático inserido/atualizado na tabela public.conteudo_programatico');
    }
  } catch (e: any) {
    console.warn('⚠️ Aviso ao inserir em conteudo_programatico:', e?.message);
  }

  console.log('\n🎉 SUCESSO! O edital do Banco do Nordeste 2022 foi incluído no banco de dados!');
  console.log(`🔗 ID para navegação direta: ${editalId}`);
  console.log(`🔗 Rota do Mapa das Disciplinas: /disciplinas/${editalId}`);
}

seed();

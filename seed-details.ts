
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  const solicitacaoId = '9101b5a2-0cfb-419b-a010-85f269a9b703';

  console.log('Seeding rich data for solicitacao:', solicitacaoId);

  // 1. Add Observations
  const { error: obsError } = await supabase
    .from('historico_anotacoes')
    .insert([
      {
        solicitacao_id: solicitacaoId,
        conteudo_anotacao: 'Paciente apresenta histórico de endometriose profunda. Necessário reserva de UTI e equipe de proctologia de sobreaviso.',
        tipo_anotacao: 'Técnica',
        criado_em: new Date(Date.now() - 7200000).toISOString()
      },
      {
        solicitacao_id: solicitacaoId,
        conteudo_anotacao: 'Documentação enviada para o convênio. Aguardando retorno sobre a OPME solicitada.',
        tipo_anotacao: 'Administrativa',
        criado_em: new Date(Date.now() - 3600000).toISOString()
      }
    ]);

  if (obsError) console.error('Error seeding observations:', obsError);
  else console.log('Observations seeded successfully.');

  // 2. Update Description and Mock fields
  const { error: updateError } = await supabase
    .from('solicitacoes_cirurgia')
    .update({
      procedimento_descricao: 'Histeroscopia Cirúrgica para Ressecção de Mioma Submucoso'
      // Add other fields if you find them in the table
    })
    .eq('id', solicitacaoId);

  if (updateError) console.error('Error updating solicitacao:', updateError);
  else console.log('Solicitacao updated successfully.');
}

seed();

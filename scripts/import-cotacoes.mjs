// Importa a aba COTAÇÕES (+ enriquece com REPORT MÉDICO) da planilha SAGA
// real da GynMed para a tabela `cotacoes_comerciais` no Supabase.
//
// Uso:
//   node --env-file=.env.local scripts/import-cotacoes.mjs "<caminho.xlsx>" --dry-run
//   node --env-file=.env.local scripts/import-cotacoes.mjs "<caminho.xlsx>"
//
// O caminho do .xlsx nunca é lido de dentro do repositório nem gravado em
// nenhum arquivo versionado — só passa pela memória do processo e vai
// direto para o Supabase via API (SUPABASE_SERVICE_ROLE_KEY).

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const MESES_ABBR = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const xlsxPath = args.find((a) => !a.startsWith("--"));

if (!xlsxPath) {
  console.error("Uso: node --env-file=.env.local scripts/import-cotacoes.mjs \"<caminho.xlsx>\" [--dry-run]");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (rode com --env-file=.env.local)");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

// ── Helpers de leitura de planilha ──────────────────────────────────────
function sheetRows(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Aba não encontrada: ${name}`);
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  const header = rows[0].map((h) => String(h).trim());
  const data = rows.slice(1).filter((r) => r.some((c) => c !== ""));
  const idx = (name) => header.indexOf(name);
  return { header, data, idx };
}

function parseMoney(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "-") return null;
  const n = parseFloat(s.replace(/R\$/g, "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

const dateWarnings = [];

function parseDate(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "-") return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let [, mo, d, y] = m;
  if (y.length === 2) y = `20${y}`;
  if (Number(mo) < 1 || Number(mo) > 12 || Number(d) < 1 || Number(d) > 31) {
    dateWarnings.push(s);
    return null;
  }
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseMesLabel(v) {
  if (v == null) return null;
  const s = String(v).trim().toUpperCase();
  const m = s.match(/^([A-Z]{3})\s+(\d{2})$/);
  if (!m) return null;
  const idx = MESES_ABBR.indexOf(m[1]);
  if (idx === -1) return null;
  return `20${m[2]}-${String(idx + 1).padStart(2, "0")}-01`;
}

function cleanText(v) {
  const s = String(v ?? "").trim();
  return s && s !== "-" && s !== "0" ? s : null;
}

// ── Carrega workbook ─────────────────────────────────────────────────────
console.log(`Lendo ${xlsxPath}...`);
const wb = XLSX.readFile(xlsxPath);

const cot = sheetRows(wb, "COTAÇÕES");
const rm = sheetRows(wb, "REPORT MÉDICO");

// Mapa REPORT MÉDICO por Nro.orcamento
const rmByOrc = new Map();
for (const r of rm.data) {
  const orc = cleanText(r[rm.idx("Nro.orcamento")]);
  if (!orc) continue;
  rmByOrc.set(orc, {
    status_pedido_cirurgico: cleanText(r[rm.idx("STATUS PEDIDO CIRURGICO")]),
    status_pedido_cirurgico2: cleanText(r[rm.idx("STATUS PEDIDO CIRURGICO2")]),
    status_final: cleanText(r[rm.idx("STATUS FINAL")]),
    data_protocolo: parseDate(r[rm.idx("DATA PROTOCOLO")]),
  });
}

// ── Deriva etapa/em_aberto/datas a partir da Situacao ───────────────────
function derivaEtapa(situacao, dataCirurgia) {
  switch (situacao) {
    case "Faturado":
      return { etapa: "cirurgia_realizada", em_aberto: false };
    case "Aprovado":
      return dataCirurgia
        ? { etapa: "agendamento", em_aberto: false }
        : { etapa: "autorizacao", em_aberto: true };
    case "A vencer":
      return { etapa: "cotacao", em_aberto: true };
    case "Vencido":
      return { etapa: "perdida", em_aberto: false };
    default:
      return null; // situação ilegível — linha será pulada com aviso
  }
}

const skippedNoOrc = [];
const skippedBadSituacao = [];
const rows = [];
const repNames = new Set();

for (const r of cot.data) {
  const nroOrc = cleanText(r[cot.idx("Nro.orcamento")]);
  if (!nroOrc) {
    skippedNoOrc.push(r);
    continue;
  }

  const situacao = String(r[cot.idx("Situacao")] ?? "").trim();
  const dataCirurgia = parseDate(r[cot.idx("Data cirurgia")]);
  const derived = derivaEtapa(situacao, dataCirurgia);
  if (!derived) {
    skippedBadSituacao.push({ nroOrc, situacao });
    continue;
  }

  const repAtual = cleanText(r[cot.idx("REPRESENTANTE ATUAL")]);
  if (repAtual) repNames.add(repAtual);

  const mesCirurgia = r[cot.idx("mês cirurgia")];
  const mesCotacao = r[cot.idx("mês cotação")];
  const mesRef = derived.etapa === "cirurgia_realizada" ? parseMesLabel(mesCirurgia) : parseMesLabel(mesCotacao);

  const rm2 = rmByOrc.get(nroOrc) || {};

  rows.push({
    nro_orcamento: nroOrc,
    nro_agendamento: cleanText(r[cot.idx("Nro.agendamento")]),
    representante_nome: repAtual,
    medico_nome: cleanText(r[cot.idx("Nome do medico")]),
    paciente_nome: cleanText(r[cot.idx("Paciente")]),
    procedimento: cleanText(r[cot.idx("Descricao do tipo")]),
    grupo_procedimento: cleanText(r[cot.idx("Descricao do grupo")]),
    convenio: cleanText(r[cot.idx("Nome do plano de saude")]),
    hospital: cleanText(r[cot.idx("Nome do hospital")]),
    uf_hospital: cleanText(r[cot.idx("UF do hospital")]),
    valor_orcamento: parseMoney(r[cot.idx("Valor do orçamento")]),
    valor_final: parseMoney(r[cot.idx("Valor final")]),
    etapa: derived.etapa,
    em_aberto: derived.em_aberto,
    mes_referencia: mesRef,
    status_cotacao: situacao,
    data_solicitacao: parseDate(r[cot.idx("Data solicitacao")]),
    data_cotacao: parseDate(r[cot.idx("Data orcamento")]),
    data_autorizacao: parseDate(r[cot.idx("Data aprovacao")]),
    data_reprovacao: parseDate(r[cot.idx("Data reprovacao")]),
    data_vencimento_cotacao: parseDate(r[cot.idx("Data validade")]),
    data_cirurgia: derived.etapa === "cirurgia_realizada" ? dataCirurgia : null,
    data_agendamento: derived.etapa === "agendamento" ? dataCirurgia : null,
    status_pedido_cirurgico: rm2.status_pedido_cirurgico ?? null,
    status_pedido_cirurgico2: rm2.status_pedido_cirurgico2 ?? null,
    status_final: rm2.status_final ?? null,
    data_protocolo: rm2.data_protocolo ?? null,
  });
}

// ── Resolve representantes ───────────────────────────────────────────────
const { data: repsExistentes, error: repsErr } = await supabase
  .from("representantes_comerciais")
  .select("id, nome");
if (repsErr) throw repsErr;

const repIdByNome = new Map(repsExistentes.map((r) => [r.nome, r.id]));
const repsNovos = [...repNames].filter((n) => !repIdByNome.has(n));

console.log("\n── Resumo do parsing ──");
console.log("Linhas totais na aba COTAÇÕES:", cot.data.length);
console.log("Puladas por Nro.orcamento em branco:", skippedNoOrc.length);
console.log("Puladas por Situacao ilegível (com Nro.orcamento):", skippedBadSituacao.length);
console.log("Cotações válidas a importar:", rows.length);
console.log("Representantes já cadastrados:", repIdByNome.size);
console.log("Representantes novos a criar:", repsNovos.length, repsNovos);

const porEtapa = {};
for (const r of rows) porEtapa[r.etapa] = (porEtapa[r.etapa] || 0) + 1;
console.log("Distribuição por etapa:", porEtapa);
console.log("Datas inválidas descartadas:", dateWarnings.length, dateWarnings.slice(0, 10));

if (skippedBadSituacao.length) {
  console.log("Amostra de Situacao ilegível:", skippedBadSituacao.slice(0, 5));
}

if (dryRun) {
  console.log("\n[--dry-run] Nada foi gravado no Supabase. Amostra de 3 linhas prontas para import:");
  console.log(JSON.stringify(rows.slice(0, 3), null, 2));
} else {
  // ── Grava de verdade ────────────────────────────────────────────────────
  if (repsNovos.length) {
    const { data: inseridos, error } = await supabase
      .from("representantes_comerciais")
      .insert(repsNovos.map((nome) => ({ nome, meta_sugerida: 0 })))
      .select("id, nome");
    if (error) throw error;
    for (const r of inseridos) repIdByNome.set(r.nome, r.id);
    console.log(`Criados ${inseridos.length} representantes novos.`);
  }

  const BATCH = 500;
  let gravadas = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const lote = rows.slice(i, i + BATCH).map(({ representante_nome, ...row }) => ({
      ...row,
      representante_id: representante_nome ? repIdByNome.get(representante_nome) ?? null : null,
    }));
    const { error } = await supabase.from("cotacoes_comerciais").upsert(lote, { onConflict: "nro_orcamento" });
    if (error) throw error;
    gravadas += lote.length;
    console.log(`Gravadas ${gravadas}/${rows.length}...`);
  }

  console.log("\nImportação concluída.");
}

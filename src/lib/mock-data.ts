export type SolicitacaoStatus =
  | "solicitado"
  | "protocolado"
  | "autorizado"
  | "agendado"
  | "realizada"
  | "divergencia"
  | "negado"
  | "em_junta";

export interface Solicitacao {
  id: string;
  codigo: string;
  paciente: string;
  pacienteAvatar?: string;
  status: SolicitacaoStatus;
  medicoSolicitante: string;
  cirurgiaoPrincipal: string;
  procedimento: string;
  dataSolicitacao: string;
  dataAgendamento?: string;
  hospitalPreferencia?: string;
  planoSaude?: string;
  cid?: string;
  cpf?: string;
  nascimento?: string;
  telefone?: string;
  descricao?: string;
}

export const mockSolicitacoes: Solicitacao[] = [
  {
    id: "1",
    codigo: "#GYN-8821",
    paciente: "Helena M. Oliveira",
    status: "realizada",
    medicoSolicitante: "Dr. Marcos Silva",
    cirurgiaoPrincipal: "Dra. Clara Mendes",
    procedimento: "Histeroscopia Cirúrgica",
    dataSolicitacao: "12/10/2023",
  },
  {
    id: "2",
    codigo: "#GYN-8822",
    paciente: "Beatriz Santos",
    status: "agendado",
    medicoSolicitante: "Dra. Juliana Costa",
    cirurgiaoPrincipal: "Dr. Roberto Leal",
    procedimento: "Cesárea Programada",
    dataSolicitacao: "14/10/2023",
    dataAgendamento: "25 Out 2023 • 08:30",
  },
  {
    id: "3",
    codigo: "#GYN-8823",
    paciente: "Amanda Ferreira",
    status: "divergencia",
    medicoSolicitante: "Dr. Paulo Vieira",
    cirurgiaoPrincipal: "Dra. Sofia Lima",
    procedimento: "Laparoscopia Pélvica",
    dataSolicitacao: "15/10/2023",
  },
  {
    id: "4",
    codigo: "#GYN-8824",
    paciente: "Carla Pereira",
    status: "negado",
    medicoSolicitante: "Dr. Arthur Lima",
    cirurgiaoPrincipal: "--",
    procedimento: "Biópsia de Endométrio",
    dataSolicitacao: "16/10/2023",
  },
  {
    id: "5",
    codigo: "#GYN-8825",
    paciente: "Luciana Ramos",
    status: "autorizado",
    medicoSolicitante: "Dra. Juliana Costa",
    cirurgiaoPrincipal: "Dr. Roberto Leal",
    procedimento: "Retirada de DIU",
    dataSolicitacao: "17/10/2023",
  },
  {
    id: "6",
    codigo: "#10245",
    paciente: "Mariana Silva Oliveira",
    status: "solicitado",
    medicoSolicitante: "Dr. Ricardo Mendonça",
    cirurgiaoPrincipal: "--",
    procedimento: "Histeroscopia Cirúrgica",
    dataSolicitacao: "12 Out 2023",
  },
  {
    id: "7",
    codigo: "#10248",
    paciente: "Beatriz Costa Lima",
    status: "solicitado",
    medicoSolicitante: "Dra. Aline Santos",
    cirurgiaoPrincipal: "--",
    procedimento: "Mioectomia Laparoscópica",
    dataSolicitacao: "14 Out 2023",
  },
  {
    id: "8",
    codigo: "#10192",
    paciente: "Fernanda Alencar",
    status: "divergencia",
    medicoSolicitante: "Dra. Claudia Neves",
    cirurgiaoPrincipal: "--",
    procedimento: "Endometriose Profunda",
    dataSolicitacao: "10 Out 2023",
  },
  {
    id: "9",
    codigo: "#10211",
    paciente: "Letícia Ramos",
    status: "em_junta",
    medicoSolicitante: "Dr. Paulo Vieira",
    cirurgiaoPrincipal: "--",
    procedimento: "Laparoscopia Diagnóstica",
    dataSolicitacao: "11 Out 2023",
  },
  {
    id: "10",
    codigo: "#10224",
    paciente: "Camila Torres",
    status: "protocolado",
    medicoSolicitante: "Dr. Ricardo Mendonça",
    cirurgiaoPrincipal: "--",
    procedimento: "Salpingectomia",
    dataSolicitacao: "12 Out 2023",
  },
  {
    id: "11",
    codigo: "#10155",
    paciente: "Juliana Paes",
    status: "autorizado",
    medicoSolicitante: "Dra. Aline Santos",
    cirurgiaoPrincipal: "--",
    procedimento: "Ooforectomia Unilateral",
    dataSolicitacao: "08 Out 2023",
  },
  {
    id: "12",
    codigo: "#09877",
    paciente: "Priscila Gomes",
    status: "agendado",
    medicoSolicitante: "Dr. Ricardo Mendonça",
    cirurgiaoPrincipal: "--",
    procedimento: "Tratamento de Endometriose",
    dataSolicitacao: "05 Out 2023",
    dataAgendamento: "25 Out 2023 • 08:30",
  },
  {
    id: "13",
    codigo: "#09552",
    paciente: "Sofia Helena Martins",
    status: "realizada",
    medicoSolicitante: "Dra. Claudia Neves",
    cirurgiaoPrincipal: "--",
    procedimento: "Curetagem Uterina",
    dataSolicitacao: "01 Out 2023",
  },
];

// Detail mock for #12345
export const mockDetalhe: Solicitacao & {
  observacoes: { autor: string; data: string; texto: string; tipo: string }[];
} = {
  id: "12345",
  codigo: "SOL-2024-12345",
  paciente: "Mariana Albuquerque Costa",
  status: "em_junta",
  medicoSolicitante: "Dr. Ricardo Silveira (CRM 45678)",
  cirurgiaoPrincipal: "Dr. Ricardo Silveira",
  procedimento: "Histerectomia Total Laparoscópica",
  dataSolicitacao: "15 de Maio, 2024 - 14:30",
  hospitalPreferencia: "Hospital Israelita Albert Einstein",
  planoSaude: "Bradesco Saúde Top Nacional",
  cid: "N80.0 - Endometriose do Útero",
  cpf: "123.456.789-00",
  nascimento: "22/08/1988",
  telefone: "(11) 98765-4321",
  descricao:
    "Paciente apresenta quadro de adenomiose severa com falha no tratamento clínico conservador...",
  observacoes: [
    {
      autor: "Dr. Ricardo Silveira",
      data: "15/05/2024 14:30",
      texto:
        "Solicitação inicial enviada com exames de imagem e laudo anatomopatológico prévio anexados.",
      tipo: "normal",
    },
    {
      autor: "Sistema Gynmed",
      data: "16/05/2024 09:15",
      texto: "Protocolo registrado. Status alterado para: PROTOCOLADO.",
      tipo: "sistema",
    },
    {
      autor: "Auditoria Médica (Dra. Eliana)",
      data: "17/05/2024 11:00",
      texto:
        "Divergência técnica encontrada no OPME solicitado. Encaminhado para Junta Médica para parecer final sobre os materiais.",
      tipo: "divergencia",
    },
  ],
};

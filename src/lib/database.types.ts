export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anexos_solicitacoes: {
        Row: {
          criado_em: string
          id: string
          nome_arquivo: string
          solicitacao_id: string
          storage_path: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome_arquivo: string
          solicitacao_id: string
          storage_path: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome_arquivo?: string
          solicitacao_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_solicitacoes_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_cirurgicas"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitais: {
        Row: {
          cidade: string | null
          cnpj: string | null
          criado_em: string
          id: string
          nome_fantasia: string
          uf: string | null
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          criado_em?: string
          id?: string
          nome_fantasia: string
          uf?: string | null
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          criado_em?: string
          id?: string
          nome_fantasia?: string
          uf?: string | null
        }
        Relationships: []
      }
      itens_solicitados: {
        Row: {
          id: string
          produto_id: string
          quantidade_estimada: number
          solicitacao_id: string
        }
        Insert: {
          id?: string
          produto_id: string
          quantidade_estimada?: number
          solicitacao_id: string
        }
        Update: {
          id?: string
          produto_id?: string
          quantidade_estimada?: number
          solicitacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_solicitados_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_solicitados_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_cirurgicas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_comerciais: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          mes_referencia: string
          meta_valor: number
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mes_referencia: string
          meta_valor: number
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mes_referencia?: string
          meta_valor?: number
        }
        Relationships: []
      }
      metas_representantes: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          mes_referencia: string
          meta_valor: number
          representante_nome: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mes_referencia: string
          meta_valor: number
          representante_nome: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mes_referencia?: string
          meta_valor?: number
          representante_nome?: string
        }
        Relationships: []
      }
      planos_saude: {
        Row: {
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          codigo_anvisa: string | null
          codigo_tuss: string | null
          criado_em: string
          id: string
          nome: string
          preco_tabela: number | null
        }
        Insert: {
          codigo_anvisa?: string | null
          codigo_tuss?: string | null
          criado_em?: string
          id?: string
          nome: string
          preco_tabela?: number | null
        }
        Update: {
          codigo_anvisa?: string | null
          codigo_tuss?: string | null
          criado_em?: string
          id?: string
          nome?: string
          preco_tabela?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          comissao_padrao: number | null
          criado_em: string
          email: string | null
          id: string
          nome: string
          role: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          comissao_padrao?: number | null
          criado_em?: string
          email?: string | null
          id: string
          nome: string
          role?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          comissao_padrao?: number | null
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string
          role?: string
        }
        Relationships: []
      }
      report_medico_status: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_protocolo: string | null
          observacoes: string | null
          solicitacao_id: string
          status_final: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_protocolo?: string | null
          observacoes?: string | null
          solicitacao_id: string
          status_final?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_protocolo?: string | null
          observacoes?: string | null
          solicitacao_id?: string
          status_final?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_medico_status_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: true
            referencedRelation: "solicitacoes_importadas"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_cirurgicas: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_cirurgia: string | null
          hospital_id: string
          id: string
          medico_cirurgiao: string
          motivo_recusa: string | null
          observacoes: string | null
          paciente_nome: string
          plano_saude_id: string
          representante_id: string
          status: string
          tipo_cirurgia_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_cirurgia?: string | null
          hospital_id: string
          id?: string
          medico_cirurgiao: string
          motivo_recusa?: string | null
          observacoes?: string | null
          paciente_nome: string
          plano_saude_id: string
          representante_id: string
          status?: string
          tipo_cirurgia_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_cirurgia?: string | null
          hospital_id?: string
          id?: string
          medico_cirurgiao?: string
          motivo_recusa?: string | null
          observacoes?: string | null
          paciente_nome?: string
          plano_saude_id?: string
          representante_id?: string
          status?: string
          tipo_cirurgia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_cirurgicas_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_cirurgicas_plano_saude_id_fkey"
            columns: ["plano_saude_id"]
            isOneToOne: false
            referencedRelation: "planos_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_cirurgicas_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_cirurgicas_tipo_cirurgia_id_fkey"
            columns: ["tipo_cirurgia_id"]
            isOneToOne: false
            referencedRelation: "tipos_cirurgia"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_importadas: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_aprovacao: string | null
          data_cirurgia: string | null
          data_orcamento: string | null
          data_reprovacao: string | null
          data_solicitacao: string | null
          data_validade: string | null
          descricao_grupo: string | null
          descricao_tipo: string | null
          hora_cirurgia: string | null
          hospital_nome: string | null
          hospital_uf: string | null
          id: string
          importado_por: string | null
          medico_nome: string | null
          nro_agendamento: string
          nro_orcamento: string | null
          paciente_nome: string | null
          plano_saude_nome: string | null
          representante_id: string | null
          representante_nome: string | null
          situacao: string | null
          valor_orcamento: number | null
          valor_realizado: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_aprovacao?: string | null
          data_cirurgia?: string | null
          data_orcamento?: string | null
          data_reprovacao?: string | null
          data_solicitacao?: string | null
          data_validade?: string | null
          descricao_grupo?: string | null
          descricao_tipo?: string | null
          hora_cirurgia?: string | null
          hospital_nome?: string | null
          hospital_uf?: string | null
          id?: string
          importado_por?: string | null
          medico_nome?: string | null
          nro_agendamento: string
          nro_orcamento?: string | null
          paciente_nome?: string | null
          plano_saude_nome?: string | null
          representante_id?: string | null
          representante_nome?: string | null
          situacao?: string | null
          valor_orcamento?: number | null
          valor_realizado?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_aprovacao?: string | null
          data_cirurgia?: string | null
          data_orcamento?: string | null
          data_reprovacao?: string | null
          data_solicitacao?: string | null
          data_validade?: string | null
          descricao_grupo?: string | null
          descricao_tipo?: string | null
          hora_cirurgia?: string | null
          hospital_nome?: string | null
          hospital_uf?: string | null
          id?: string
          importado_por?: string | null
          medico_nome?: string | null
          nro_agendamento?: string
          nro_orcamento?: string | null
          paciente_nome?: string | null
          plano_saude_nome?: string | null
          representante_id?: string | null
          representante_nome?: string | null
          situacao?: string | null
          valor_orcamento?: number | null
          valor_realizado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_importadas_importado_por_fkey"
            columns: ["importado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_importadas_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_cirurgia: {
        Row: {
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      upsert_solicitacoes_importadas: { Args: { linhas: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          comissao_padrao: number | null
          criado_em: string
          id: string
          nome: string
          role: string
        }
        Insert: {
          comissao_padrao?: number | null
          criado_em?: string
          id: string
          nome: string
          role?: string
        }
        Update: {
          comissao_padrao?: number | null
          criado_em?: string
          id?: string
          nome?: string
          role?: string
        }
        Relationships: []
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const

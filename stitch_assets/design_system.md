# Diretrizes de Design: Gynmed Digital Experience

Este documento estabelece a base visual e funcional para o ecossistema digital da Gynmed. Como diretores de arte e designers, nosso objetivo não é apenas construir interfaces utilizáveis, mas criar uma experiência de "Curadoria Clínica" — um ambiente que equilibra a precisão médica com uma estética editorial sofisticada.

---

## 1. O Norte Criativo: "O Santuário de Precisão"

Para a Gynmed, fugiremos do layout genérico de software médico. Nosso Norte Criativo é o **Santuário de Precisão**. Isso significa que a interface deve respirar. Utilizaremos espaços em branco generosos, tipografia autoritária e uma hierarquia de camadas que elimina a necessidade de divisores visuais rígidos. O design deve parecer "impresso" em vidro e papel de alta gramatura, transmitindo confiança inabalável e organização absoluta.

---

## 2. Estratégia Cromática e Superfícies

A paleta de cores não é apenas estética; ela define a navegação e o estado emocional do usuário.

### Hierarquia de Superfícies (A Regra "No-Line")
**É terminantemente proibido o uso de bordas sólidas de 1px para seccionamento de conteúdo.** A separação de elementos deve ser feita exclusivamente através de:
1.  **Mudanças de Tom:** Um card `surface_container_lowest` (#ffffff) repousando sobre um fundo `surface` (#f8f9fa).
2.  **Ninhagem de Camadas:** Use os tiers `surface_container` para criar profundidade. Imagine folhas de papel sobrepostas. Elementos secundários ficam no `surface_container_low`, enquanto ações críticas ou destaques sobem para o `surface_container_high`.

### O Toque Signature
*   **Vidro e Gradiente:** Para elementos flutuantes (modais ou menus suspensos), utilize o efeito de *Glassmorphism* com `surface_variant` em 80% de opacidade e um `backdrop-blur` de 16px.
*   **Soul Gradient:** Em CTAs principais ou cabeçalhos de seção, aplique um gradiente sutil de `primary_container` (#1271d8) para `primary` (#0059af) para evitar a aparência "flat" e adicionar volume premium.

---

## 3. Tipografia Editorial

A tipografia da Gynmed é baseada no contraste entre a geometria humanista da **Montserrat** (Headings) e a legibilidade técnica da **Inter** (Body).

*   **Display & Headline (Montserrat):** Usadas para afirmações de marca e títulos de seção. Devem ser imponentes. O uso de `display-lg` e `headline-md` define a autoridade clínica.
*   **Body & Labels (Inter):** Foco total em clareza. O `body-md` é o nosso padrão para prontuários e dados de pacientes.
*   **Hierarquia como Identidade:** Títulos grandes com pesos maiores (Bold/SemiBold) contrastando com textos de apoio em pesos regulares criam um ritmo editorial que guia o olhar sem esforço.

---

## 4. Elevação e Profundidade Tonal

Esqueça as sombras pesadas do Material Design clássico. Aqui, a profundidade é atmosférica.

*   **Layering Principle:** A hierarquia é obtida empilhando tons. 
    *   Nível 0 (Fundo): `surface`
    *   Nível 1 (Seções): `surface_container_low`
    *   Nível 2 (Cards/Conteúdo): `surface_container_lowest` (#FFFFFF)
*   **Sombras Ambientes:** Quando um elemento precisar flutuar (ex: Botão Flutuante ou Modal), use sombras extra-difusas.
    *   *Shadow Token:* `color: rgba(11, 61, 94, 0.06)`, `blur: 24px`, `y-offset: 8px`. O tom da sombra deve ser um derivado do nosso azul profundo (`secondary`), nunca um cinza neutro ou preto.
*   **Ghost Border (Fallback):** Se o contraste for insuficiente (ex: acessibilidade), use uma borda "fantasma": `outline_variant` com apenas 15% de opacidade.

---

## 5. Componentes e Comportamento

### Botões (Ações de Confiança)
*   **Primary:** Baseado no `primary_container` com cantos arredondados `DEFAULT` (0.5rem). Use o gradiente sutil mencionado na Seção 2.
*   **Secondary:** Sem preenchimento, apenas o texto em `primary` ou uma versão *ghost* com fundo `surface_container_high`.
*   **Tertiary:** Apenas texto e ícone, para ações de baixa prioridade.

### Cards e Listas (O Fim das Divisórias)
*   **Proibição:** Nunca use linhas (`<hr>`) para separar itens de lista.
*   **Alternativa:** Utilize o *Vertical Spacing Scale*. Um espaçamento `4` (1rem) ou `5` (1.25rem) entre itens, ou uma leve mudança de cor de fundo no hover (`surface_container_high`), é suficiente para definir limites.

### Campos de Entrada (Inputs)
*   Devem parecer ferramentas de precisão. Fundo em `surface_container_lowest`, bordas em `outline_variant` (20% opacidade). No foco, a borda assume `primary` com um brilho sutil (glow) da mesma cor.

### Componentes Sugeridos para Contexto Médico:
*   **Health Chips:** Para status de exames (ex: "Concluído", "Pendente") usando `tertiary_container` (Turquesa) para sucesso e `error_container` para alertas, sempre com texto em alto contraste.
*   **Timeline de Prontuário:** Uma linha vertical sutil em `outline_variant` conectando nós circulares para histórico da paciente.

---

## 6. Do’s and Don’ts

### Do’s (Sim)
*   **✓** Use espaços em branco como uma ferramenta de design, não como "vazio".
*   **✓** Alinhe textos de forma assimétrica para criar um layout dinâmico, mas mantenha a precisão da grade.
*   **✓** Utilize o logo Gynmed de forma proeminente no cabeçalho `secondary` (#0B3D5E) para reforçar a marca.
*   **✓** Escreva em português (PT-BR) com tom profissional, direto e empático.

### Don’ts (Não)
*   **X** Não utilize sombras escuras ou opacas. Elas sujam a interface "clínica".
*   **X** Não use o verde turquesa (`tertiary`) em excesso; ele é um bisturi, use-o apenas para cortes de atenção ou sucesso.
*   **X** Jamais use bordas sólidas pretas ou cinza-escuras para separar seções.
*   **X** Evite cantos vivos (90°). Tudo deve ter uma suavidade técnica (`0.5rem` a `1rem`).

---

**Nota Final:** Este sistema de design não é um conjunto de regras rígidas, mas uma filosofia visual. Cada tela deve refletir a seriedade da Gynmed, tratada com a elegância de uma publicação de alto padrão.

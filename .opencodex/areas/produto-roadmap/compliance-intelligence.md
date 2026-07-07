---
tipo: estrategia
area: compliance
status: pronto
confianca: media
ultima_revisao: 2026-06-19
---

# ⚖️ Compliance Intelligence — mapa regulatório

> **AVISO:** este agente **não é fonte jurídica**. Nada aqui afirma conformidade. Toda conformidade vinculante exige **revisão jurídica humana**. Confiança: média (mapeamento), baixa (interpretação legal).
> **Regra (inviolável):** toda ideia com IA passa por este doc antes de virar roadmap/execução.

## 1. Brasil (mercado-mãe)
| Regime | Aplicação ao MultGestor | Estado |
|---|---|---|
| **LGPD** | dados pessoais de clientes/agendamentos; base legal, consentimento, direitos do titular, retenção | 🔴 política de privacidade ausente (A-023 / [[../living-os/riscos/riscos-ativos\|R-009]]) |
| **Marco Civil da Internet** | logs, guarda de registros, neutralidade | 🟡 não auditado |
| **CDC / e-commerce (Decreto 7.962)** | venda online, direito de arrependimento, transparência de preço | 🟡 relevante quando houver *Store*/cobrança ao consumidor |

## 2. Privacidade internacional
| Regime | Onde | Pontos-chave |
|---|---|---|
| **GDPR** | UE/Portugal | base legal, DPO, DPIA, direitos, transferência internacional |
| **UK GDPR + DPA 2018** | Reino Unido | espelha GDPR |
| **CCPA/CPRA** | Califórnia/EUA | opt-out de venda, direitos do consumidor |
| **PIPEDA + Lei 25 (Québec)** | Canadá | consentimento, residência de dados |
| **Privacy Act** | AU (1988) / NZ (2020) | princípios de privacidade |

### Transferência internacional de dados
Dados hoje em **Supabase sa-east-1 (Brasil)**. Operar na UE/UK exige base de transferência (SCCs/adequação) e possivelmente residência de dados regional. **Bloqueador real** para UE até resolvido ([[country-readiness-matrix]] = Blocked).

## 3. IA / agentes (obrigatório para qualquer feature com IA)
| Framework | Natureza | Aplicação |
|---|---|---|
| **EU AI Act** | Lei (UE) | classifica risco de sistemas de IA; obrigações por nível. Operar IA na UE exige conformidade → **Blocked** até avaliado |
| **NIST AI RMF** | Framework (voluntário, US) | governança/gestão de risco de IA — boa prática |
| **OECD AI Principles** | Princípios | transparência, robustez, accountability |
| **ISO/IEC 42001** | Norma (AIMS) | sistema de gestão de IA — referência para maturidade |
| **OWASP LLM Top 10** | Segurança | prompt injection, data leakage, output handling — **aplicar a qualquer LLM no produto** (ex.: IA recepcionista) |

### Regra para o Autopilot e qualquer IA do produto
Cruza com a política do Autopilot ([[../../automation/autopilot-policy|autopilot-policy]]): fail-closed, sem dados sensíveis em prompt/log (OWASP LLM #2/#6), human-in-the-loop em decisão de impacto. IA voltada ao cliente (recepcionista, recomendação) exige: aviso de IA, opt-out, sem PII desnecessária, revisão jurídica.

## 4. Checklist mínimo antes de cliente pagante (BR)
- [ ] Política de privacidade + termos de uso publicados (A-023)
- [ ] Consentimento no cadastro/booking
- [ ] Base legal LGPD documentada (execução de contrato / legítimo interesse)
- [ ] Retenção e exclusão de conta definidas
- [ ] PII fora de logs (cruza A-019)

## 5. Classificação de prontidão de compliance
- **BR:** 🟡 operável com pendências (publicar privacidade/consentimento antes de vender).
- **Portugal/UE:** ❌ exige GDPR + transferência de dados + (IA) AI Act.
- **US/UK/CA/AU:** ❌ exige regime local + gateway + i18n.

## Próxima ação
Publicar privacidade/termos/consentimento BR (pré-venda). Qualquer feature de IA: passar por OWASP LLM Top 10 + (se UE) AI Act, com revisão jurídica humana. Registrar decisões em [[strategic-decision-log]].

## Links
- [[country-readiness-matrix]] · [[product-futurist-engine]] · [[../living-os/riscos/riscos-ativos|Riscos Ativos]] · [[../../automation/autopilot-policy|Autopilot Policy]]

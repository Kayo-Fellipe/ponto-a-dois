/* ============================================================
   PONTO A DOIS — CONFIGURAÇÃO PÚBLICA
   A chave "publishable" pode ficar no site: quem protege os dados
   são as regras de acesso (RLS) do banco. NUNCA coloque aqui a
   chave "service_role", segredos da Stripe ou do Google.
   ============================================================ */
window.EntreNosConfig = {
  supabaseUrl: "https://bxothpphamszrbfiriqn.supabase.co",
  supabaseKey: "sb_publishable_ViT_7zWpE17oQh2wK7Ja6w_00D1RVI4",
  // false = jogar sem login (útil para testar o visual localmente)
  requireLogin: true,
};

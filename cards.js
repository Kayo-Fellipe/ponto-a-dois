/* ============================================================
   PONTO A DOIS — DADOS DO JOGO
   ------------------------------------------------------------
   Este arquivo concentra TODO o conteúdo. A estrutura de cada
   carta é a mesma que será usada na tabela do Supabase, então a
   migração é só carregar estes dados no banco.

   Carta:
   {
     id:       "conexao-001"   (gerado automaticamente, estável)
     cat:      "conexao" | "diversao" | "carinho" | "intimidade" | "posicoes"
     int:      "leve" | "picante" | "intenso"
     fmt:      formato (veja FORMATS)
     text:     texto principal (aceita {atual} e {outro} = nomes)
     options:  ["A", "B"]      (formato "escolha")
     truth / dare: textos do formato "vd" (verdade ou desafio)
     dareSeconds:  cronômetro que só aparece se a pessoa escolher o desafio
     seconds:  número          (mostra cronômetro)
     who:      "vez" | "ambos" (padrão vem do formato)
     tags:     ["fim", ...]    ("fim" = só na Noite de Encontro)
   }

   IMPORTANTE: para não quebrar os ids, adicione novas cartas
   sempre no FINAL do bloco da categoria.
   ============================================================ */
(function () {
  const svg = (inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  /* ---------- Categorias ---------- */
  const categories = [
    {
      id: "conexao",
      name: "Conexão",
      sub: "Perguntas e memórias",
      icon: svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/>'),
    },
    {
      id: "diversao",
      name: "Diversão",
      sub: "Brincadeiras e risadas",
      icon: svg('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>'),
    },
    {
      id: "verdade",
      name: "Verdade ou Desafio",
      sub: "Você escolhe o lado",
      icon: svg('<rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>'),
    },
    {
      id: "carinho",
      name: "Carinho",
      sub: "Toques e beijos",
      icon: svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>'),
    },
    {
      id: "intimidade",
      name: "Intimidade",
      sub: "Desejo e cumplicidade",
      icon: svg('<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>'),
    },
    {
      id: "posicoes",
      name: "Posições",
      sub: "Ideias para os dois",
      icon: svg('<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>'),
    },
  ];

  /* ---------- Intensidades (cumulativas: "Picante" inclui "Leve") ---------- */
  const intensities = [
    { id: "leve",    name: "Leve",    desc: "Carinho, risadas e conversa" },
    { id: "picante", name: "Picante", desc: "Mais envolvente e provocante" },
    { id: "intenso", name: "Intenso", desc: "Mais profundo e ousado" },
  ];

  // Nomes da intensidade que fazem mais sentido em cada categoria
  const intLabels = {
    conexao:  { leve: "Leve", picante: "Profundo", intenso: "Muito profundo" },
    diversao: { leve: "Leve", picante: "Animado",  intenso: "Ousado" },
  };

  /* ---------- Formatos ---------- */
  const formats = {
    acao:        { label: "Ação", help: "Uma ação para fazer, às vezes com cronômetro.",             who: "vez",   hint: "" },
    pergunta:    { label: "Pergunta", help: "Cada um responde, um de cada vez.",         who: "ambos", hint: "Cada um responde, um de cada vez." },
    escolha:     { label: "Escolha", help: "Duas opções (A ou B). Quem está na vez escolhe.",          who: "vez",   hint: "{atual} escolhe e conta o porquê." },
    adivinha:    { label: "Adivinha", help: "Um tenta adivinhar algo sobre o outro.",         who: "vez",   hint: "{atual} tenta adivinhar. Depois, {outro} revela." },
    juntos:      { label: "Juntos", help: "Os dois ao mesmo tempo, com contagem 3, 2, 1.",           who: "ambos", hint: "Os dois ao mesmo tempo.", countdown: true },
    frase:       { label: "Complete a frase", help: "Cada um completa a frase em voz alta.", who: "ambos", hint: "Cada um completa, em voz alta." },
    historia:    { label: "Nossa história", help: "Um conta uma lembrança e o outro escuta.",   who: "ambos", hint: "Um conta, o outro escuta. Depois invertam." },
    brincadeira: { label: "Brincadeira", help: "Algo leve para rir juntos.",      who: "vez",   hint: "" },
    vd:          { label: "Você escolhe", help: "Quem está na vez escolhe verdade ou desafio.",     who: "vez",   hint: "{atual} escolhe. Pode mudar de ideia ou pedir outra carta." },
    missao:      { label: "Missão", help: "Um combinado para depois do jogo.",           who: "ambos", hint: "Combinem agora. Vale para depois do jogo." },
  };

  /* ---------- Noite de Encontro (sessão guiada) ---------- */
  const stages = [
    { id: "aquecimento", name: "Aquecimento", n: 3, cats: ["conexao", "diversao"], ints: ["leve"], tags: ["abertura"] },
    { id: "conexao",     name: "Conexão",     n: 4, cats: ["conexao"],             ints: ["leve", "picante"] },
    { id: "diversao",    name: "Diversão",    n: 3, cats: ["diversao", "verdade"],            ints: ["leve", "picante"] },
    { id: "carinho",     name: "Carinho",     n: 3, cats: ["carinho"],             ints: ["leve", "picante", "intenso"], ascending: true },
    { id: "intimidade",  name: "Intimidade",  n: 3, cats: ["intimidade", "posicoes"], ints: ["picante", "intenso"], ascending: true },
    { id: "fechamento",  name: "Fechamento",  n: 1, cats: ["conexao"],             ints: ["leve", "picante", "intenso"], tags: ["fim"], only: true },
  ];

  /* ---------- Cartas ---------- */
  const cards = [];
  const counters = {};
  const k = (cat, int, fmt, text, extra = {}) => {
    counters[cat] = (counters[cat] || 0) + 1;
    cards.push({
      id: `${cat}-${String(counters[cat]).padStart(3, "0")}`,
      cat, int, fmt, text, ...extra,
    });
  };

  /* ===================== CONEXÃO ===================== */
  // ---- Perguntas / leve
  k("conexao", "leve", "pergunta", "Qual foi a sua primeira impressão de mim?");
  k("conexao", "leve", "pergunta", "Qual música te lembra de nós dois, e por quê?");
  k("conexao", "leve", "pergunta", "O que você mais gosta de fazer comigo num dia comum?");
  k("conexao", "leve", "pergunta", "Qual é a lembrança mais engraçada que temos juntos?");
  k("conexao", "leve", "pergunta", "Qual hábito meu você acha mais fofo?");
  k("conexao", "leve", "pergunta", "Se pudéssemos viajar amanhã, para onde iríamos e o que faríamos primeiro?");
  k("conexao", "leve", "pergunta", "Qual gesto de carinho meu você nunca esqueceu?");
  k("conexao", "leve", "pergunta", "O que você sempre quis aprender ou fazer ao meu lado?");
  k("conexao", "leve", "pergunta", "Qual lugar é só nosso, e por que ele é especial?");
  k("conexao", "leve", "pergunta", "Que prato você pediria para eu cozinhar para você hoje?");
  k("conexao", "leve", "pergunta", "Qual dia comum virou especial por minha causa?");
  // ---- Perguntas / profundo
  k("conexao", "picante", "pergunta", "Quando você se sente mais amado(a) por mim?");
  k("conexao", "picante", "pergunta", "O que eu faço que faz você se sentir cuidado(a), mesmo sem eu perceber?");
  k("conexao", "picante", "pergunta", "Do que você sente falta de quando estávamos começando?");
  k("conexao", "picante", "pergunta", "Que momento difícil nos deixou mais fortes?");
  k("conexao", "picante", "pergunta", "O que você gostaria que fizéssemos mais vezes, só nós dois?");
  k("conexao", "picante", "pergunta", "Em que momento da semana você mais sente a minha falta, mesmo estando perto?");
  k("conexao", "picante", "pergunta", "O que te deixa inseguro(a) numa relação, e como eu posso ajudar?");
  k("conexao", "picante", "pergunta", "Qual é o seu maior sonho para nós dois nos próximos cinco anos?");
  // ---- Perguntas / muito profundo
  k("conexao", "intenso", "pergunta", "Existe algo que você ainda não me contou por medo de me magoar? Diga com carinho.");
  k("conexao", "intenso", "pergunta", "Qual parte de você gostaria que eu entendesse melhor?");
  k("conexao", "intenso", "pergunta", "Do que você precisa de mim agora e ainda não pediu?");
  k("conexao", "intenso", "pergunta", "Quando foi a última vez que você se sentiu realmente ouvido(a) por mim?");
  k("conexao", "intenso", "pergunta", "Qual promessa você gostaria de renovar comigo hoje?");
  k("conexao", "intenso", "pergunta", "O que você admira em mim quando eu enfrento um problema?");
  // ---- Complete a frase
  k("conexao", "leve", "frase", "Eu me sinto mais perto de você quando…");
  k("conexao", "leve", "frase", "Uma coisa pequena que você faz e eu adoro é…");
  k("conexao", "leve", "frase", "Meu momento favorito do dia com você é…");
  k("conexao", "leve", "frase", "Se a nossa história fosse um filme, ele seria…");
  k("conexao", "picante", "frase", "Eu me sinto mais amado(a) quando você…");
  k("conexao", "picante", "frase", "Uma coisa que eu nunca agradeci a você é…");
  k("conexao", "picante", "frase", "Tenho orgulho de nós dois porque…");
  k("conexao", "picante", "frase", "Eu gostaria que tivéssemos mais tempo para…");
  k("conexao", "intenso", "frase", "Uma coisa que eu tenho medo de pedir é…");
  k("conexao", "intenso", "frase", "O que mais me emociona em você é…");
  k("conexao", "intenso", "frase", "Daqui a dez anos, eu quero que a gente…");
  // ---- Nossa história
  k("conexao", "leve", "historia", "Contem, cada um do seu jeito, como foi o primeiro encontro de vocês.");
  k("conexao", "leve", "historia", "Relembrem a primeira vez que se viram: o que cada um vestia e o que pensou?");
  k("conexao", "leve", "historia", "Contem a viagem ou o passeio de que mais gostam de lembrar.");
  k("conexao", "leve", "historia", "Lembrem juntos de uma gargalhada que vocês não conseguiam parar.");
  k("conexao", "picante", "historia", "Contem o momento em que sentiram que estavam apaixonados de verdade.");
  k("conexao", "picante", "historia", "Relembrem um desafio que superaram juntos e o que aprenderam com ele.");
  k("conexao", "picante", "historia", "Contem o dia em que cada um percebeu que queria ficar com a outra pessoa.");
  k("conexao", "intenso", "historia", "Escolham uma lembrança e contem como se estivessem escrevendo uma carta para o futuro de vocês.");
  k("conexao", "intenso", "historia", "Contem o momento em que se sentiram mais cuidados pela outra pessoa.");
  // ---- Escolha
  k("conexao", "leve", "escolha", "Qual conversa vocês escolhem agora?",
    { options: ["Contar a melhor lembrança do último ano", "Falar de um sonho para os próximos 12 meses"] });
  k("conexao", "leve", "escolha", "Escolha uma delas:",
    { options: ["Elogiar a outra pessoa por 30 segundos", "Agradecer algo específico dos últimos dias"] });
  k("conexao", "leve", "escolha", "O que você prefere contar?",
    { options: ["Algo que te fez rir esta semana", "Algo que te deixou orgulhoso(a) esta semana"] });
  k("conexao", "picante", "escolha", "Escolha uma delas:",
    { options: ["Pedir um tipo de carinho que anda faltando", "Oferecer um carinho que você anda guardando"] });
  k("conexao", "picante", "escolha", "Sobre esta semana, o que você escolhe falar?",
    { options: ["Algo que te preocupou", "Algo que você gostaria de ter feito diferente"] });
  // ---- Adivinha
  k("conexao", "leve", "adivinha", "Adivinhe qual é a comida de que {outro} mais sente falta da infância.");
  k("conexao", "leve", "adivinha", "Adivinhe qual é o maior sonho de {outro} para este ano.");
  k("conexao", "leve", "adivinha", "Adivinhe qual música {outro} mais ouve quando está feliz.");
  k("conexao", "leve", "adivinha", "Adivinhe do que {outro} mais se orgulha em si mesmo(a).");
  k("conexao", "picante", "adivinha", "Adivinhe o que {outro} mais admira em você.");
  k("conexao", "picante", "adivinha", "Adivinhe qual foi o momento em que {outro} mais se sentiu amado(a) por você.");
  k("conexao", "picante", "adivinha", "Adivinhe o que {outro} gostaria que vocês fizessem mais vezes, só os dois.");
  // ---- Missão
  k("conexao", "leve", "missao", "Combinem uma noite sem telas para esta semana. Escolham o dia agora.");
  k("conexao", "leve", "missao", "Escolham um lugar novo para um passeio nas próximas duas semanas.");
  k("conexao", "leve", "missao", "Escolham uma música que seja de vocês e combinem de ouvi-la juntos hoje.");
  k("conexao", "picante", "missao", "Combinem um ritual de 10 minutos por dia, só para conversar sobre como cada um está.");
  k("conexao", "picante", "missao", "Escrevam, cada um, um bilhete de agradecimento e escondam no bolso ou na bolsa do outro.");
  k("conexao", "intenso", "missao", "Combinem uma conversa sem pressa sobre o que cada um precisa para se sentir mais perto no dia a dia.");
  // ---- Abertura (aquecimento da Noite de Encontro; também entram no modo livre)
  k("conexao", "leve", "pergunta", "Qual foi o melhor momento do seu dia hoje?", { tags: ["abertura"] });
  k("conexao", "leve", "pergunta", "Do que você mais precisa agora: descanso, risadas ou carinho?", { tags: ["abertura"] });
  k("conexao", "leve", "juntos", "No 3, digam ao mesmo tempo, em uma palavra, como foi o dia de vocês.", { tags: ["abertura"] });
  // ---- Fechamento (só na Noite de Encontro)
  k("conexao", "leve", "frase", "Uma coisa que eu quero agradecer a você por esta noite é…", { tags: ["fim"] });
  k("conexao", "leve", "frase", "Hoje eu descobri sobre você que…", { tags: ["fim"] });
  k("conexao", "picante", "missao", "Terminem com um abraço de um minuto e um obrigado sincero.", { tags: ["fim"], seconds: 60 });
  k("conexao", "picante", "frase", "O momento desta noite de que eu mais vou lembrar é…", { tags: ["fim"] });

  /* ===================== DIVERSÃO ===================== */
  // ---- Brincadeiras / leve
  k("diversao", "leve", "brincadeira", "Faça uma propaganda de 30 segundos vendendo as qualidades de {outro}, como num comercial de TV.", { seconds: 30 });
  k("diversao", "leve", "brincadeira", "Imite o jeito de {outro} falar ao telefone. Exageros carinhosos são permitidos.");
  k("diversao", "leve", "brincadeira", "Concurso de caretas: quem rir primeiro perde.", { who: "ambos", seconds: 30 });
  k("diversao", "leve", "brincadeira", "Dê um apelido novo e carinhoso a {outro} e explique o motivo.");
  k("diversao", "leve", "brincadeira", "Conte a pior piada que você souber. {outro} dá uma nota de 0 a 10.");
  k("diversao", "leve", "brincadeira", "Narre o dia de hoje de vocês como num documentário de natureza.");
  k("diversao", "leve", "brincadeira", "Cantem juntos o refrão de uma música que os dois conheçam.", { who: "ambos" });
  k("diversao", "leve", "brincadeira", "Inventem um aperto de mão secreto, só de vocês, com pelo menos três movimentos.", { who: "ambos" });
  // ---- Brincadeiras / animado
  k("diversao", "picante", "brincadeira", "Peça desculpas de forma dramática por uma coisa inventada e ridícula.");
  k("diversao", "picante", "brincadeira", "Faça uma declaração de amor no estilo novela, com direito a música de fundo cantarolada.", { seconds: 30 });
  k("diversao", "picante", "brincadeira", "Mostre como {outro} anda quando está com pressa.");
  k("diversao", "picante", "brincadeira", "Façam um desfile de moda com o que tiverem à mão. {outro} é o jurado.", { who: "ambos" });
  k("diversao", "picante", "brincadeira", "Escolha uma música e dance para {outro} por 30 segundos, sem vergonha.", { seconds: 30 });
  k("diversao", "picante", "brincadeira", "Conte um segredo bobo que {outro} ainda não sabe.");
  // ---- Brincadeiras / ousado
  k("diversao", "intenso", "brincadeira", "Dancem juntos uma música inteira, bem abraçados.", { who: "ambos" });
  k("diversao", "intenso", "brincadeira", "Conquistem um ao outro com a pior cantada que conhecerem. Valem as risadas.", { who: "ambos" });
  k("diversao", "intenso", "brincadeira", "Diga uma frase de filme romântico olhando nos olhos de {outro}, sem rir.");
  k("diversao", "intenso", "brincadeira", "Durante 1 minuto, {outro} dá comandos divertidos (girar, dançar, fazer cara de apaixonado) e você obedece.", { seconds: 60 });
  // ---- Escolha
  k("diversao", "leve", "escolha", "Qual vocês escolhem?", { options: ["Um jantar romântico em casa", "Uma noite de pizza e filme no sofá"] });
  k("diversao", "leve", "escolha", "Para a próxima escapada:", { options: ["Praia", "Montanha"] });
  k("diversao", "leve", "escolha", "Vocês ganham um prêmio. Qual escolhem?", { options: ["Uma noite só para vocês, sem interrupções", "Um fim de semana num lugar de sonho"] });
  k("diversao", "leve", "escolha", "Qual vocês escolhem agora?", { options: ["Uma dança lenta", "Uma dança bem animada"] });
  k("diversao", "leve", "escolha", "O que você prefere ouvir?", { options: ["{outro} cantando para você", "{outro} inventando uma história para você"] });
  k("diversao", "picante", "escolha", "Escolha o que você quer receber:", { options: ["Uma carta de amor escrita à mão", "Uma playlist feita só para você"] });
  k("diversao", "picante", "escolha", "Qual vocês escolhem?", { options: ["Um jantar à luz de velas", "Um piquenique de madrugada na sala"] });
  k("diversao", "picante", "escolha", "Escolha como vai ser a próxima rodada:", { options: ["Com muita risada", "Com muito carinho"] });
  k("diversao", "intenso", "escolha", "Escolha uma delas:", { options: ["Fazer a outra pessoa rir até chorar", "Fazer a outra pessoa se arrepiar com um sussurro"] });
  k("diversao", "intenso", "escolha", "Qual vocês escolhem?", { options: ["Dançar abraçados pela sala", "Ficar abraçados em silêncio por um minuto"] });
  // ---- Adivinha
  k("diversao", "leve", "adivinha", "Adivinhe qual filme {outro} assistiria mil vezes.");
  k("diversao", "leve", "adivinha", "Adivinhe qual é o maior medo bobo de {outro}.");
  k("diversao", "leve", "adivinha", "Adivinhe qual é a primeira coisa que {outro} faz ao acordar.");
  k("diversao", "leve", "adivinha", "Adivinhe qual era o apelido de infância de {outro}.");
  k("diversao", "picante", "adivinha", "Adivinhe o que {outro} faria se tivesse um dia inteiro sem compromissos.");
  k("diversao", "picante", "adivinha", "Adivinhe qual música {outro} escolheria para tocar numa festa de vocês.");
  k("diversao", "picante", "adivinha", "Adivinhe qual lugar do mundo {outro} escolheria para uma escapada a dois.");
  // ---- Juntos
  k("diversao", "leve", "juntos", "No 3, apontem ao mesmo tempo para quem é mais bagunceiro.");
  k("diversao", "leve", "juntos", "No 3, digam ao mesmo tempo o nome da sua comida favorita.");
  k("diversao", "leve", "juntos", "No 3, façam ao mesmo tempo uma cara de quem acabou de ganhar na loteria.");
  k("diversao", "leve", "juntos", "No 3, digam juntos a primeira palavra que vem à cabeça quando pensam em abraço.");
  k("diversao", "leve", "juntos", "No 3, digam ao mesmo tempo o nome de um filme que gostariam de ver hoje.");
  k("diversao", "picante", "juntos", "No 3, digam ao mesmo tempo o que mais gostam de fazer juntos.");
  k("diversao", "picante", "juntos", "No 3, apontem ao mesmo tempo para quem dá os melhores abraços.");
  k("diversao", "picante", "juntos", "No 3, mostrem com os dedos, de 1 a 5, o quanto estão com vontade de um beijo agora.");
  k("diversao", "picante", "juntos", "No 3, cada um diz uma qualidade do outro, ao mesmo tempo.");
  k("diversao", "intenso", "juntos", "No 3, aproximem-se e deem o beijo que estiverem com vontade.");
  k("diversao", "intenso", "juntos", "No 3, digam ao mesmo tempo uma palavra que descreva o que estão sentindo agora.");
  // ---- Ação
  k("diversao", "leve", "acao", "Faça {outro} sorrir sem usar palavras.");
  k("diversao", "leve", "acao", "Faça uma declaração romântica improvisada para {outro}.");
  k("diversao", "picante", "acao", "Deixe {outro} sem graça usando apenas elogios.");
  k("diversao", "picante", "acao", "Passe 30 segundos conquistando {outro} apenas com o olhar.", { seconds: 30 });

  /* ===================== VERDADE OU DESAFIO ===================== */
  // vd(intensidade, verdade, desafio, { dareSeconds })
  const vd = (int, truth, dare, extra = {}) =>
    k("verdade", int, "vd", "Verdade ou desafio?", { truth, dare, ...extra });

  // ---- Leve
  vd("leve", "Qual foi a primeira coisa que você achou charmosa em mim?", "Faça uma declaração de amor de 20 segundos, com direito a drama.", { dareSeconds: 20 });
  vd("leve", "Qual é a sua lembrança favorita de nós dois?", "Imite o jeito de {outro} rir.");
  vd("leve", "Qual mania minha você acha mais engraçada?", "Dê um abraço de 20 segundos e não solte antes do tempo.", { dareSeconds: 20 });
  vd("leve", "Qual música você dedicaria a mim hoje?", "Cante o refrão dessa música para {outro}.");
  vd("leve", "Você já sentiu ciúmes de algo bobo? Conte.", "Faça {outro} sorrir sem usar palavras.");
  vd("leve", "Qual foi o melhor beijo que já demos? Onde estávamos?", "Dê um beijo na testa, um no rosto e um na boca de {outro}.");
  vd("leve", "O que você mais gosta em mim: o abraço, a voz ou o sorriso?", "Faça uma massagem de 1 minuto nos ombros de {outro}.", { dareSeconds: 60 });
  vd("leve", "Em que momento você mais riu comigo?", "Faça uma careta e segure até {outro} rir.");
  vd("leve", "Se você pudesse me dar qualquer presente hoje, qual seria?", "Escreva com o dedo, nas costas de {outro}, uma palavra carinhosa. {outro} tenta adivinhar.");
  vd("leve", "O que você mais admira em mim?", "Beije a mão de {outro} e diga uma coisa que você ama nela.");
  vd("leve", "Qual é a sua comida favorita para dividir comigo?", "Dance por 20 segundos, sem música e sem vergonha.", { dareSeconds: 20 });
  vd("leve", "Qual foi o dia mais feliz que você viveu comigo?", "Faça cafuné em {outro} por 1 minuto.", { dareSeconds: 60 });
  // ---- Picante
  vd("picante", "Em que momento você mais se sente atraído(a) por mim?", "Sussurre no ouvido de {outro} algo que você acha muito atraente em {outro}.");
  vd("picante", "Qual foi o beijo nosso que mais te marcou?", "Beije {outro} devagar, aproximando o corpo aos poucos.");
  vd("picante", "Qual roupa minha faz você olhar duas vezes?", "Fique a poucos centímetros de {outro} por 30 segundos, sem beijar.", { dareSeconds: 30 });
  vd("picante", "Você já pensou em mim num momento inesperado do dia? Quando?", "Dance para {outro} por 30 segundos.", { dareSeconds: 30 });
  vd("picante", "O que eu faço que te deixa sem graça (do jeito bom)?", "Dê três beijos lentos nos lugares que {outro} escolher.");
  vd("picante", "Que lugar você gostaria de me levar numa noite especial?", "{outro} fecha os olhos e você escolhe onde dará cinco beijos.");
  vd("picante", "Qual é o seu momento do dia favorito para ficar perto de mim?", "Dê um beijo lento no pescoço de {outro}.");
  vd("picante", "O que te faz sentir mais desejado(a) por mim?", "Olhe nos olhos de {outro} por 30 segundos, sem falar e sem rir.", { dareSeconds: 30 });
  vd("picante", "Se tivéssemos uma noite livre amanhã, o que você planejaria?", "Faça uma massagem lenta nas costas de {outro} por 1 minuto.", { dareSeconds: 60 });
  vd("picante", "Que tipo de carinho você mais gosta de receber de mim?", "Dê o carinho que {outro} pedir, por 1 minuto.", { dareSeconds: 60 });
  vd("picante", "Qual cantada ou frase minha você nunca esqueceu?", "Diga a pior cantada que você conhecer, olhando nos olhos de {outro}.");
  vd("picante", "Quando você sentiu vontade de me beijar pela primeira vez?", "Beije {outro} por 1 minuto, sem interromper o contato.", { dareSeconds: 60 });
  // ---- Intenso
  vd("intenso", "O que você sempre teve vontade de me pedir?", "Sussurre uma fantasia romântica no ouvido de {outro}.");
  vd("intenso", "Qual é o seu maior desejo para uma noite a dois?", "Beije {outro} como se fosse a primeira vez, com calma e curiosidade.");
  vd("intenso", "O que mais te deixa arrepiado(a) quando estamos juntos?", "Beije devagar o pescoço de {outro}, mantendo o contato visual.");
  vd("intenso", "O que você gostaria que fizéssemos mais vezes, só nós dois?", "Dê beijos demorados pelo pescoço e pelos ombros de {outro}.");
  vd("intenso", "Qual momento nosso a sós você mais gostaria de reviver?", "Dancem juntos, bem abraçados, até o fim de uma música.");
  vd("intenso", "Como você descreveria a nossa química em três palavras?", "Comece com um beijo suave e aumente a intensidade aos poucos.");
  vd("intenso", "O que você gostaria de experimentar comigo que ainda não fizemos?", "Escolha uma frase de efeito e diga olhando nos olhos de {outro}, sem rir.");
  vd("intenso", "Em que situação você se sente mais à vontade comigo?", "Deixe {outro} escolher um carinho e faça por 1 minuto.", { dareSeconds: 60 });
  vd("intenso", "O que você mais gosta quando ficamos a sós?", "Termine esta rodada com o beijo mais apaixonado que conseguirem.");
  vd("intenso", "Qual é a sua maior vontade agora, sem filtro e sem pressão?", "Fique frente a frente com {outro} e diga o que mais te encanta em {outro}.");

  /* ===================== CARINHO ===================== */
  // ---- Ação / leve
  k("carinho", "leve", "acao", "Dê um abraço apertado e demorado em {outro}, até os dois relaxarem.", { seconds: 30, who: "ambos" });
  k("carinho", "leve", "acao", "Faça cafuné em {outro} por 1 minuto, sem dizer nada.", { seconds: 60 });
  k("carinho", "leve", "acao", "Dê um beijo na testa, um no rosto e um na boca de {outro}.");
  k("carinho", "leve", "acao", "Beije a mão de {outro} e diga uma coisa que você ama nela.");
  k("carinho", "leve", "acao", "Segure o rosto de {outro} com as duas mãos e diga o que mais gosta no olhar.");
  k("carinho", "leve", "acao", "Faça uma massagem lenta nos ombros de {outro}.", { seconds: 60 });
  k("carinho", "leve", "acao", "Dê três beijos lentos nos lugares que {outro} escolher.");
  k("carinho", "leve", "acao", "Abrace {outro} por trás e fiquem assim por 30 segundos.", { seconds: 30 });
  k("carinho", "leve", "acao", "Deite a cabeça no colo de {outro} e peça um carinho por 1 minuto.", { seconds: 60 });
  k("carinho", "leve", "acao", "Dê um beijo lento no pescoço de {outro}.");
  k("carinho", "leve", "acao", "Beije {outro} sem usar as mãos.");
  k("carinho", "leve", "juntos", "Segurem as mãos e respirem juntos, no mesmo ritmo, por 1 minuto.", { seconds: 60 });
  k("carinho", "leve", "acao", "Escreva com o dedo, nas costas de {outro}, uma palavra carinhosa. {outro} tenta adivinhar qual é.");
  // ---- Ação / envolvente
  k("carinho", "picante", "acao", "Beije {outro} devagar, aproximando o corpo aos poucos.");
  k("carinho", "picante", "acao", "Beijem-se por 1 minuto sem interromper o contato.", { seconds: 60, who: "ambos" });
  k("carinho", "picante", "acao", "Comece com um beijo delicado e aumente a intensidade aos poucos.");
  k("carinho", "picante", "acao", "Aproxime-se para beijar, pare por alguns segundos e provoque antes de continuar.");
  k("carinho", "picante", "acao", "Passe as mãos devagar pelos braços e pelas costas de {outro}.");
  k("carinho", "picante", "acao", "Faça uma massagem lenta, com as duas mãos, nas costas de {outro}.", { seconds: 90 });
  k("carinho", "picante", "acao", "{outro} fecha os olhos e você escolhe onde dará cinco beijos.");
  k("carinho", "picante", "acao", "Fique a poucos centímetros de {outro} por 30 segundos, sem beijar.", { seconds: 30 });
  k("carinho", "picante", "acao", "Beije {outro} com os corpos bem encostados, sem pressa.");
  k("carinho", "picante", "acao", "Dê uma sequência de beijos que começa no pescoço e termina onde {outro} escolher.");
  k("carinho", "picante", "acao", "Dancem bem juntinhos até o fim de uma música.", { who: "ambos" });
  // ---- Ação / intenso
  k("carinho", "intenso", "acao", "Beijem-se por 2 minutos, alternando beijos suaves e mais intensos.", { seconds: 120, who: "ambos" });
  k("carinho", "intenso", "acao", "Beije devagar o pescoço de {outro}, mantendo o contato visual.");
  k("carinho", "intenso", "acao", "{outro} fecha os olhos. Escolha uma sequência de beijos para arrepiar {outro}.");
  k("carinho", "intenso", "acao", "Beije {outro} enquanto suas mãos percorrem devagar os ombros e as costas.");
  k("carinho", "intenso", "acao", "Dê beijos demorados pelo pescoço e pelos ombros de {outro}.");
  k("carinho", "intenso", "acao", "Comece suave e aumente a intensidade até {outro} pedir para você continuar.");
  k("carinho", "intenso", "acao", "Beijem-se como se fosse a primeira vez, com calma e curiosidade.", { who: "ambos" });
  k("carinho", "intenso", "acao", "Finalizem esta rodada com o beijo mais apaixonado que conseguirem.", { who: "ambos" });
  // ---- Pergunta
  k("carinho", "leve", "pergunta", "Qual tipo de carinho você mais gosta de receber?");
  k("carinho", "leve", "pergunta", "Onde você mais gosta de receber carinho: cabelo, costas, mãos?");
  k("carinho", "picante", "pergunta", "Tem algum carinho que você gostaria de receber com mais frequência?");
  k("carinho", "picante", "pergunta", "Qual beijo nosso você mais lembra, e por quê?");
  // ---- Frase
  k("carinho", "leve", "frase", "Um abraço meu faz você se sentir…");
  k("carinho", "leve", "frase", "O carinho que mais me acalma é…");
  k("carinho", "picante", "frase", "Meu beijo favorito é aquele em que…");
  k("carinho", "picante", "frase", "Eu fico arrepiado(a) quando você…");
  // ---- Escolha
  k("carinho", "leve", "escolha", "Qual carinho vocês escolhem agora?", { options: ["Cafuné por 2 minutos", "Massagem nos pés por 2 minutos"] });
  k("carinho", "leve", "escolha", "Escolha um:", { options: ["Abraço longo e silencioso", "Dança lenta abraçados"] });
  k("carinho", "leve", "escolha", "O que {outro} vai fazer por você agora?", { options: ["Carinho nas costas", "Carinho no cabelo"] });
  k("carinho", "picante", "escolha", "Escolha um:", { options: ["Beijos no pescoço", "Beijos nos ombros"] });
  k("carinho", "picante", "escolha", "Qual estilo de beijo você pede agora?", { options: ["Um beijo lento e demorado", "Vários beijinhos rápidos"] });

  /* ===================== INTIMIDADE ===================== */
  // ---- Leve
  k("intimidade", "leve", "pergunta", "Qual foi o momento mais romântico que já vivemos?");
  k("intimidade", "leve", "pergunta", "Qual beijo nosso você mais gostou, e por quê?");
  k("intimidade", "leve", "pergunta", "Em que situação você se sente mais desejado(a)?");
  k("intimidade", "leve", "pergunta", "Qual roupa minha você acha mais atraente?");
  k("intimidade", "leve", "pergunta", "Quando você percebeu que sentia atração por mim?");
  k("intimidade", "leve", "pergunta", "O que em mim mais chama a sua atenção?");
  k("intimidade", "leve", "frase", "Eu sinto mais vontade de ficar perto de você quando…");
  k("intimidade", "leve", "frase", "Uma coisa que você faz e que chama minha atenção na hora é…");
  k("intimidade", "leve", "frase", "Meu momento mais romântico com você foi…");
  k("intimidade", "leve", "frase", "Eu gostaria que você fizesse mais vezes…");
  k("intimidade", "leve", "acao", "Sussurre no ouvido de {outro} algo que você acha muito atraente em {outro}.");
  k("intimidade", "leve", "acao", "Diga três coisas de que você mais gosta em {outro}.");
  k("intimidade", "leve", "acao", "Sussurre uma frase que faça {outro} sorrir.");
  k("intimidade", "leve", "juntos", "Olhem-se nos olhos por 30 segundos, sem falar.", { seconds: 30 });
  // ---- Picante
  k("intimidade", "picante", "pergunta", "O que me deixa mais atraente aos seus olhos?");
  k("intimidade", "picante", "pergunta", "Em que momento você sente mais química entre nós?");
  k("intimidade", "picante", "pergunta", "Como seria uma noite perfeita para nós dois?");
  k("intimidade", "picante", "pergunta", "Que lugar você gostaria de me levar numa noite especial?");
  k("intimidade", "picante", "frase", "Algo que eu gostaria de viver mais com você, a sós, é…");
  k("intimidade", "picante", "frase", "Uma frase que eu normalmente teria vergonha de dizer é…");
  k("intimidade", "picante", "acao", "Escolha uma parte de {outro} para admirar por 30 segundos.", { seconds: 30 });
  k("intimidade", "picante", "acao", "Fique bem perto de {outro} e diga três coisas que despertam o seu desejo.");
  k("intimidade", "picante", "acao", "Sussurre no ouvido de {outro} uma fantasia romântica que você ainda não contou.");
  k("intimidade", "picante", "acao", "{outro} faz uma pergunta íntima. Responda com sinceridade, ou troque a carta sem explicar.");
  k("intimidade", "picante", "escolha", "Escolha como contar:", { options: ["Dizer o que mais gosta quando estão a sós", "Mostrar sem usar palavras"] });
  k("intimidade", "picante", "escolha", "Qual vocês escolhem?", { options: ["Uma noite de massagens", "Uma noite de dança e beijos"] });
  k("intimidade", "picante", "adivinha", "Adivinhe qual roupa sua {outro} mais gosta de ver em você.");
  // ---- Intenso
  k("intimidade", "intenso", "pergunta", "O que você sempre teve vontade de me pedir?");
  k("intimidade", "intenso", "pergunta", "Qual é o seu maior desejo para uma noite a dois?");
  k("intimidade", "intenso", "frase", "Uma coisa que eu gostaria de experimentar com você é…");
  k("intimidade", "intenso", "frase", "O que me deixa sem graça (do jeito bom) é…");
  k("intimidade", "intenso", "acao", "Fiquem frente a frente e diga exatamente o que mais deseja viver com {outro}.");
  k("intimidade", "intenso", "acao", "Abraçados, cada um revela o seu maior desejo para esta noite.", { who: "ambos" });
  k("intimidade", "intenso", "acao", "Olhe nos olhos de {outro} e diga o que mais te encanta nos momentos a sós.");
  k("intimidade", "intenso", "acao", "Descreva com detalhes o seu encontro ideal com {outro}.");
  k("intimidade", "intenso", "acao", "Cada um conta um desejo que gostaria de realizar com o outro. Quem escuta diz se também tem vontade, sem pressão.", { who: "ambos" });
  k("intimidade", "intenso", "escolha", "Escolha um:", { options: ["Um beijo longo e lento", "Carinhos devagar por 2 minutos, sem beijar"] });
  k("intimidade", "intenso", "juntos", "No 3, digam juntos o que cada um mais deseja agora.");

  /* ===================== POSIÇÕES (cartas de conversa) ===================== */
  k("posicoes", "leve", "escolha", "Qual abraço vocês escolhem agora?", { options: ["Conchinha", "De frente, bem apertado"] });
  k("posicoes", "leve", "pergunta", "Em qual posição você mais gosta de dormir abraçado(a) comigo?");
  k("posicoes", "picante", "pergunta", "Qual posição de carinho você mais gosta, e por quê?");
  k("posicoes", "picante", "frase", "Eu me sinto mais confortável quando estamos…");
  k("posicoes", "intenso", "pergunta", "Qual posição você gostaria de experimentar mais vezes? Conversem sobre conforto e ritmo.", { who: "ambos" });
  k("posicoes", "intenso", "frase", "Para eu me sentir à vontade, é importante que…");

  /* ---------- Posições (cartas ilustradas) ----------
     Imagens: hospede as suas em uma pasta pública e preencha a
     URL base abaixo. Em cada posição, informe só o nome do arquivo:
       positionImageBase = "https://seusite.com/posicoes/";
       image: "conchinha.png"
     Dica: a carta usa mix-blend-mode: screen, então imagens com
     fundo preto ou transparente ficam melhores (o preto some).
     Sem imagem (ou se o link falhar), a carta mostra o nome. */
  const positionImageBase = "";

  const positions = [
    { name: "Conchinha",           int: "leve",    image: "", desc: "Deitados de lado, um encaixado no outro. Aconchego, carinho e respiração no mesmo ritmo." },
    { name: "Olhos nos Olhos",     int: "leve",    image: "", desc: "Frente a frente, deitados de lado. Beijos, carícias e contato visual sem pressa." },
    { name: "Missão Serena",       int: "picante", image: "", desc: "Um por cima do outro, frente a frente. Corpos próximos, beijos demorados e conexão total." },
    { name: "Cavaleira",           int: "picante", image: "", desc: "Um sentado, o outro no colo, de frente. Quem está por cima conduz o ritmo do momento." },
    { name: "Encontro Sentado",    int: "picante", image: "", desc: "Sentados frente a frente, pernas entrelaçadas. Ritmo lento, abraço apertado e muito olhar." },
    { name: "Costas com Carinho",  int: "intenso", image: "", desc: "Um de costas para o outro, com abraço e beijos no pescoço. Quem conduz escolhe o ritmo." },
    { name: "Equilíbrio Profundo", int: "intenso", image: "", desc: "Um na beirada da cama, o outro em pé à frente. Pede apoio, confiança e sintonia." },
    { name: "Abraço em Pé",        int: "intenso", image: "", desc: "Em pé, encostados na parede, num abraço firme. Paixão e espontaneidade, com cuidado." },
    { name: "Sessenta e Nove",     int: "intenso", image: "", desc: "Deitados lado a lado, em sentidos opostos. Pede entrega e sintonia entre os dois." },
    { name: "Cavalgada Reversa",   int: "intenso", image: "", desc: "Um deitado, o outro por cima, de costas. Uma visão diferente, com o ritmo nas mãos de quem está por cima." },
  ];

  window.EntreNosData = {
    categories, intensities, intLabels, formats, stages,
    cards, positions, positionImageBase,
  };
})();

// Categorias e subcategorias (SPEC §4). Dados editáveis; não são um enum no código.

type Sub = { slug: string; namePt: string; nameEn: string };
type Cat = { slug: string; namePt: string; nameEn: string; allowPhotos?: boolean; subs: Sub[] };

export const categories: Cat[] = [
  { slug: "eletronica", namePt: "Eletrónica", nameEn: "Electronics", subs: [
    { slug: "telemovel", namePt: "Telemóvel", nameEn: "Phone" },
    { slug: "portatil", namePt: "Portátil", nameEn: "Laptop" },
    { slug: "auriculares", namePt: "Auriculares", nameEn: "Earphones" },
    { slug: "carregador", namePt: "Carregador/Cabo", nameEn: "Charger/Cable" },
    { slug: "calculadora", namePt: "Calculadora", nameEn: "Calculator" },
    { slug: "outro", namePt: "Outro", nameEn: "Other" },
  ] },
  { slug: "chaves", namePt: "Chaves", nameEn: "Keys", subs: [
    { slug: "chaves", namePt: "Chaves", nameEn: "Keys" },
    { slug: "comando", namePt: "Comando/Cartão de acesso", nameEn: "Remote/Access card" },
  ] },
  { slug: "carteiras", namePt: "Carteiras e cartões", nameEn: "Wallets and cards", subs: [
    { slug: "carteira", namePt: "Carteira", nameEn: "Wallet" },
    { slug: "cartao-bancario", namePt: "Cartão bancário", nameEn: "Bank card" },
    { slug: "porta-cartoes", namePt: "Porta-cartões", nameEn: "Card holder" },
  ] },
  { slug: "documentos", namePt: "Documentos de identificação", nameEn: "ID documents", allowPhotos: false, subs: [
    { slug: "cartao-cidadao", namePt: "Cartão de cidadão", nameEn: "Citizen card" },
    { slug: "cartao-estudante", namePt: "Cartão de estudante", nameEn: "Student card" },
    { slug: "passaporte", namePt: "Passaporte", nameEn: "Passport" },
    { slug: "carta-conducao", namePt: "Carta de condução", nameEn: "Driving licence" },
  ] },
  { slug: "malas", namePt: "Malas e mochilas", nameEn: "Bags and backpacks", subs: [
    { slug: "mochila", namePt: "Mochila", nameEn: "Backpack" },
    { slug: "mala", namePt: "Mala", nameEn: "Handbag" },
    { slug: "saco", namePt: "Saco", nameEn: "Bag" },
    { slug: "estojo", namePt: "Estojo", nameEn: "Pencil case" },
  ] },
  { slug: "roupa", namePt: "Roupa", nameEn: "Clothing", subs: [
    { slug: "casaco", namePt: "Casaco", nameEn: "Jacket" },
    { slug: "camisola", namePt: "Camisola", nameEn: "Sweater" },
    { slug: "cachecol-gorro", namePt: "Cachecol/Gorro", nameEn: "Scarf/Hat" },
    { slug: "outro", namePt: "Outro", nameEn: "Other" },
  ] },
  { slug: "oculos", namePt: "Óculos", nameEn: "Glasses", subs: [
    { slug: "graduados", namePt: "Graduados", nameEn: "Prescription" },
    { slug: "de-sol", namePt: "De sol", nameEn: "Sunglasses" },
    { slug: "estojo", namePt: "Estojo", nameEn: "Case" },
  ] },
  { slug: "garrafas", namePt: "Garrafas e lancheiras", nameEn: "Bottles and lunch boxes", subs: [
    { slug: "garrafa", namePt: "Garrafa", nameEn: "Bottle" },
    { slug: "termo", namePt: "Termo", nameEn: "Thermos" },
    { slug: "lancheira", namePt: "Lancheira", nameEn: "Lunch box" },
  ] },
  { slug: "livros", namePt: "Livros e apontamentos", nameEn: "Books and notes", subs: [
    { slug: "livro", namePt: "Livro", nameEn: "Book" },
    { slug: "caderno", namePt: "Caderno", nameEn: "Notebook" },
    { slug: "dossier", namePt: "Dossier", nameEn: "Folder" },
  ] },
  { slug: "acessorios", namePt: "Joias e acessórios", nameEn: "Jewellery and accessories", subs: [
    { slug: "anel", namePt: "Anel", nameEn: "Ring" },
    { slug: "fio", namePt: "Fio", nameEn: "Necklace" },
    { slug: "pulseira", namePt: "Pulseira", nameEn: "Bracelet" },
    { slug: "relogio", namePt: "Relógio", nameEn: "Watch" },
    { slug: "guarda-chuva", namePt: "Guarda-chuva", nameEn: "Umbrella" },
  ] },
  { slug: "desporto", namePt: "Material desportivo", nameEn: "Sports equipment", subs: [
    { slug: "equipamento", namePt: "Equipamento", nameEn: "Kit" },
    { slug: "bola", namePt: "Bola", nameEn: "Ball" },
    { slug: "raquete", namePt: "Raquete", nameEn: "Racket" },
    { slug: "outro", namePt: "Outro", nameEn: "Other" },
  ] },
  { slug: "outros", namePt: "Outros", nameEn: "Other", subs: [] },
];

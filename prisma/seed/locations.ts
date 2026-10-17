/**
 * UMinho Perdidos & Achados — seed de localizações
 *
 * Fonte principal: mapa oficial dos campi, https://campi.uminho.pt (consultado a 16/10/2026)
 *   - Gualtar:            https://campi.uminho.pt/CG.html
 *   - Azurém:             https://campi.uminho.pt/CA.html
 *   - Guimarães Centro:   https://campi.uminho.pt/CC.html  (inclui o Campus de Couros)
 *   - Braga Centro:       https://campi.uminho.pt/BC.html
 *   - Avepark (Taipas):   https://campi.uminho.pt/GA.html
 * Fontes secundárias: SDUM (bibliotecas), páginas das escolas (EAAD, ELACH, ICS), acolhimento ECUM.
 *
 * status:
 *   "confirmado" -> consta do mapa oficial ou de página oficial da UMinho
 *   "provisorio" -> existe segundo fontes oficiais, mas o local exato ou o nome não está confirmado
 *
 * Convenção de salas da UMinho: "edifício - piso.sala" (ex.: "2 - 0.20" = Edifício 2, piso 0, sala 20).
 * A app pode aceitar este formato na nota de localização.
 */

export type Status = "confirmado" | "provisorio";

export interface Campus {
  slug: string;
  namePt: string;
  nameEn: string;
  city: "Braga" | "Guimarães";
  /** false = agrupamento de edifícios fora dos campi principais */
  isMainCampus: boolean;
}

export interface Place {
  campus: string;          // slug do campus
  code: string;            // identificador estável (ex.: "G-02")
  number?: number;         // número oficial do edifício, quando existe
  namePt: string;
  nameEn: string;
  occupants?: string[];    // escolas e serviços, como aparecem no mapa oficial
  aliases?: string[];      // termos usados na pesquisa e no matching (apenas os vistos em fontes oficiais)
  parent?: string;         // código do local-pai, para subzonas
  status: Status;
  source: string;
}

// ---------------------------------------------------------------------------
// Campi e agrupamentos
// ---------------------------------------------------------------------------
export const campi: Campus[] = [
  { slug: "gualtar",          namePt: "Campus de Gualtar",            nameEn: "Gualtar Campus",            city: "Braga",     isMainCampus: true },
  { slug: "azurem",           namePt: "Campus de Azurém",             nameEn: "Azurém Campus",             city: "Guimarães", isMainCampus: true },
  { slug: "couros",           namePt: "Campus de Couros",             nameEn: "Couros Campus",             city: "Guimarães", isMainCampus: true },
  { slug: "braga-outros",     namePt: "Outros edifícios — Braga",     nameEn: "Other buildings — Braga",   city: "Braga",     isMainCampus: false },
  { slug: "guimaraes-outros", namePt: "Outros edifícios — Guimarães", nameEn: "Other buildings — Guimarães", city: "Guimarães", isMainCampus: false },
];

const MAP_CG = "https://campi.uminho.pt/CG.html";
const MAP_CA = "https://campi.uminho.pt/CA.html";
const MAP_CC = "https://campi.uminho.pt/CC.html";
const MAP_BC = "https://campi.uminho.pt/BC.html";
const MAP_GA = "https://campi.uminho.pt/GA.html";
const SDUM = "https://alunos.uminho.pt/PT/ProgramaOrientacao%20Documentos/ServicosDocumentacao.pdf";

// ---------------------------------------------------------------------------
// Campus de Gualtar (Braga) — 19 edifícios
// ---------------------------------------------------------------------------
const gualtar: Place[] = [
  { campus: "gualtar", code: "G-01", number: 1,  namePt: "Edifício 1 — Complexo Pedagógico I", nameEn: "Building 1 — Teaching Complex I",
    occupants: ["Complexo Pedagógico I", "USAAE"], aliases: ["CP1", "CPI", "Complexo Pedagógico 1"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-02", number: 2,  namePt: "Edifício 2 — Complexo Pedagógico II", nameEn: "Building 2 — Teaching Complex II",
    occupants: ["Complexo Pedagógico II", "Reitoria", "AAUM", "USAAE", "USGAQ", "GPA", "Provedor do Estudante", "Provedor Institucional", "UMinho Hub"],
    aliases: ["CP2", "CPII", "Complexo Pedagógico 2", "AAUM"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-03", number: 3,  namePt: "Edifício 3 — Complexo Pedagógico III", nameEn: "Building 3 — Teaching Complex III",
    occupants: ["Complexo Pedagógico III"], aliases: ["CP3", "CPIII", "Complexo Pedagógico 3"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-04", number: 4,  namePt: "Edifício 4 — Biblioteca Geral", nameEn: "Building 4 — General Library",
    occupants: ["Biblioteca Geral", "Escola Superior de Enfermagem", "USDB", "USSIC"], aliases: ["BGUM", "Biblioteca Geral", "biblioteca", "library", "Enfermagem"],
    status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-05", number: 5,  namePt: "Edifício 5 — Escola de Letras, Artes e Ciências Humanas", nameEn: "Building 5 — School of Arts and Humanities",
    occupants: ["ELACH", "USGA"], aliases: ["ELACH", "Letras"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-06", number: 6,  namePt: "Edifício 6 — Escola de Ciências", nameEn: "Building 6 — School of Sciences",
    occupants: ["Escola de Ciências", "USSIC", "USAPI", "USAI"], aliases: ["ECUM", "Ciências"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-07", number: 7,  namePt: "Edifício 7 — Escola de Engenharia", nameEn: "Building 7 — School of Engineering",
    occupants: ["Escola de Engenharia"], aliases: ["EEUM", "Engenharia"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-08", number: 8,  namePt: "Edifício 8 — Escola de Economia, Gestão e Ciência Política", nameEn: "Building 8 — School of Economics, Management and Political Science",
    occupants: ["EEG"], aliases: ["EEG", "Economia", "Gestão"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-09", number: 9,  namePt: "Edifício 9 — Complexo Desportivo", nameEn: "Building 9 — Sports Complex",
    aliases: ["pavilhão", "ginásio", "desporto", "gym", "sports"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-10", number: 10, namePt: "Edifício 10 — Unidades de Serviços", nameEn: "Building 10 — Service Units",
    occupants: ["USRH", "USFP", "USCP", "USGCI"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-11", number: 11, namePt: "Edifício 11 — Restaurante, Cantina e Grill", nameEn: "Building 11 — Restaurant, Canteen and Grill",
    aliases: ["cantina", "canteen", "grill", "restaurante", "refeitório"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-12", number: 12, namePt: "Edifício 12 — Serviços de Ação Social", nameEn: "Building 12 — Social Services",
    aliases: ["SAS", "SASUM", "Ação Social"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-13", number: 13, namePt: "Edifício 13 — Instituto de Educação", nameEn: "Building 13 — Institute of Education",
    occupants: ["Instituto de Educação"], aliases: ["IE"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-14", number: 14, namePt: "Edifício 14 — Escola de Psicologia", nameEn: "Building 14 — School of Psychology",
    occupants: ["Escola de Psicologia"], aliases: ["Psicologia"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-15", number: 15, namePt: "Edifício 15 — Instituto de Ciências Sociais", nameEn: "Building 15 — Institute of Social Sciences",
    occupants: ["Instituto de Ciências Sociais"], aliases: ["ICS"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-16", number: 16, namePt: "Edifício 16 — Escola de Engenharia", nameEn: "Building 16 — School of Engineering",
    occupants: ["Escola de Engenharia"], aliases: ["EEUM", "Engenharia"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-17", number: 17, namePt: "Edifício 17 — Escola de Direito", nameEn: "Building 17 — School of Law",
    occupants: ["Escola de Direito"], aliases: ["Direito", "Law"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-18", number: 18, namePt: "Edifício 18 — Instituto para a Bio-Sustentabilidade", nameEn: "Building 18 — Institute for Bio-Sustainability",
    aliases: ["IB-S"], status: "confirmado", source: MAP_CG },
  { campus: "gualtar", code: "G-19", number: 19, namePt: "Edifício 19 — Escola de Medicina", nameEn: "Building 19 — School of Medicine",
    occupants: ["Escola de Medicina"], aliases: ["Medicina"], status: "confirmado", source: MAP_CG },

  // Subzonas conhecidas
  { campus: "gualtar", code: "G-05-BIB", parent: "G-05", namePt: "Biblioteca Vítor Aguiar e Silva", nameEn: "Vítor Aguiar e Silva Library",
    status: "confirmado", source: "https://www.elach.uminho.pt/en/ELACH/Pages/Campi.aspx" },
  { campus: "gualtar", code: "G-08-ANF", parent: "G-08", namePt: "Anfiteatro natural", nameEn: "Open-air amphitheatre",
    status: "confirmado", source: "https://sou.uminho.pt/pt/Sou-Embaixador/Embaixadores5/Acolhimento/Documents/PA-EC-G.pdf" },
  { campus: "gualtar", code: "G-13-BIB", parent: "G-13", namePt: "Biblioteca do Instituto de Educação", nameEn: "Institute of Education Library",
    status: "confirmado", source: SDUM },
  { campus: "gualtar", code: "G-17-BIB", parent: "G-17", namePt: "Biblioteca da Escola de Direito", nameEn: "School of Law Library",
    status: "confirmado", source: SDUM },
  { campus: "gualtar", code: "G-19-BIB", parent: "G-19", namePt: "Biblioteca da Escola de Medicina", nameEn: "School of Medicine Library",
    status: "confirmado", source: SDUM },

  // Espaços exteriores (existem, mas os nomes e limites exatos estão por confirmar)
  { campus: "gualtar", code: "G-EXT-ENT", namePt: "Entrada principal / portaria", nameEn: "Main gate / gatehouse",
    aliases: ["portaria", "entrada", "gate"], status: "provisorio", source: "https://w3.math.uminho.pt/conferences/cnasc/information" },
  { campus: "gualtar", code: "G-EXT-BUS", namePt: "Paragem de autocarro (entrada do campus)", nameEn: "Bus stop (campus entrance)",
    aliases: ["autocarro", "bus", "paragem"], status: "provisorio", source: "https://w3.math.uminho.pt/conferences/cnasc/information" },
  { campus: "gualtar", code: "G-EXT-PARK", namePt: "Parques de estacionamento", nameEn: "Car parks",
    aliases: ["parque", "estacionamento", "parking"], status: "provisorio", source: "—" },
  { campus: "gualtar", code: "G-EXT-VERDE", namePt: "Espaços verdes / exterior", nameEn: "Green areas / outdoors",
    aliases: ["relva", "jardim", "exterior", "outside"], status: "provisorio", source: "—" },
];

// ---------------------------------------------------------------------------
// Campus de Azurém (Guimarães) — 18 edifícios
// ---------------------------------------------------------------------------
const azurem: Place[] = [
  { campus: "azurem", code: "A-01", number: 1,  namePt: "Edifício 1 — Bloco A", nameEn: "Building 1 — Block A",
    occupants: ["Escola de Engenharia", "Instituto de Ciências Sociais", "UMinho Hub", "USSIC", "USAAE", "USAPI", "USGA"],
    aliases: ["Bloco A", "ICS", "Geografia"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-02", number: 2,  namePt: "Edifício 2 — Bloco B (Complexo Pedagógico)", nameEn: "Building 2 — Block B (Teaching Complex)",
    occupants: ["Complexo Pedagógico", "Reitoria", "Escola de Engenharia"], aliases: ["Bloco B", "CP"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-03", number: 3,  namePt: "Edifício 3 — Bloco C (Complexo Pedagógico)", nameEn: "Building 3 — Block C (Teaching Complex)",
    occupants: ["Complexo Pedagógico", "Escola de Engenharia"], aliases: ["Bloco C", "CP"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-04", number: 4,  namePt: "Edifício 4 — Cantina e Grill", nameEn: "Building 4 — Canteen and Grill",
    aliases: ["cantina", "canteen", "grill", "refeitório"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-05", number: 5,  namePt: "Edifício 5 — Escola de Engenharia", nameEn: "Building 5 — School of Engineering",
    aliases: ["EEUM", "Engenharia"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-06", number: 6,  namePt: "Edifício 6 — Escola de Engenharia", nameEn: "Building 6 — School of Engineering",
    aliases: ["EEUM", "Engenharia"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-07", number: 7,  namePt: "Edifício 7 — Instituto para a Bio-Sustentabilidade", nameEn: "Building 7 — Institute for Bio-Sustainability",
    aliases: ["IB-S"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-08", number: 8,  namePt: "Edifício 8 — Escola de Engenharia", nameEn: "Building 8 — School of Engineering",
    aliases: ["EEUM", "Engenharia"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-09", number: 9,  namePt: "Edifício 9 — Escola de Arquitetura, Arte e Design", nameEn: "Building 9 — School of Architecture, Art and Design",
    aliases: ["EAAD", "Arquitetura"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-10", number: 10, namePt: "Edifício 10 — CVR Centro para a Valorização de Resíduos", nameEn: "Building 10 — CVR Waste Valorisation Centre",
    aliases: ["CVR"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-11", number: 11, namePt: "Edifício 11 — Escola de Engenharia / TecMinho", nameEn: "Building 11 — School of Engineering / TecMinho",
    aliases: ["EEUM", "TecMinho"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-12", number: 12, namePt: "Edifício 12 — Escola de Ciências", nameEn: "Building 12 — School of Sciences",
    aliases: ["ECUM", "Ciências"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-13", number: 13, namePt: "Edifício 13 — Biblioteca Geral", nameEn: "Building 13 — General Library",
    occupants: ["Biblioteca Geral", "USDB"], aliases: ["biblioteca", "library"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-14", number: 14, namePt: "Edifício 14 — Centro de Computação Gráfica", nameEn: "Building 14 — Computer Graphics Centre",
    aliases: ["CCG"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-15", number: 15, namePt: "Edifício 15 — PIEP Pólo de Inovação em Engenharia de Polímeros", nameEn: "Building 15 — PIEP Polymer Engineering Innovation Hub",
    aliases: ["PIEP"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-16", number: 16, namePt: "Edifício 16 — Residências Universitárias / Serviços de Ação Social", nameEn: "Building 16 — Student Residences / Social Services",
    aliases: ["residência", "residence", "SAS", "SASUM"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-17", number: 17, namePt: "Edifício 17 — Complexo Desportivo", nameEn: "Building 17 — Sports Complex",
    aliases: ["pavilhão", "ginásio", "desporto", "gym", "sports"], status: "confirmado", source: MAP_CA },
  { campus: "azurem", code: "A-18", number: 18, namePt: "Edifício 18 — Associação Académica", nameEn: "Building 18 — Students' Union",
    aliases: ["AAUM", "associação académica"], status: "confirmado", source: MAP_CA },

  // Subzonas conhecidas
  { campus: "azurem", code: "A-09-BIB", parent: "A-09", namePt: "Biblioteca da Escola de Arquitetura, Arte e Design", nameEn: "School of Architecture, Art and Design Library",
    status: "confirmado", source: SDUM },

  // Espaços exteriores
  { campus: "azurem", code: "A-EXT-ENT", namePt: "Entrada principal / portaria", nameEn: "Main gate / gatehouse",
    aliases: ["portaria", "entrada", "gate"], status: "provisorio", source: "—" },
  { campus: "azurem", code: "A-EXT-P03", namePt: "Parque de estacionamento P03", nameEn: "Car park P03",
    aliases: ["P03", "parque", "estacionamento"], status: "confirmado",
    source: "https://www.eng.uminho.pt/pt/divulgacaoinstitucional/orgaosdaescola/Documents/conselhodeescola/qualidade_vida_campi.pdf" },
  { campus: "azurem", code: "A-EXT-PARK", namePt: "Outros parques de estacionamento", nameEn: "Other car parks",
    aliases: ["parque", "estacionamento", "parking"], status: "provisorio", source: "—" },
  { campus: "azurem", code: "A-EXT-VERDE", namePt: "Espaços verdes / exterior", nameEn: "Green areas / outdoors",
    aliases: ["relva", "jardim", "exterior", "ribeiro", "outside"], status: "provisorio", source: "—" },
];

// ---------------------------------------------------------------------------
// Campus de Couros (Guimarães)
// ---------------------------------------------------------------------------
const couros: Place[] = [
  { campus: "couros", code: "C-01", namePt: "Centro Avançado de Formação Pós-Graduada", nameEn: "Advanced Postgraduate Training Centre",
    aliases: ["CAFPG"], status: "confirmado", source: MAP_CC },
  { campus: "couros", code: "C-02", namePt: "Instituto de Design", nameEn: "Design Institute",
    aliases: ["Design", "Design de Produto", "fábrica Ramada"], status: "confirmado", source: MAP_CC },
  { campus: "couros", code: "C-BIB", namePt: "Biblioteca especializada", nameEn: "Specialised library",
    status: "provisorio", source: "https://www.eaad.uminho.pt/en/school/facilities" },  // existe, mas o edifício não está confirmado
  { campus: "couros", code: "C-BAR", namePt: "Bar", nameEn: "Bar",
    status: "provisorio", source: "https://www.eaad.uminho.pt/en/school/facilities" },  // existe, mas o edifício não está confirmado
  { campus: "couros", code: "C-EXT", namePt: "Espaços exteriores", nameEn: "Outdoor areas",
    status: "provisorio", source: "—" },
];

// ---------------------------------------------------------------------------
// Outros edifícios — Braga
// ---------------------------------------------------------------------------
const bragaOutros: Place[] = [
  { campus: "braga-outros", code: "B-01", namePt: "Largo do Paço — Reitoria", nameEn: "Largo do Paço — Rectorate",
    occupants: ["Reitoria", "SAR", "GCI", "GPE", "BPB"], aliases: ["Reitoria", "Largo do Paço"], status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-02", namePt: "Edifício dos Congregados", nameEn: "Congregados Building",
    occupants: ["ELACH", "UAUM", "TecMinho"], aliases: ["Congregados", "Música"], status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-03", namePt: "Arquivo Distrital de Braga", nameEn: "Braga District Archive", status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-04", namePt: "Museu Nogueira da Silva", nameEn: "Nogueira da Silva Museum", status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-05", namePt: "Edifício da Rua do Castelo", nameEn: "Rua do Castelo Building", status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-06", namePt: "Edifício da Avenida Central, n.º 39-45", nameEn: "Avenida Central 39-45 Building", status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-07", namePt: "Edifício do Pacinho", nameEn: "Pacinho Building",
    occupants: ["Reitoria", "Administração", "GAAI", "GAJ", "Conselho Cultural"], status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-08", namePt: "Edifício da Rua D. Afonso Henriques", nameEn: "Rua D. Afonso Henriques Building", status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-09", namePt: "Biblioteca Lúcio Craveiro da Silva", nameEn: "Lúcio Craveiro da Silva Library", status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-10", namePt: "Associação Académica (Braga)", nameEn: "Students' Union (Braga)",
    aliases: ["AAUM", "associação académica"], status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-11", namePt: "Residência de Santa Tecla", nameEn: "Santa Tecla Residence",
    aliases: ["Santa Tecla", "residência", "residence"], status: "confirmado", source: MAP_BC },
  { campus: "braga-outros", code: "B-12", namePt: "Residência Prof. Lloyd Braga", nameEn: "Prof. Lloyd Braga Residence",
    aliases: ["Lloyd Braga", "residência", "residence"], status: "confirmado", source: MAP_BC },
];

// ---------------------------------------------------------------------------
// Outros edifícios — Guimarães
// ---------------------------------------------------------------------------
const guimaraesOutros: Place[] = [
  { campus: "guimaraes-outros", code: "GM-01", namePt: "Residência Universitária dos Combatentes", nameEn: "Combatentes Student Residence",
    aliases: ["Combatentes", "residência", "residence"], status: "confirmado", source: MAP_CC },
  { campus: "guimaraes-outros", code: "GM-02", namePt: "Garagem Avenida (Artes Visuais)", nameEn: "Garagem Avenida (Visual Arts)",
    aliases: ["Garagem Avenida", "Artes Visuais"], status: "confirmado", source: "https://www.eaad.uminho.pt/en/school/facilities" },
  { campus: "guimaraes-outros", code: "GM-03", namePt: "Avepark (Taipas) — I3Bs", nameEn: "Avepark (Taipas) — I3Bs",
    aliases: ["Avepark", "I3Bs", "3B's", "Taipas"], status: "confirmado", source: MAP_GA },
  { campus: "guimaraes-outros", code: "GM-04", namePt: "Avepark (Taipas) — ThermHub", nameEn: "Avepark (Taipas) — ThermHub",
    aliases: ["Avepark", "ThermHub", "Taipas"], status: "confirmado", source: MAP_GA },
];

// ---------------------------------------------------------------------------
// Entre campi
// ---------------------------------------------------------------------------
// Fonte não oficial (página de estudantes) refere um transporte da AAUMinho entre Gualtar e Azurém.
// Confirmar antes de ativar.
export const inTransit: Place = {
  campus: "", code: "TRANSITO", namePt: "Transporte entre campi", nameEn: "Inter-campus transport",
  aliases: ["autocarro", "bus", "shuttle", "transporte"], status: "provisorio", source: "https://hackmd.io/@Mackgamer/aaummoreinfo",
};

export const places: Place[] = [...gualtar, ...azurem, ...couros, ...bragaOutros, ...guimaraesOutros];

// ---------------------------------------------------------------------------
// Zonas genéricas dentro de qualquer edifício (segundo nível opcional)
// ---------------------------------------------------------------------------
export const zoneTypes = [
  { slug: "entrada",     namePt: "Entrada / átrio",               nameEn: "Entrance / lobby" },
  { slug: "sala",        namePt: "Sala de aula",                  nameEn: "Classroom" },
  { slug: "anfiteatro",  namePt: "Anfiteatro / auditório",        nameEn: "Lecture hall / auditorium" },
  { slug: "laboratorio", namePt: "Laboratório",                   nameEn: "Lab" },
  { slug: "estudo",      namePt: "Sala / zona de estudo",         nameEn: "Study room / area" },
  { slug: "bar",         namePt: "Bar",                           nameEn: "Café / bar" },
  { slug: "wc",          namePt: "Casa de banho",                 nameEn: "Restroom" },
  { slug: "corredor",    namePt: "Corredor / escadas / elevador", nameEn: "Corridor / stairs / lift" },
  { slug: "secretaria",  namePt: "Secretaria / serviços",         nameEn: "Office / services desk" },
  { slug: "balneario",   namePt: "Balneário",                     nameEn: "Changing room" },
  { slug: "exterior",    namePt: "Exterior do edifício",          nameEn: "Outside the building" },
  { slug: "outro",       namePt: "Outro",                         nameEn: "Other" },
];

// ---------------------------------------------------------------------------
// Onde quem encontrou entregou o objeto (preenchido por quem encontra)
// Combina-se com um Place + zona opcional + nota livre.
// ---------------------------------------------------------------------------
export const dropOffTypes = [
  { slug: "portaria",   namePt: "Portaria / receção / segurança", nameEn: "Gatehouse / reception / security" },
  { slug: "biblioteca", namePt: "Balcão da biblioteca",           nameEn: "Library desk" },
  { slug: "secretaria", namePt: "Secretaria / serviços",          nameEn: "Office / services desk" },
  { slug: "bar",        namePt: "Bar / cantina",                  nameEn: "Café / canteen" },
  { slug: "desporto",   namePt: "Receção do complexo desportivo", nameEn: "Sports complex reception" },
  { slug: "residencia", namePt: "Receção da residência",          nameEn: "Residence reception" },
  { slug: "outro",      namePt: "Outro (descrever)",              nameEn: "Other (describe)" },
];

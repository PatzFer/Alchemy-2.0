import {
  Recipe,
  RecipeIngredient,
  PriveWeeklyMenuPlan as WeeklyMenuPlan,
  PlannedMealDay,
  DiningParticipantChoice,
  KitchenInventoryItem,
  ShoppingListItem,
  MealFeedbackEntry,
  CalendarEvent,
  CuisineType,
  FoundationFoodProfile,
} from '../types';

// ============================================================
// DEFAULT PANTRY STAPLES (Optional quick-start for Patricia)
// ============================================================
export const DEFAULT_PANTRY_STAPLES: Omit<KitchenInventoryItem, 'id' | 'addedDate'>[] = [
  { name: 'Olijfolie extra vierge', quantity: '1 fles', location: 'pantry', category: 'pantry' },
  { name: 'Witte basmati rijst', quantity: '1 kg', location: 'pantry', category: 'pantry' },
  { name: 'Pasta (Penne / Tagliatelle)', quantity: '500 g', location: 'pantry', category: 'pantry' },
  { name: 'Passata di pomodoro (gezeefde tomaten)', quantity: '3 flesjes', location: 'pantry', category: 'pantry' },
  { name: 'Gele uien', quantity: '1 netje', location: 'pantry', category: 'vegetables' },
  { name: 'Verse knoflook', quantity: '3 bollen', location: 'pantry', category: 'vegetables' },
  { name: 'Aardappelen (vastkokend)', quantity: '2 kg', location: 'pantry', category: 'vegetables' },
  { name: 'Gedroogde oregano & tijm', quantity: '1 potje', location: 'pantry', category: 'spices_other' },
  { name: 'Zoet paprikapoeder (Pimentão doce)', quantity: '1 blikje', location: 'pantry', category: 'spices_other' },
  { name: 'Laurierblaadjes', quantity: '1 zakje', location: 'pantry', category: 'spices_other' },
  { name: 'Boter (bakken & braden)', quantity: '250 g', location: 'refrigerator', category: 'dairy_chilled' },
  { name: 'Parmezaanse kaas (blok)', quantity: '150 g', location: 'refrigerator', category: 'dairy_chilled' },
  { name: 'Kipfilet / kippendijen', quantity: '400 g', location: 'freezer', category: 'meat_fish' },
  { name: 'Mager rundergehakt', quantity: '500 g', location: 'freezer', category: 'meat_fish' },
];

// ============================================================
// CURATED RECIPES DATABASE
// Strict adherence to Patz Profile:
// - 🇵🇹 Portuguese (Primary Core Identity), 🇧🇪 Belgian, 🇮🇹 Italian
// - ~30-42g protein per portion (supporting 80-100g/day target)
// - NO couscous, NO quinoa, NO fruit, NO raw veg, NO smoothies,
//   NO yoghurt, NO cucumber, NO cod, NO nuts in meals, NO lentils
// - Slowcooker meals when genuinely helpful
// ============================================================
export const CURATED_RECIPES: Recipe[] = [
  // ------------------------------------------------------------
  // 🇵🇹 PORTUGUESE (PRIMARY IDENTITY & EMOTIONAL CONNECTION)
  // ------------------------------------------------------------
  {
    id: 'pt-frango-forno',
    name: 'Frango no Forno à Portuguesa com Arroz e Cenoura Gegaarde',
    cuisine: 'portuguese',
    shortDescription:
      'Mals goudbruin gebraden kip uit de oven met knoflook, laurier, witte wijn en olijfolie, geserveerd met witte rijst en zacht gegaarde wortelen.',
    prepMinutes: 15,
    cookMinutes: 35,
    totalMinutes: 50,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-1', name: 'Kippendijen (zonder bot & vel)', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-2', name: 'Witte rijst', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-3', name: 'Wortelen (in schijfjes, gegaard)', amountPerPerson: 150, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-4', name: 'Knoflook', amountPerPerson: 2, unit: 'tenen', category: 'vegetables' },
      { id: 'i-5', name: 'Witte wijn (droog)', amountPerPerson: 50, unit: 'ml', category: 'pantry' },
      { id: 'i-6', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
      { id: 'i-7', name: 'Zoet paprikapoeder', amountPerPerson: 1, unit: 'tl', category: 'spices_other' },
      { id: 'i-8', name: 'Laurierblad', amountPerPerson: 1, unit: 'stuk', category: 'spices_other' },
    ],
    steps: [
      'Verwarm de oven voor op 190°C.',
      'Wrijf de kippendijen in met geperste knoflook, paprikapoeder, een scheutje olijfolie, zout en peper.',
      'Leg de kip in een ovenschaal samen met het laurierblad en de witte wijn.',
      'Schik de wortelschijfjes rondom de kip zodat ze meestoven in het aromatische kookvocht.',
      'Bak 35 minuten in de oven tot de kip goudbruin is en het kookvocht een heerlijke jus vormt.',
      'Kook ondertussen de witte rijst in gezouten water. Serveer de rijst met de malse kip, gegaarde wortelen en lepel de warme jus erover.',
    ],
    substitutions: ['Kalkoenfilet of magere varkensoester in plaats van kippendijen.'],
    storageNotes: 'Blijft 2 dagen uitstekend in een afgesloten bakje in de koelkast. Kip kan ook gemakkelijk worden ingevroren.',
    mealPrepNotes: 'De kip kan de avond van tevoren al gemarineerd worden in de ovenschaal.',
  },
  {
    id: 'pt-bifanas-molho',
    name: 'Bifanas no Prato com Batatas e Molho Caseiro de Alho',
    cuisine: 'portuguese',
    shortDescription:
      'Malse dunne varkensoesters gesmoord in een rijke Portugese saus van knoflook, pimentão, witte wijn en laurier, met gekookte goudgele aardappelen.',
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
    isSlowcooker: false,
    proteinGramsPerPerson: 37,
    ingredients: [
      { id: 'i-10', name: 'Mager varkensvlees (dun gesneden bifana)', amountPerPerson: 190, unit: 'g', category: 'meat_fish' },
      { id: 'i-11', name: 'Vastkokende aardappelen', amountPerPerson: 200, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-12', name: 'Knoflook (fijngesneden)', amountPerPerson: 2, unit: 'tenen', category: 'vegetables' },
      { id: 'i-13', name: 'Witte wijn', amountPerPerson: 60, unit: 'ml', category: 'pantry' },
      { id: 'i-14', name: 'Passata di pomodoro', amountPerPerson: 2, unit: 'el', category: 'pantry' },
      { id: 'i-15', name: 'Zoet paprikapoeder', amountPerPerson: 1, unit: 'tl', category: 'spices_other' },
      { id: 'i-16', name: 'Laurierblad', amountPerPerson: 1, unit: 'stuk', category: 'spices_other' },
      { id: 'i-17', name: 'Olijfolie & klontje boter', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Schil de aardappelen, snijd in gelijke stukken en kook in gezouten water in 18 minuten zacht en gaar.',
      'Kruid de bifanas met paprikapoeder, zout, peper en knoflook.',
      'Verhit olijfolie en boter in een ruime koekenpan en bak het vlees op hoog vuur 2 minuten per zijde goudbruin.',
      'Blus af met witte wijn, voeg de passata en het laurierblad toe en laat de saus op middelhoog vuur 8-10 minuten zachtjes indikken.',
      'Dien op met de gekookte aardappelen en overgiet rijkelijk met de warme aromatische saus.',
    ],
    substitutions: ['Kalfslapjes of kipfilet zijn een heerlijk alternatief.'],
    storageNotes: 'Vlees en saus blijven 3 dagen goed in de koelkast.',
    mealPrepNotes: 'Ideaal voor een drukke avond na een Mariluna werkdag: staat binnen 25 minuten op tafel.',
  },
  {
    id: 'pt-arroz-marisco',
    name: 'Arroz de Marisco com Gambas e Molho de Tomate Apurado',
    cuisine: 'portuguese',
    shortDescription:
      'Rijke, sappige Portugese rijstschotel met malse gamba’s, gestoofde ui, knoflook en zacht ingekookte tomatenbouillon.',
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    isSlowcooker: false,
    proteinGramsPerPerson: 34,
    ingredients: [
      { id: 'i-20', name: 'Gepelde grote gamba’s / reuzegarnalen', amountPerPerson: 180, unit: 'g', category: 'meat_fish' },
      { id: 'i-21', name: 'Witte rondkorrelige rijst (Carolino)', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-22', name: 'Ui (zeer fijngesneden)', amountPerPerson: 0.5, unit: 'stuk', category: 'vegetables' },
      { id: 'i-23', name: 'Knoflook', amountPerPerson: 2, unit: 'tenen', category: 'vegetables' },
      { id: 'i-24', name: 'Passata van rijpe tomaten', amountPerPerson: 100, unit: 'ml', category: 'pantry' },
      { id: 'i-25', name: 'Vis- of groentebouillon (warm)', amountPerPerson: 250, unit: 'ml', category: 'pantry' },
      { id: 'i-26', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
      { id: 'i-27', name: 'Witte wijn', amountPerPerson: 30, unit: 'ml', category: 'pantry' },
    ],
    steps: [
      'Fruit de fijngesneden ui en knoflook zachtjes in olijfolie in een ruime kookpan tot ze glazig zijn.',
      'Voeg de passata en witte wijn toe en laat 5 minuten rustig zacht pruttelen tot een aromatische basis.',
      'Voeg de rijst toe en roer een minuutje door tot alle korrels glanzen.',
      'Giet de warme bouillon erbij en laat de rijst circa 15 minuten zachtjes garen tot hij romig en licht vloeibaar ("malandrinho") is.',
      'Voeg in de laatste 4 minuten de gamba’s toe zodat ze precies gaar en botermals worden.',
      'Serveer warm in diepe borden met een scheutje verse olijfolie.',
    ],
    substitutions: ['Zalmfiletblokjes of doradefilet kunnen prima mee garen (geen kabeljauw).'],
    storageNotes: 'Direct vers eten is het lekkerst; rijst dikt in bij heropwarmen.',
    mealPrepNotes: 'De tomaten-uienbasis kan vooraf gemaakt worden.',
  },
  {
    id: 'pt-caldo-verde',
    name: 'Caldo Verde Tradicional com Chouriço & Aardappelpureebasis',
    cuisine: 'portuguese',
    shortDescription:
      'Zijdezachte soep op basis van fluweelzachte aardappelpuree met fijngesneden Portugese kool (couve galega) en plakjes gebakken chouriço.',
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    isSlowcooker: false,
    proteinGramsPerPerson: 30,
    ingredients: [
      { id: 'i-30', name: 'Aardappelen (voor fluweelzachte soep)', amountPerPerson: 250, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-31', name: 'Portugese chouriço (of magere gerookte worst)', amountPerPerson: 70, unit: 'g', category: 'meat_fish' },
      { id: 'i-32', name: 'Malse kipfiletreepjes (voor extra eiwit)', amountPerPerson: 100, unit: 'g', category: 'meat_fish' },
      { id: 'i-33', name: 'Couve galega / boerenkool (zeer fijn gesneden)', amountPerPerson: 80, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-34', name: 'Ui & knoflook', amountPerPerson: 1, unit: 'stuk', category: 'vegetables' },
      { id: 'i-35', name: 'Olijfolie extra vierge', amountPerPerson: 1.5, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Kook de aardappelen, ui en knoflook in water met een snufje zout gaar.',
      'Pureer de soepbasis met de staafmixer tot een zijdezachte, gladde en romige bouillon.',
      'Bak de plakjes chouriço en kipfiletreepjes zachtjes in een drupje olijfolie tot ze gaar zijn.',
      'Breng de gladde soep opnieuw aan de kook, voeg de zeer fijngesneden kool toe en laat 5 minuten zacht meekoken tot de kool boterzacht is.',
      'Verdeel over kommen, schep de gebakken chouriço en kip erbij en werk af met een royale lepel Portugese olijfolie.',
    ],
    substitutions: ['Kan ook volledig met kip en gerookt spek worden bereid.'],
    storageNotes: 'Soep kan 3 dagen in de koelkast bewaard worden of ingevroren.',
    mealPrepNotes: 'Ideale soep om in een dubbele portie te maken voor de volgende lunch of rustige avond.',
  },
  {
    id: 'pt-slow-frango-panela',
    name: 'Slowcooker Frango de Panela com Batatas e Cenouras',
    cuisine: 'portuguese',
    shortDescription:
      'Langzaam gegaarde Portugese kipstoofpot met aardappelblokjes, gegaarde wortelen, tomatenpassata, knoflook en witte wijn. Smelt op de tong.',
    prepMinutes: 15,
    cookMinutes: 240,
    totalMinutes: 255,
    isSlowcooker: true,
    proteinGramsPerPerson: 42,
    ingredients: [
      { id: 'i-40', name: 'Kippendijen (zonder bot)', amountPerPerson: 220, unit: 'g', category: 'meat_fish' },
      { id: 'i-41', name: 'Aardappelen (in grove blokjes)', amountPerPerson: 180, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-42', name: 'Wortelen (in schijven)', amountPerPerson: 120, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-43', name: 'Ui & knoflook (fijngesneden)', amountPerPerson: 1, unit: 'stuk', category: 'vegetables' },
      { id: 'i-44', name: 'Passata di pomodoro', amountPerPerson: 100, unit: 'ml', category: 'pantry' },
      { id: 'i-45', name: 'Witte wijn of kippenbouillon', amountPerPerson: 60, unit: 'ml', category: 'pantry' },
      { id: 'i-46', name: 'Paprikapoeder & laurier', amountPerPerson: 1, unit: 'tl', category: 'spices_other' },
      { id: 'i-47', name: 'Olijfolie', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Schik de gesneden aardappelen, wortelen, ui en knoflook op de bodem van de slowcooker.',
      'Kruid de kippendijen royaal met paprikapoeder, peper en zout en leg ze op de groenten.',
      'Meng de passata met witte wijn (of bouillon) en giet over de ingrediënten in de schaal.',
      'Zet de slowcooker op LOW voor 6 tot 7 uur (of HIGH voor 3,5 tot 4 uur).',
      'De kip en groenten zijn boterzacht en hebben alle rijke Portugese aroma’s opgenomen. Serveer direct warm.',
    ],
    substitutions: ['Kan ook in een gietijzeren stoofpan op het laagste vuur gedurende 75 minuten.'],
    storageNotes: 'Blijft 3 dagen perfect in de koelkast. Smaakt de volgende dag nog dieper.',
    mealPrepNotes: 'Zet de ingrediënten ‘s ochtends voor je Mariluna werkdag klaar in de slowcooker.',
  },
  {
    id: 'pt-sopa-legumes-frango',
    name: 'Sopa de Legumes Rica com Frango Desfiado',
    cuisine: 'portuguese',
    shortDescription:
      'Zijdezacht gepureerde groentesoep (courgette, wortel, aardappel) verrijkt met mals gepluisde kipfilet en warme olijfolie.',
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    isSlowcooker: false,
    proteinGramsPerPerson: 35,
    ingredients: [
      { id: 'i-50', name: 'Kipfilet', amountPerPerson: 170, unit: 'g', category: 'meat_fish' },
      { id: 'i-51', name: 'Courgette (geschild & in blokjes)', amountPerPerson: 150, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-52', name: 'Wortel (in blokjes)', amountPerPerson: 100, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-53', name: 'Aardappel (voor binding)', amountPerPerson: 120, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-54', name: 'Ui & knoflook', amountPerPerson: 1, unit: 'stuk', category: 'vegetables' },
      { id: 'i-55', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Breng water met een snuf zout aan de kook en pocheer de kipfilet in 12 minuten gaar. Haal eruit en pluis met twee vorken.',
      'Kook in dezelfde bouillon de courgette, wortel, aardappel, ui en knoflook in 15 minuten helemaal zacht.',
      'Pureer de groenten met de staafmixer tot een fluwelige, homogene crème zonder stukjes.',
      'Roer de gepluisde kip door de fluwelige soep zodat het geheel goed warm wordt.',
      'Dien op met een royale scheut Portugese olijfolie en versgemalen zwarte peper.',
    ],
    substitutions: ['Kalkoenborst of magere rundsreepjes.'],
    storageNotes: 'Uitstekend in te vriezen in porties.',
    mealPrepNotes: 'Perfecte lichte maar eiwitrijke avondmaaltijd voor een herstelavond.',
  },

  // ------------------------------------------------------------
  // 🇧🇪 BELGIAN (COMFORT CLASSICS & LOCAL TRADITION)
  // ------------------------------------------------------------
  {
    id: 'be-stoofvlees',
    name: 'Vlaams Stoofvlees met Gekookte Aardappelen',
    cuisine: 'belgian',
    shortDescription:
      'Klassiek Belgisch runderstoofvlees met donker bier, laurier, tijm en een boterham met mosterd die wegsmelt in de fluwelige ingekookte uiensaus.',
    prepMinutes: 20,
    cookMinutes: 150,
    totalMinutes: 170,
    isSlowcooker: true,
    proteinGramsPerPerson: 42,
    ingredients: [
      { id: 'i-60', name: 'Mager rundsstoofvlees (in gelijke blokken)', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-61', name: 'Gele uien (in halve ringen gesneden)', amountPerPerson: 1.5, unit: 'stuk', category: 'vegetables' },
      { id: 'i-62', name: 'Belgisch donker bier (bv. Sint-Bernardus of Leffe)', amountPerPerson: 150, unit: 'ml', category: 'pantry' },
      { id: 'i-63', name: 'Runderbouillon', amountPerPerson: 100, unit: 'ml', category: 'pantry' },
      { id: 'i-64', name: 'Boterham met echte mosterd', amountPerPerson: 0.5, unit: 'stuk', category: 'pantry' },
      { id: 'i-65', name: 'Vastkokende aardappelen', amountPerPerson: 200, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-66', name: 'Tijm & laurier', amountPerPerson: 1, unit: 'stuk', category: 'spices_other' },
      { id: 'i-67', name: 'Boter / braadvet', amountPerPerson: 1, unit: 'el', category: 'dairy_chilled' },
    ],
    steps: [
      'Kruid het vlees met peper en zout. Smelt boter in een stoofpan (of pan voor slowcooker) en schroei het vlees rondom bruin.',
      'Haal het vlees uit de pan en fruit de uien langzaam goudgeel in hetzelfde braadvet.',
      'Voeg het vlees weer toe, blus af met het donkere bier en de runderbouillon.',
      'Leg de laurier, tijm en de met mosterd besmeerde boterham bovenop (deze lost op en bindt de saus).',
      'Laat op zeer zacht vuur 2,5 uur sudderen (of 7 uur op LOW in de slowcooker) tot het vlees boterzacht uit elkaar valt.',
      'Kook de aardappelen in gezouten water en serveer met het rijke stoofvlees en de ingedikte saus.',
    ],
    substitutions: ['Kipstoofvlees met abdijbier voor een snellere variant.'],
    storageNotes: 'Stoofvlees is de tweede dag nóg lekkerder. Kan fantastisch worden ingevroren.',
    mealPrepNotes: 'Maak een dubbele portie; de helft invriezen bespaart later in de week kooktijd.',
  },
  {
    id: 'be-vol-au-vent',
    name: 'Vol-au-vent van Malse Kip met Zachte Aardappelpuree',
    cuisine: 'belgian',
    shortDescription:
      'Gepocheerde malse hoevekip en gestoofde champignons in een fluwelige veloutésaus met citroennoot, geserveerd met fluweelzachte aardappelpuree.',
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    isSlowcooker: false,
    proteinGramsPerPerson: 36,
    ingredients: [
      { id: 'i-70', name: 'Kipfilet of kippenboutvlees', amountPerPerson: 190, unit: 'g', category: 'meat_fish' },
      { id: 'i-71', name: 'Witte champignons (in kwartjes, gegaard)', amountPerPerson: 100, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-72', name: 'Kippenbouillon', amountPerPerson: 200, unit: 'ml', category: 'pantry' },
      { id: 'i-73', name: 'Roomboter & bloem (voor velouté)', amountPerPerson: 20, unit: 'g', category: 'dairy_chilled' },
      { id: 'i-74', name: 'Aardappelen (voor puree)', amountPerPerson: 200, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-75', name: 'Melk & nootmuskaat', amountPerPerson: 40, unit: 'ml', category: 'dairy_chilled' },
      { id: 'i-76', name: 'Sap van 1/4 citroen', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Pocheer de kip zachtjes in de kippenbouillon in 12 minuten gaar. Haal eruit en snijd in malse stukken.',
      'Stoof de champignons kort aan in een beetje boter met een paar druppels citroensap.',
      'Smelt de boter in een kookpot, voeg de bloem toe en laat even drogen (roux). Giet de gezeefde kippenbouillon er geleidelijk bij en klop tot een fluwelige saus.',
      'Voeg de kip en champignons toe aan de saus en breng op smaak met nootmuskaat, peper en zout.',
      'Kook ondertussen de aardappelen gaar en stamp ze met een scheutje melk, klontje boter en nootmuskaat tot een zachte puree.',
      'Serveer de warme vol-au-vent royaal over of naast de zachte puree.',
    ],
    substitutions: ['Kan worden verrijkt met kleine malse kalfsgehaktballetjes.'],
    storageNotes: 'Blijft 2 dagen goed in de koelkast.',
    mealPrepNotes: 'De kip en bouillon kunnen vooraf worden voorbereid.',
  },
  {
    id: 'be-witloof-oven',
    name: 'Gegratineerd Witloof met Ham en Kaassaus',
    cuisine: 'belgian',
    shortDescription:
      'Langzaam zacht gestoofd witloof, omwikkeld met ambachtelijke kookham en overgoten met een romige emmentaler-kaassaus, goudbruin gegratineerd.',
    prepMinutes: 15,
    cookMinutes: 30,
    totalMinutes: 45,
    isSlowcooker: false,
    proteinGramsPerPerson: 34,
    ingredients: [
      { id: 'i-80', name: 'Grondwitloof (zacht gestoofd)', amountPerPerson: 2, unit: 'struikjes', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-81', name: 'Magere gekookte ham van de slager', amountPerPerson: 2, unit: 'plakken', category: 'meat_fish' },
      { id: 'i-82', name: 'Geraspte emmentaler of gruyère', amountPerPerson: 40, unit: 'g', category: 'dairy_chilled' },
      { id: 'i-83', name: 'Halfvolle melk & boter (voor kaassaus)', amountPerPerson: 150, unit: 'ml', category: 'dairy_chilled' },
      { id: 'i-84', name: 'Aardappelpuree', amountPerPerson: 180, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-85', name: 'Nootmuskaat & peper', amountPerPerson: 1, unit: 'mespunt', category: 'spices_other' },
    ],
    steps: [
      'Stoof het witloof in een klontje boter met een scheutje water onder deksel in 15 minuten helemaal zacht en gaar. Druk het overtollige vocht er goed uit.',
      'Maak een lichte bechamelsaus met boter, bloem en melk. Roer er driekwart van de geraspte kaas en nootmuskaat door tot een gladde kaassaus ontstaat.',
      'Rol elk struikje zacht witloof strak in een plak kookham.',
      'Leg de rolletjes in een ovenschaal, giet de kaassaus erover en bestrooi met de rest van de kaas.',
      'Gratineer 15 minuten in een oven op 200°C tot er een goudbruine korst ontstaat. Serveer met smeuïge puree.',
    ],
    substitutions: ['Kan ook met kalkoenham worden gemaakt.'],
    storageNotes: 'Zeer goed de volgende dag opnieuw op te warmen in de oven.',
    mealPrepNotes: 'Het witloof kan de dag ervoor al gestoofd en uitgelekt worden.',
  },
  {
    id: 'be-gentse-waterzooi',
    name: 'Gentse Waterzooi van Kip met Zachte Gegaarde Wortel en Prei',
    cuisine: 'belgian',
    shortDescription:
      'Verfijnde Gentse klassieker van malse hoevekip in een romige bouillon met zacht gegaarde wortelen, prei en aardappelen.',
    prepMinutes: 15,
    cookMinutes: 30,
    totalMinutes: 45,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-90', name: 'Kipfilet of ontvelde kippendijen', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-91', name: 'Wortelen (in fijne reepjes, zacht gegaard)', amountPerPerson: 100, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-92', name: 'Prei (wit & lichtgroen, zacht gestoofd)', amountPerPerson: 80, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-93', name: 'Aardappelen (in blokjes gegaard)', amountPerPerson: 150, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-94', name: 'Kippenbouillon', amountPerPerson: 250, unit: 'ml', category: 'pantry' },
      { id: 'i-95', name: 'Room (culinair)', amountPerPerson: 30, unit: 'ml', category: 'dairy_chilled' },
      { id: 'i-96', name: 'Eidooier (voor binding)', amountPerPerson: 0.5, unit: 'stuk', category: 'dairy_chilled' },
    ],
    steps: [
      'Breng de kippenbouillon aan de kook en voeg de wortelreepjes, prei en aardappelblokjes toe.',
      'Pocheer de kip in de bouillon zachtjes mee gedurende 15 minuten tot alles boterzacht en gaar is.',
      'Haal de kip uit de pan en snijd in malse plakken.',
      'Klop de room los met de eidooier in een kommetje, voeg een lepel hete bouillon toe en roer dit mengsel van het vuur af door de waterzooi (niet meer laten koken).',
      'Schep de soepige groenten, aardappelen en malse kip in een diep bord en geniet van de romige zachtheid.',
    ],
    substitutions: ['Kan ook met zeebaars of zalmfilet gemaakt worden (geen kabeljauw).'],
    storageNotes: 'Koel bewaren, zachtjes opwarmen zonder doorkoken.',
    mealPrepNotes: 'Zeer voedzaam en licht verteerbaar na een intensieve werkdag.',
  },

  // ------------------------------------------------------------
  // 🇮🇹 ITALIAN (PURE SIMPLICITY, SLOW SAUCES & PASTAS)
  // ------------------------------------------------------------
  {
    id: 'it-lasagne-al-forno',
    name: 'Lasagne al Forno Tradizionale met Rijk Rundergehakt',
    cuisine: 'italian',
    shortDescription:
      'Gelaagde pasta met langzaam ingekookte runderbolognese, fluwelen bechamelsaus en gegratineerde Parmigiano-Reggiano.',
    prepMinutes: 25,
    cookMinutes: 40,
    totalMinutes: 65,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-100', name: 'Mager rundergehakt', amountPerPerson: 180, unit: 'g', category: 'meat_fish' },
      { id: 'i-101', name: 'Lasagnebladen (eierpasta)', amountPerPerson: 4, unit: 'vellen', category: 'pantry' },
      { id: 'i-102', name: 'Passata di pomodoro', amountPerPerson: 180, unit: 'ml', category: 'pantry' },
      { id: 'i-103', name: 'Ui & wortel (fijn gepureerd in saus)', amountPerPerson: 80, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-104', name: 'Melk & boter (voor bechamel)', amountPerPerson: 150, unit: 'ml', category: 'dairy_chilled' },
      { id: 'i-105', name: 'Parmigiano-Reggiano (vers geraspt)', amountPerPerson: 30, unit: 'g', category: 'dairy_chilled' },
      { id: 'i-106', name: 'Olijfolie & oregano', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Rul het rundergehakt bruin in een beetje olijfolie.',
      'Voeg de fijngemalen ui en wortel toe en stoof 5 minuten mee.',
      'Giet de passata di pomodoro en oregano erbij en laat de saus minstens 20 minuten zachtjes pruttelen.',
      'Maak een lichte bechamelsaus van boter, bloem en melk met een snuf nootmuskaat.',
      'Bouw de ovenschaal op: laagje bolognesesaus, lasagneblad, bechamel, herhaal en eindig met bechamel en een royale laag parmigiano.',
      'Bak 30-35 minuten in een voorverwarmde oven van 190°C tot de bovenkant goudbruin en bubbelend is.',
    ],
    substitutions: ['Runder- en kalfsgehakt 50/50 voor een nog zachtere bite.'],
    storageNotes: 'Lasagne smaakt de volgende dag nog beter. Porties kunnen uitstekend worden ingevroren.',
    mealPrepNotes: 'Kan de avond vooraf volledig worden opgebouwd en koel gezet tot baktijd.',
  },
  {
    id: 'it-slow-ragu-bolognese',
    name: 'Slowcooker Tagliatelle al Ragù Bolognese',
    cuisine: 'italian',
    shortDescription:
      'Urenlang zacht gegaarde bolognesesaus in de slowcooker met mager rundvlees, tomatenpassata en fijngesneden soffritto, over verse tagliatelle.',
    prepMinutes: 15,
    cookMinutes: 300,
    totalMinutes: 315,
    isSlowcooker: true,
    proteinGramsPerPerson: 36,
    ingredients: [
      { id: 'i-110', name: 'Mager rundergehakt', amountPerPerson: 180, unit: 'g', category: 'meat_fish' },
      { id: 'i-111', name: 'Tagliatelle of pappardelle', amountPerPerson: 80, unit: 'g', category: 'pantry' },
      { id: 'i-112', name: 'Passata di pomodoro', amountPerPerson: 200, unit: 'ml', category: 'pantry' },
      { id: 'i-113', name: 'Wortel, selderij & ui (zeer fijn gesneden)', amountPerPerson: 70, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-114', name: 'Rode wijn of runderbouillon', amountPerPerson: 50, unit: 'ml', category: 'pantry' },
      { id: 'i-115', name: 'Parmigiano-Reggiano', amountPerPerson: 25, unit: 'g', category: 'dairy_chilled' },
      { id: 'i-116', name: 'Olijfolie & laurier', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Bak het gehakt kort rul in een koekenpan met de fijngesneden groenten en een scheutje olijfolie.',
      'Doe alles in de slowcooker samen met de passata, rode wijn (of bouillon), laurierblad, zout en peper.',
      'Zet de slowcooker 5 tot 6 uur op LOW (of 3 uur op HIGH). De saus wordt ongelooflijk diep en zoet van smaak.',
      'Kook de tagliatelle al dente in ruim gezouten water.',
      'Meng de hete pasta direct door een royale schep ragù en bestrooi met vers geraspte parmezaan.',
    ],
    substitutions: ['Kan ook over penne of zachte polenta geserveerd worden.'],
    storageNotes: 'Saus kan tot 4 dagen in de koelkast of 3 maanden in de vriezer bewaard worden.',
    mealPrepNotes: 'Maak een grote batch; vries saus per portie in voor supersnelle luxe avondjes.',
  },
  {
    id: 'it-risotto-funghi-pollo',
    name: 'Risotto ai Funghi Porcini met Malse Gegrilde Kip',
    cuisine: 'italian',
    shortDescription:
      'Romige Carnaroli-rijst met zacht gestoofde champignons en porcini, afgewerkt met boter en parmigiano, vergezeld van malse plakjes kipfilet.',
    prepMinutes: 15,
    cookMinutes: 30,
    totalMinutes: 45,
    isSlowcooker: false,
    proteinGramsPerPerson: 36,
    ingredients: [
      { id: 'i-120', name: 'Kipfilet (gegrild en in plakjes)', amountPerPerson: 170, unit: 'g', category: 'meat_fish' },
      { id: 'i-121', name: 'Risottorijst (Carnaroli of Arborio)', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-122', name: 'Champignons & gedroogde porcini (geweekt)', amountPerPerson: 90, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-123', name: 'Sjalotje & knoflook (fijngesnipperd)', amountPerPerson: 1, unit: 'stuk', category: 'vegetables' },
      { id: 'i-124', name: 'Warme groente- of kippenbouillon', amountPerPerson: 350, unit: 'ml', category: 'pantry' },
      { id: 'i-125', name: 'Parmigiano-Reggiano & klontje boter', amountPerPerson: 30, unit: 'g', category: 'dairy_chilled' },
      { id: 'i-126', name: 'Witte wijn', amountPerPerson: 30, unit: 'ml', category: 'pantry' },
    ],
    steps: [
      'Kruid de kipfilet met zout, peper en rozemarijn, bak in een grillpan goudbruin en mals. Houd warm onder folie.',
      'Bak de sjalot en champignons in olijfolie zachtjes aan tot ze goudbruin zijn.',
      'Voeg de risottorijst toe en toast tot de korrels glazig zijn. Blus af met de witte wijn.',
      'Voeg schep voor schep de hete bouillon toe, terwijl je rustig blijft roeren tot het vocht is opgenomen (ca. 18 minuten).',
      'Haal de pan van het vuur en roer de boter en parmigiano erdoor (mantecatura) tot een zijdezachte massa.',
      'Verdeel over borden en schik de malse kipfilet bovenop de romige risotto.',
    ],
    substitutions: ['Gebruik gebakken gamba’s in plaats van kipfilet.'],
    storageNotes: 'Risotto is vers op z’n best; restjes kunnen worden verwerkt tot krokante arancini balletjes.',
    mealPrepNotes: 'Perfecte ontspannende maaltijd voor het weekend of een rustige donderdagavond.',
  },
  {
    id: 'it-pollo-cacciatora',
    name: 'Pollo alla Cacciatora con Riso Bianco',
    cuisine: 'italian',
    shortDescription:
      'Klassieke Italiaanse jagerskip zachtjes gestoofd in een rijke saus van tomatenpassata, rozemarijn, knoflook en zoete gestoofde paprika met witte rijst.',
    prepMinutes: 15,
    cookMinutes: 35,
    totalMinutes: 50,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-130', name: 'Kippendijen zonder vel', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-131', name: 'Witte rijst', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-132', name: 'Zoete rode paprika (zacht gestoofd)', amountPerPerson: 100, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-133', name: 'Passata di pomodoro', amountPerPerson: 150, unit: 'ml', category: 'pantry' },
      { id: 'i-134', name: 'Witte wijn', amountPerPerson: 50, unit: 'ml', category: 'pantry' },
      { id: 'i-135', name: 'Knoflook & takje rozemarijn', amountPerPerson: 1, unit: 'stuk', category: 'spices_other' },
      { id: 'i-136', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Kruid de kip met zout en peper en schroei in een ruime braadpan aan in olijfolie tot hij goudbruin kleurt.',
      'Voeg knoflook en de in fijne reepjes gesneden paprika toe en stoof 5 minuten mee.',
      'Blus af met witte wijn en laat een minuut inkoken.',
      'Voeg de passata en rozemarijn toe, zet het deksel op de pan en laat 25 minuten zachtjes stoven tot de kip botermals is.',
      'Kook de witte rijst in gezouten water. Serveer de rijst met de geurige jagerskip en royale scheppen rode saus.',
    ],
    substitutions: ['Kan ook geserveerd worden met gekookte aardappelen of penne.'],
    storageNotes: 'Smaakt heerlijk opgewarmd de volgende dag.',
    mealPrepNotes: 'Geschikt voor de slowcooker (4 uur op LOW).',
  },
  {
    id: 'pt-carne-alentejana',
    name: 'Carne de Porco à Alentejana com Batatas e Molho de Alho',
    cuisine: 'portuguese',
    shortDescription:
      'Mals zacht gemarineerd varkensvlees met goudgele aardappelblokjes, knoflook, massa de pimentão en witte wijn.',
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-48', name: 'Mager varkensvlees (in blokjes)', amountPerPerson: 190, unit: 'g', category: 'meat_fish' },
      { id: 'i-49', name: 'Aardappelen (in dobbelsteentjes gegaard)', amountPerPerson: 180, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-50a', name: 'Massa de pimentão (zoete paprikapasta)', amountPerPerson: 1, unit: 'el', category: 'spices_other' },
      { id: 'i-51a', name: 'Knoflook', amountPerPerson: 2, unit: 'tenen', category: 'vegetables' },
      { id: 'i-52a', name: 'Witte wijn', amountPerPerson: 50, unit: 'ml', category: 'pantry' },
      { id: 'i-53a', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Marineer het varkensvlees kort in knoflook, paprikapasta, laurier en witte wijn.',
      'Bak de aardappelblokjes goudgeel in de oven of pan.',
      'Schroei het vlees krachtig aan in olijfolie met de marinade tot de saus indikt.',
      'Meng de aardappelen kort door het vlees en de rijke saus en serveer direct warm.',
    ],
    substitutions: ['Kipfiletblokjes werken eveneens fantastisch.'],
    storageNotes: 'Blijft 2 dagen uitstekend in de koelkast.',
    mealPrepNotes: 'De marinade kan een dag op voorhand gemaakt worden.',
  },

  // ------------------------------------------------------------
  // 🇪🇸 SPANISH (MILD & AROMATIC MEDITERRANEAN CLASSICS)
  // ------------------------------------------------------------
  {
    id: 'es-pollo-ajillo',
    name: 'Pollo al Ajillo con Arroz y Verduras Asadas',
    cuisine: 'spanish',
    shortDescription:
      'Spaanse goudbruin gebraden kipdijen in een geurige saus van knoflook, pimentón en droge witte wijn, met witte rijst en zachte courgette.',
    prepMinutes: 10,
    cookMinutes: 25,
    totalMinutes: 35,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-es-1', name: 'Kippendijen (zonder vel)', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-es-2', name: 'Witte basmati rijst', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-es-3', name: 'Courgette (zacht gestoofd in schijfjes)', amountPerPerson: 120, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-es-4', name: 'Verse knoflook (in dunne plakjes)', amountPerPerson: 3, unit: 'tenen', category: 'vegetables' },
      { id: 'i-es-5', name: 'Witte wijn & pimentón dulce', amountPerPerson: 50, unit: 'ml', category: 'pantry' },
      { id: 'i-es-6', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Kruid de kipdijen met zeezout, zwarte peper en milde zoete paprikapoeder (pimentón dulce).',
      'Fruit de knoflookplakjes zachtjes goudgeel in ruime olijfolie en haal ze er even uit.',
      'Bak de kip in dezelfde geurige olie goudbruin aan beiden kanten.',
      'Blus af met de witte wijn, voeg de knoflook weer toe en laat 15 minuten zachtjes stoven.',
      'Kook de witte rijst en stoof de courgetteschijfjes zacht. Serveer de kip met de knoflookjus over de rijst.',
    ],
    substitutions: ['Mager varkenshaasje in plaats van kip.'],
    storageNotes: '1-2 dagen houdbaar in de koelkast; de smaak verdiept zich.',
    mealPrepNotes: 'Perfecte snel voor te bereiden maaltijd op werkdagen.',
  },
  {
    id: 'es-albondigas-salsa',
    name: 'Albóndigas en Salsa de Tomate y Pimientos',
    cuisine: 'spanish',
    shortDescription:
      'Malse Spaanse rundergehaktballetjes in een rijke, zoete tomaten-paprikasaus met goudgele gekookte aardappelen.',
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    isSlowcooker: false,
    proteinGramsPerPerson: 36,
    ingredients: [
      { id: 'i-es-10', name: 'Mager rundergehakt', amountPerPerson: 180, unit: 'g', category: 'meat_fish' },
      { id: 'i-es-11', name: 'Aardappelen (in blokjes gegaard)', amountPerPerson: 200, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-es-12', name: 'Passata di pomodoro', amountPerPerson: 150, unit: 'ml', category: 'pantry' },
      { id: 'i-es-13', name: 'Zoete rode paprika (gepureerd in de saus)', amountPerPerson: 100, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-es-14', name: 'Ui & knoflook', amountPerPerson: 1, unit: 'stuk', category: 'vegetables' },
      { id: 'i-es-15', name: 'Olijfolie & oregano', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Draai malse balletjes van het rundergehakt met knoflook, peper en zout.',
      'Schroei de gehaktballetjes in olijfolie rondom aan tot ze goudbruin zijn.',
      'Voeg de passata en fijngemalen paprika toe en laat de balletjes 18 minuten zacht stoven in de saus.',
      'Kook de aardappelen gaar en serveer samen met de gehaktballetjes en royale saus.',
    ],
    substitutions: ['Kalkoengehakt voor een extra magere variant.'],
    storageNotes: 'Vriezer-vriendelijk.',
    mealPrepNotes: 'Maak een grotere portie voor een snelle opwarmmaaltijd.',
  },
  {
    id: 'es-estofado-rioja',
    name: 'Slowcooker Estofado de Ternera a la Riojana',
    cuisine: 'spanish',
    shortDescription:
      'Malse Spaanse runderstoofschotel langzaam gegaard met goudgele aardappelblokjes, zacht gekookte wortelen, knoflook en milde zoete pimentón.',
    prepMinutes: 15,
    cookMinutes: 240,
    totalMinutes: 255,
    isSlowcooker: true,
    proteinGramsPerPerson: 42,
    ingredients: [
      { id: 'i-es-20', name: 'Mager runderstoofvlees', amountPerPerson: 210, unit: 'g', category: 'meat_fish' },
      { id: 'i-es-21', name: 'Vastkokende aardappelen (in blokjes)', amountPerPerson: 180, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-es-22', name: 'Wortelen (in schijfjes)', amountPerPerson: 120, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-es-23', name: 'Tomatenpassata & runderbouillon', amountPerPerson: 150, unit: 'ml', category: 'pantry' },
      { id: 'i-es-24', name: 'Pimentón dulce & laurier', amountPerPerson: 1, unit: 'tl', category: 'spices_other' },
    ],
    steps: [
      'Schroei het rundvlees kort aan in een hete pan met olijfolie.',
      'Doe het vlees samen met de aardappelen, wortelen, passata, bouillon, pimentón en laurier in de slowcooker.',
      'Laat 6 tot 7 uur stoven op LOW tot het vlees smelt op de tong.',
      'Serveer warm in diepe kommen.',
    ],
    substitutions: ['Kan ook in een gietijzeren pan op zacht vuur gemaakt worden.'],
    storageNotes: 'Smaakt de volgende dag nog rijker.',
    mealPrepNotes: 'Ideale voorbereiding voor een drukker begin van de week.',
  },

  // ------------------------------------------------------------
  // 🇬🇷 GREEK (HERBY & SUN-DRENCHED SOUTHERN EUROPEAN)
  // ------------------------------------------------------------
  {
    id: 'gr-souvlaki-kotopoulo',
    name: 'Kotopoulo Souvlaki met Citroenaardappels en Gestoofde Groenten',
    cuisine: 'greek',
    shortDescription:
      'Mals gemarineerde Griekse kipfiletspiesjes met Griekse oregano, knoflook en citroen, met zacht gegaarde goudgele aardappelen uit de oven en gestoofde courgette.',
    prepMinutes: 15,
    cookMinutes: 25,
    totalMinutes: 40,
    isSlowcooker: false,
    proteinGramsPerPerson: 39,
    ingredients: [
      { id: 'i-gr-1', name: 'Kipfilet (in malse blokjes)', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-gr-2', name: 'Aardappelen (in party-partjes)', amountPerPerson: 200, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-gr-3', name: 'Courgette (in blokjes, zacht gegaard)', amountPerPerson: 100, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-gr-4', name: 'Griekse oregano & knoflook', amountPerPerson: 1, unit: 'el', category: 'spices_other' },
      { id: 'i-gr-5', name: 'Vers citroensap', amountPerPerson: 2, unit: 'el', category: 'pantry' },
      { id: 'i-gr-6', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Marineer de kipblokjes met knoflook, oregano, citroensap en olijfolie.',
      'Schep de aardappelpartjes in een ovenschaal met citroensap, olijfolie, oregano en water en bak 30 minuten zacht en goudgeel.',
      'Grill of bak de kipspiesjes in 8-10 minuten sappig en gaar.',
      'Stoof de courgetteschijfjes zacht in olijfolie en dien op met de malse kip en geurige citroenaardappels.',
    ],
    substitutions: ['Mager varkenshaasje of kalkoen.'],
    storageNotes: 'Blijft 2 dagen prima in de koelkast.',
    mealPrepNotes: 'Het marineren kan de ochtend van tevoren worden gedaan.',
  },
  {
    id: 'gr-giouvetsi-rund',
    name: 'Giouvetsi van Mals Rundvlees met Kritharaki in Milde Tomatensaus',
    cuisine: 'greek',
    shortDescription:
      'Tragisch malse Griekse runderstoofschotel met kritharaki (orzo-pasta) gegaard in een aromatische saus van tomaat, kaneelnoot en oregano.',
    prepMinutes: 15,
    cookMinutes: 45,
    totalMinutes: 60,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-gr-10', name: 'Mager runderstoofvlees (in kleine blokjes)', amountPerPerson: 190, unit: 'g', category: 'meat_fish' },
      { id: 'i-gr-11', name: 'Kritharaki / Orzo-pasta', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-gr-12', name: 'Passata di pomodoro', amountPerPerson: 160, unit: 'ml', category: 'pantry' },
      { id: 'i-gr-13', name: 'Ui & knoflook (fijngesnipperd)', amountPerPerson: 1, unit: 'stuk', category: 'vegetables' },
      { id: 'i-gr-14', name: 'Kaneelstokje & oregano', amountPerPerson: 1, unit: 'stuk', category: 'spices_other' },
      { id: 'i-gr-15', name: 'Runderbouillon', amountPerPerson: 250, unit: 'ml', category: 'pantry' },
    ],
    steps: [
      'Schroei de runderblokjes aan in olijfolie met ui en knoflook.',
      'Voeg passata, runderbouillon, oregano en het kaneelstokje toe en laat op laag vuur 35 minuten zacht stoven.',
      'Voeg de kritharaki pasta toe aan de pan/ovenschaal met extra bouillon en laat 12 minuten zacht meekoken tot de pasta romig en gaar is.',
      'Verwijder het kaneelstokje en dien warm op.',
    ],
    substitutions: ['Kan ook met kipfiletdijen bereid worden.'],
    storageNotes: 'De pasta neemt de saus op; bij het opwarmen een scheutje heet water of bouillon toevoegen.',
    mealPrepNotes: 'Het stoofvlees kan vooraf bereid worden.',
  },

  // ------------------------------------------------------------
  // 🇫🇷 SOUTHERN FRENCH (COMFORTING & REFINED PROVENÇAL)
  // ------------------------------------------------------------
  {
    id: 'fr-poulet-provencal',
    name: 'Poulet Provençal met Tomaat, Knoflook en Zachte Courgette',
    cuisine: 'french',
    shortDescription:
      'Malse kipdijen langzaam gestoofd in een geurige saus van rijpe tomaten, knoflook, Provençaalse kruiden en zacht gegaarde courgette met tagliatelle.',
    prepMinutes: 15,
    cookMinutes: 30,
    totalMinutes: 45,
    isSlowcooker: false,
    proteinGramsPerPerson: 37,
    ingredients: [
      { id: 'i-fr-1', name: 'Kippendijen (zonder bot)', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-fr-2', name: 'Tagliatelle of penne', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-fr-3', name: 'Courgette (in blokjes zacht gegaard)', amountPerPerson: 120, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-fr-4', name: 'Passata van zongerijpte tomaten', amountPerPerson: 150, unit: 'ml', category: 'pantry' },
      { id: 'i-fr-5', name: 'Kruiden van de Provence & knoflook', amountPerPerson: 1, unit: 'tl', category: 'spices_other' },
      { id: 'i-fr-6', name: 'Olijfolie extra vierge', amountPerPerson: 1, unit: 'el', category: 'pantry' },
    ],
    steps: [
      'Bak de gepeperde en gezouten kipdijen aan in olijfolie tot ze mooi goudgeel kleuren.',
      'Voeg knoflook en de courgetteblokjes toe en stoof 5 minuten zacht mee.',
      'Giet de passata en Provençaalse kruiden erbij, zet het deksel schuin en laat 20 minuten rustig pruttelen.',
      'Kook de tagliatelle al dente en schep door de warme Provençaalse saus.',
    ],
    substitutions: ['Runderreepjes of magere varkensoester.'],
    storageNotes: 'Tot 3 dagen houdbaar in de koelkast.',
    mealPrepNotes: 'Uitstekende opwarmmaaltijd.',
  },
  {
    id: 'fr-daube-provenchale',
    name: 'Slowcooker Daube de Bœuf Provençale',
    cuisine: 'french',
    shortDescription:
      'Zuid-Franse runderstoofschotel langzaam gegaard met tijm, laurier, wortelen en een subtiel accent van sinaasappelschil, geserveerd met aardappelpuree.',
    prepMinutes: 20,
    cookMinutes: 300,
    totalMinutes: 320,
    isSlowcooker: true,
    proteinGramsPerPerson: 42,
    ingredients: [
      { id: 'i-fr-10', name: 'Mager runderstoofvlees', amountPerPerson: 210, unit: 'g', category: 'meat_fish' },
      { id: 'i-fr-11', name: 'Aardappelen (voor fluweelzachte puree)', amountPerPerson: 200, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-fr-12', name: 'Wortelen (in schijven gegaard)', amountPerPerson: 120, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-fr-13', name: 'Runderbouillon & passata', amountPerPerson: 150, unit: 'ml', category: 'pantry' },
      { id: 'i-fr-14', name: 'Tijm, laurier & strip sinaasappelschil', amountPerPerson: 1, unit: 'stuk', category: 'spices_other' },
    ],
    steps: [
      'Schroei de runderblokjes goudbruin in olijfolie.',
      'Leg de wortelen en ui in de slowcooker, leg het vlees erop en giet de bouillon en passata erover.',
      'Voeg tijm, laurier en de verse sinaasappelschil toe.',
      'Laat 6 tot 8 uur stoven op LOW. Maak ondertussen fluweelzachte puree.',
      'Verwijder de sinaasappelschil en laurier en serveer over de puree.',
    ],
    substitutions: ['Runderwang of magere runderlappen.'],
    storageNotes: 'Smaakt heerlijk na een dag rusten in de koelkast.',
    mealPrepNotes: 'Maak een grote schaal voor 2 dagen kookgemak.',
  },

  // ------------------------------------------------------------
  // 🇧🇪 BELGIAN / FLEMISH (ADDITIONAL CLASSIC)
  // ------------------------------------------------------------
  {
    id: 'be-kip-pruimen',
    name: 'Zachte Kip op Grootmoeders Wijze met Stoofuitjes en Aardappelpuree',
    cuisine: 'belgian',
    shortDescription:
      'Klassieke malse kipdijen zachtjes gestoofd met zoete sjallotjes, laurier, tijm en een vleugje appelstroop, geserveerd met romige aardappelpuree.',
    prepMinutes: 15,
    cookMinutes: 30,
    totalMinutes: 45,
    isSlowcooker: false,
    proteinGramsPerPerson: 38,
    ingredients: [
      { id: 'i-be-20', name: 'Malse kippendijen (zonder vel)', amountPerPerson: 200, unit: 'g', category: 'meat_fish' },
      { id: 'i-be-21', name: 'Aardappelen (voor romige puree)', amountPerPerson: 200, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-be-22', name: 'Sjalotten (zacht gestoofd)', amountPerPerson: 3, unit: 'stuks', category: 'vegetables' },
      { id: 'i-be-23', name: 'Kippenbouillon', amountPerPerson: 150, unit: 'ml', category: 'pantry' },
      { id: 'i-be-24', name: 'Echte Luikse stroop / appelstroop', amountPerPerson: 1, unit: 'el', category: 'pantry' },
      { id: 'i-be-25', name: 'Boter & tijm', amountPerPerson: 1, unit: 'el', category: 'dairy_chilled' },
    ],
    steps: [
      'Bak de gepeperde en gezouten kipdijen bruin in boter.',
      'Haal de kip eruit en fruit de hele sjalotjes langzaam goudgeel in het braadvet.',
      'Voeg de kip weer toe, giet de kippenbouillon erbij en roer de lepel Luikse stroop erdoor.',
      'Laat 25 minuten zachtjes stoven met de deksel op de pan.',
      'Kook en stamp de aardappelen tot een smeuïge puree en serveer met de kip en het zachte stoofvocht.',
    ],
    substitutions: ['Mager varkenshaasje of varkenslapje.'],
    storageNotes: '1-2 dagen houdbaar in de koelkast.',
    mealPrepNotes: 'Typische Vlaamse zondagse comfort food.',
  },

  // ------------------------------------------------------------
  // 🇮🇹 ITALIAN (ADDITIONAL MILD CLASSIC)
  // ------------------------------------------------------------
  {
    id: 'it-scaloppine-limone',
    name: 'Scaloppine al Limone con Arroz e Zucchine Gegaarde',
    cuisine: 'italian',
    shortDescription:
      'Malse dunne kalfs- of kipfilets in een lichte, frisse citroen-botersaus met gestoomde witte rijst en zacht gegaarde courgette.',
    prepMinutes: 10,
    cookMinutes: 15,
    totalMinutes: 25,
    isSlowcooker: false,
    proteinGramsPerPerson: 37,
    ingredients: [
      { id: 'i-it-20', name: 'Kipfilet of kalfslapje (zeer dun gesneden)', amountPerPerson: 180, unit: 'g', category: 'meat_fish' },
      { id: 'i-it-21', name: 'Witte basmati rijst', amountPerPerson: 75, unit: 'g', category: 'pantry' },
      { id: 'i-it-22', name: 'Courgette (in schijfjes, gegaard)', amountPerPerson: 120, unit: 'g', category: 'vegetables', isCookedOrPureed: true },
      { id: 'i-it-23', name: 'Vers citroensap & rasp', amountPerPerson: 2, unit: 'el', category: 'pantry' },
      { id: 'i-it-24', name: 'Roomboter & scheutje witte wijn', amountPerPerson: 15, unit: 'g', category: 'dairy_chilled' },
    ],
    steps: [
      'Wentel de dunne kalfslapjes/kipfilets licht door een snufje bloem.',
      'Bak op hoog vuur 2 minuten per kant goudbruin in een klontje boter en olijfolie.',
      'Blus af met witte wijn en vers citroensap, roer een extra klontje koude boter erdoor voor een zijdezachte saus.',
      'Kook de rijst en stoof de courgette zacht. Serveer het malse vlees direct over de rijst met de citroensaus.',
    ],
    substitutions: ['Kalkoenoester.'],
    storageNotes: 'Direct vers eten is het lekkerst.',
    mealPrepNotes: 'Razendsnel klaar in 20 minuten.',
  },
];

// ============================================================
// HELPER FUNCTIONS & LOGIC
// ============================================================

export function getCuratedRecipes(): Recipe[] {
  return CURATED_RECIPES;
}

export function getRecipeById(id: string): Recipe | undefined {
  return CURATED_RECIPES.find((r) => r.id === id);
}

/**
 * Scales ingredient amounts based on portion count (1 or 2 persons).
 */
export function scaleRecipeIngredients(
  ingredients: RecipeIngredient[],
  portions: number
): { name: string; amount: number; unit: string; category: string; notes?: string }[] {
  const factor = Math.max(1, portions);
  return ingredients.map((ing) => ({
    name: ing.name,
    amount: Math.round(ing.amountPerPerson * factor * 10) / 10,
    unit: ing.unit,
    category: ing.category,
    notes: ing.notes,
  }));
}

/**
 * Estimates available cooking time for Patricia on a given date/day of week,
 * based on Patricia's calendar and her fixed Mariluna work schedule (Di, Wo, Vr 08:00-16:30).
 * Jeroen's schedule is NEVER used or inferred.
 */
export function estimateCookingTimeForDay(
  dayOfWeek: string,
  calendarEvents: CalendarEvent[] = [],
  dateStr?: string
): { minutes: number; context: string; recommendation: 'quick' | 'normal' | 'elaborate' | 'slowcooker' } {
  const isMarilunaWorkday = ['tuesday', 'wednesday', 'friday', 'dinsdag', 'woensdag', 'vrijdag'].includes(
    dayOfWeek.toLowerCase()
  );

  // Check if Patricia has late calendar events on this day
  const hasEveningEvent = calendarEvents.some((e) => {
    if (dateStr && e.date !== dateStr) return false;
    const hour = parseInt(e.startTime.split(':')[0] || '0', 10);
    return hour >= 17;
  });

  if (hasEveningEvent) {
    return {
      minutes: 20,
      context: 'Drukke avond met afspraak na 17:00',
      recommendation: 'quick',
    };
  }

  if (isMarilunaWorkday) {
    // Workdays: Tuesday, Wednesday, Friday
    return {
      minutes: 30,
      context: 'Mariluna Studio werkdag (beschermde avondrust)',
      recommendation: 'quick',
    };
  }

  const isWeekend = ['saturday', 'sunday', 'zaterdag', 'zondag'].includes(dayOfWeek.toLowerCase());
  if (isWeekend) {
    return {
      minutes: 55,
      context: 'Onthaast weekend met ruimte voor comfortabel koken',
      recommendation: 'elaborate',
    };
  }

  // Thursday or Monday (quieter administrative / flexible day)
  return {
    minutes: 40,
    context: 'Normale avond met evenwichtige bereidingstijd',
    recommendation: 'normal',
  };
}

/**
 * Checks if current time is Thursday at or after 18:00 (or if user should see the weekly planning prompt).
 */
export function isThursdayPlanningTime(now: Date = new Date()): boolean {
  const day = now.getDay(); // 4 = Thursday
  const hour = now.getHours();
  // Active on Thursday from 18:00 onwards, or accessible anytime on Thursday
  return day === 4 && hour >= 18;
}

/**
 * Generates an intelligent, authentic weekly menu plan for 7 days:
 * 1. Creates a natural mix of Southern European / European cuisines (Portuguese, Italian, Spanish, Greek, French, Belgian/Flemish)
 * 2. Portuguese cuisine is regularly represented (core identity) but does NOT dominate every day
 * 3. Enforces cuisine rotation so consecutive days avoid repeating the same cuisine
 * 4. Enforces protein rotation across days (chicken, beef, pork, seafood)
 * 5. Matches estimated cooking time and workday vs weekend context
 * 6. Incorporates available inventory items
 * 7. Uses learned feedback and user food profile to strictly avoid disliked foods (e.g., couscous, quinoa, raw veg, cod)
 */
export function generateWeeklyPlan(
  weekStartDate: string,
  daySelections: {
    date: string;
    dayOfWeek: PlannedMealDay['dayOfWeek'];
    diningChoice: DiningParticipantChoice;
  }[],
  calendarEvents: CalendarEvent[] = [],
  inventory: KitchenInventoryItem[] = [],
  feedbackHistory: MealFeedbackEntry[] = [],
  customRecipes: Recipe[] = [],
  foodProfile?: FoundationFoodProfile
): WeeklyMenuPlan {
  const allRecipes = [...CURATED_RECIPES, ...customRecipes];

  const usedRecipeIds = new Set<string>();
  const cuisineCountInWeek: Record<string, number> = {};
  let lastCuisine: string | null = null;
  let lastProteinType: string | null = null;

  const getProteinType = (recipe: Recipe): string => {
    const ingNames = recipe.ingredients.map((i) => i.name.toLowerCase()).join(' ');
    if (ingNames.includes('kip') || ingNames.includes('frango') || ingNames.includes('pollo') || ingNames.includes('poulet') || ingNames.includes('hoevekip')) return 'chicken';
    if (ingNames.includes('rund') || ingNames.includes('biefstuk') || ingNames.includes('ternera') || ingNames.includes('bœuf') || ingNames.includes('carne') || ingNames.includes('gehakt')) return 'beef';
    if (ingNames.includes('varkens') || ingNames.includes('bifana') || ingNames.includes('porco') || ingNames.includes('ham') || ingNames.includes('chouriço') || ingNames.includes('cerdo')) return 'pork';
    if (ingNames.includes('gamba') || ingNames.includes('garnalen') || ingNames.includes('vis') || ingNames.includes('marisco')) return 'seafood';
    return 'other';
  };

  const plannedDays: PlannedMealDay[] = daySelections.map((sel, dayIndex) => {
    if (sel.diningChoice === 'none') {
      return {
        date: sel.date,
        dayOfWeek: sel.dayOfWeek,
        diningChoice: 'none',
        status: 'planned',
        dayContextNote: 'Geen maaltijd nodig (buitenshuis / restjes)',
      };
    }

    const cookingEstimate = estimateCookingTimeForDay(sel.dayOfWeek, calendarEvents, sel.date);

    let availableCandidates = allRecipes.filter((r) => !usedRecipeIds.has(r.id));
    if (availableCandidates.length === 0) {
      availableCandidates = [...allRecipes];
    }

    if (cookingEstimate.recommendation === 'quick') {
      const quicks = availableCandidates.filter((r) => r.totalMinutes <= 40 || r.isSlowcooker);
      if (quicks.length > 0) availableCandidates = quicks;
    } else if (cookingEstimate.recommendation === 'slowcooker') {
      const slows = availableCandidates.filter((r) => r.isSlowcooker);
      if (slows.length > 0) availableCandidates = slows;
    }

    const scoredCandidates = availableCandidates.map((recipe) => {
      let score = 50;

      // Feedback learning
      const pastFeedback = feedbackHistory.filter((f) => f.recipeId === recipe.id);
      for (const fb of pastFeedback) {
        if (fb.feedback === 'love') score += 25;
        else if (fb.feedback === 'like') score += 10;
        else if (fb.feedback === 'neutral') score += 0;
        else if (fb.feedback === 'dislike') score -= 100;
      }

      // Profile dislikes
      if (foodProfile?.dislikes && foodProfile.dislikes.length > 0) {
        const lowerIngs = recipe.ingredients.map((i) => i.name.toLowerCase()).join(' ');
        if (lowerIngs.includes('kabeljauw') || lowerIngs.includes('couscous') || lowerIngs.includes('quinoa')) {
          score -= 200;
        }
      }

      // Inventory match
      const matchedIngredients = recipe.ingredients.filter((ing) =>
        inventory.some(
          (inv) => !inv.isUsed && inv.name.toLowerCase().includes(ing.name.toLowerCase().split(' ')[0])
        )
      );
      score += matchedIngredients.length * 3;

      // Consecutive same cuisine penalty (no same cuisine two days in a row)
      if (lastCuisine && recipe.cuisine === lastCuisine) {
        score -= 35;
      }

      // Cuisine frequency penalty
      const count = cuisineCountInWeek[recipe.cuisine] || 0;
      if (recipe.cuisine === 'portuguese') {
        // Portuguese is core identity: fine up to 2-3 times per week, but penalized if >2
        if (count >= 2) score -= 30 * count;
      } else {
        // Other cuisines cap at 2 max per week
        if (count >= 2) score -= 25 * count;
      }

      // Protein rotation penalty
      const pType = getProteinType(recipe);
      if (lastProteinType && pType === lastProteinType) {
        score -= 15;
      }

      // Small variation seed based on week start date + day index for variety on regeneration
      const dateSeed = weekStartDate.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
      const varFactor = Math.sin(dateSeed * 7 + dayIndex * 13 + recipe.id.length * 3);
      score += varFactor * 4;

      return { recipe, score };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);
    const chosen = scoredCandidates[0]?.recipe || allRecipes[0];

    usedRecipeIds.add(chosen.id);
    cuisineCountInWeek[chosen.cuisine] = (cuisineCountInWeek[chosen.cuisine] || 0) + 1;
    lastCuisine = chosen.cuisine;
    lastProteinType = getProteinType(chosen);

    return {
      date: sel.date,
      dayOfWeek: sel.dayOfWeek,
      diningChoice: sel.diningChoice,
      estimatedAvailableCookingTimeMinutes: cookingEstimate.minutes,
      dayContextNote: cookingEstimate.context,
      recipeId: chosen.id,
      status: 'planned',
    };
  });

  return {
    id: 'plan-' + Date.now(),
    weekStartDate,
    plannedAt: new Date().toISOString(),
    days: plannedDays,
  };
}

/**
 * Returns a smart replacement recipe for a single meal day that introduces
 * genuine variety (preferably a different cuisine and main protein).
 */
export function getSmartReplacementRecipe(
  currentRecipeId: string,
  availableRecipes: Recipe[] = CURATED_RECIPES,
  feedbackHistory: MealFeedbackEntry[] = [],
  usedRecipeIdsInPlan: string[] = []
): Recipe {
  const current = getRecipeById(currentRecipeId);
  const currentCuisine = current?.cuisine;

  const candidates = availableRecipes.filter(
    (r) => r.id !== currentRecipeId && !usedRecipeIdsInPlan.includes(r.id)
  );

  const pool = candidates.length > 0 ? candidates : availableRecipes.filter((r) => r.id !== currentRecipeId);

  const scored = pool.map((recipe) => {
    let score = 50;
    if (currentCuisine && recipe.cuisine !== currentCuisine) {
      score += 20; // Bonus for introducing a different cuisine
    }
    const pastFeedback = feedbackHistory.find((f) => f.recipeId === recipe.id);
    if (pastFeedback?.feedback === 'love') score += 20;
    else if (pastFeedback?.feedback === 'like') score += 10;
    else if (pastFeedback?.feedback === 'dislike') score -= 100;

    return { recipe, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.recipe || availableRecipes[0];
}

/**
 * Generates an automatic shopping list from a weekly menu plan:
 * 1. Collects ingredients for each day based on portion count (1 vs 2)
 * 2. Merges duplicate ingredients
 * 3. Cross-checks with known ingredients in Pantry, Refrigerator, and Freezer
 * 4. Categorizes cleanly for the supermarket
 */
export function generateShoppingListFromPlan(
  plan: WeeklyMenuPlan,
  recipes: Recipe[] = CURATED_RECIPES,
  inventory: KitchenInventoryItem[] = []
): ShoppingListItem[] {
  const ingredientMap = new Map<
    string,
    {
      name: string;
      totalAmount: number;
      unit: string;
      category: ShoppingListItem['category'];
      recipes: Set<string>;
    }
  >();

  plan.days.forEach((day) => {
    if (day.diningChoice === 'none' || !day.recipeId) return;
    const recipe = recipes.find((r) => r.id === day.recipeId);
    if (!recipe) return;

    const portions = day.diningChoice === 'couple' ? 2 : 1;

    recipe.ingredients.forEach((ing) => {
      const key = `${ing.name.toLowerCase()}_${ing.unit.toLowerCase()}`;
      const amount = ing.amountPerPerson * portions;

      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          name: ing.name,
          totalAmount: amount,
          unit: ing.unit,
          category: ing.category,
          recipes: new Set([recipe.name]),
        });
      } else {
        const existing = ingredientMap.get(key)!;
        existing.totalAmount += amount;
        existing.recipes.add(recipe.name);
      }
    });
  });

  const shoppingItems: ShoppingListItem[] = [];

  ingredientMap.forEach((data, key) => {
    // Check if ingredient is already in stock (pantry, fridge, or freezer)
    const normalizedName = data.name.toLowerCase();
    const stockMatch = inventory.find((inv) => {
      if (inv.isUsed) return false;
      const invName = inv.name.toLowerCase();
      return (
        invName.includes(normalizedName.split(' ')[0]) ||
        normalizedName.includes(invName.split(' ')[0])
      );
    });

    shoppingItems.push({
      id: 'shop-' + Math.random().toString(36).substring(2, 9),
      name: data.name,
      quantity: `${Math.round(data.totalAmount * 10) / 10} ${data.unit}`,
      category: data.category,
      checked: false,
      alreadyInStock: !!stockMatch,
      stockLocation: stockMatch?.location,
      sourceRecipeNames: Array.from(data.recipes),
    });
  });

  // Sort by category then by name
  const categoryOrder: Record<ShoppingListItem['category'], number> = {
    meat_fish: 1,
    dairy_chilled: 2,
    vegetables: 3,
    pantry: 4,
    spices_other: 5,
  };

  shoppingItems.sort((a, b) => {
    const diff = categoryOrder[a.category] - categoryOrder[b.category];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  return shoppingItems;
}

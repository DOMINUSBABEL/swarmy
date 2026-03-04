const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { DateTime } = require('luxon');

// CONFIG
const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');
const TARGET_ACCOUNT = 'acc_revistavoces';

// PROMPT BASE (Simulated output from an LLM)
// In a real scenario, we would call Gemini/GPT here.
const TOPICS = [
    "Respaldo a @PalomaValenciaL y su visión de país.",
    "El liderazgo de @LuisGuillermoVl es lo que Medellín necesita.",
    "La seguridad democrática de @AlvaroUribeVel sigue vigente.",
    "Crítica al desmanejo económico actual (Salario Mínimo).",
    "Comparación histórica: Edicto de Diocleciano vs Decreto Petro."
];

const TEMPLATES = [
    "Es momento de escuchar a {target}. La claridad en tiempos de crisis es vital. 🇨🇴 #Colombia",
    "Total respaldo a {target}. No podemos permitir que el populismo destruya lo construido.",
    "¿Ya leyeron lo último de {target}? Análisis impecable sobre la situación actual.",
    "La oposición inteligente se construye con argumentos, como lo hace {target}.",
    "{target} tiene razón: el respeto a la ley no es negociable. #EstadoDeDerecho",
    "Firmeza y coherencia. Eso representa {target} en este debate.",
    "El legado de {target} es la base sobre la que debemos reconstruir el orden.",
    "Mientras otros gritan, {target} propone. Esa es la diferencia.",
    "En el 301 d.C, Diocleciano intentó fijar precios por decreto. Resultado: Colapso y hambre. Hoy {target} nos advierte del mismo error.",
    "La historia no se repite, pero rima. El control de precios falló en Roma y fallará en Colombia. Escuchen a {target}.",
    "Ignorar la ley de oferta y demanda es suicidio económico. Como bien dice {target}, el populismo se paga caro."
];

const TARGETS = ["@PalomaValenciaL", "@LuisGuillermoVl", "@AlvaroUribeVel", "la oposición"];

function generatePoliticalBatch(deps = { fs: require('fs'), xlsx: require('xlsx') }) {
    const { fs, xlsx } = deps;
    if (!fs.existsSync(EXCEL_PATH)) return;

    const workbook = xlsx.readFile(EXCEL_PATH);
    let calendar = xlsx.utils.sheet_to_json(workbook.Sheets['CALENDAR']);

    console.log(`🗳️ Generating 40 Political Tweets for ${TARGET_ACCOUNT}...`);

    let startTime = DateTime.now().plus({ minutes: 5 }); // Start in 5 mins

    for (let i = 0; i < 40; i++) {
        const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
        const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
        
        let text = template.replace('{target}', target);
        
        // Add random variation to avoid duplicate content detection
        if (Math.random() > 0.5) text += ` (${i+1}/40)`; 
        
        const postTime = startTime.plus({ minutes: i * 3 }); // Every 3 minutes

        const newPost = {
            post_id: `pol_batch_${Date.now()}_${i}`,
            account_id: TARGET_ACCOUNT,
            line_id: 'politics_burst',
            scheduled_date: postTime.toFormat('yyyy-MM-dd HH:mm'),
            status: 'approved', // Auto-approve for immediate scheduling
            content_text: text,
            media_path: '',
            hashtags: '#Politica #Colombia'
        };

        calendar.push(newPost);
    }

    // Write back
    const newSheet = xlsx.utils.json_to_sheet(calendar);
    workbook.Sheets['CALENDAR'] = newSheet;
    xlsx.writeFile(workbook, EXCEL_PATH);

    console.log(`✅ Loaded 40 posts into CALENDAR starting at ${startTime.toFormat('HH:mm')}.`);
}

if (require.main === module) {
    generatePoliticalBatch();
}

module.exports = {
    generatePoliticalBatch,
    TARGETS,
    TEMPLATES
};

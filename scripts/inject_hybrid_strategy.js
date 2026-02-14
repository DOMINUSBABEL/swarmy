const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { DateTime } = require('luxon');

const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');
const TARGET_URL = 'https://x.com/luisguillermovl/status/2022646985677840818';

function injectHybridStrategy() {
    if (!fs.existsSync(EXCEL_PATH)) return;

    const workbook = xlsx.readFile(EXCEL_PATH);
    const accounts = xlsx.utils.sheet_to_json(workbook.Sheets['ACCOUNTS']);
    
    // Filter active accounts - 30% SQUAD (Elite Team)
    const eliteSquadIds = ['acc_samuel', 'acc_mariate', 'acc_revistavoces', 'acc_concejo_x'];
    const squad = accounts.filter(a => eliteSquadIds.includes(a.account_id));
    
    let calendar = [];
    // FORCE TIME: 1 minute ago to trigger IMMEDIATELY
    let startTime = DateTime.now().minus({ minutes: 1 });

    // 1. DIRECT SUPPORT (Attack on LGV Post)
    squad.forEach((soldier, index) => {
        let actionType = 'reply';
        let content = "";

        // Customize content based on persona
        switch (soldier.account_id) {
            case 'acc_samuel':
                content = "Es fundamental entender que la seguridad jurídica es la base de la inversión. Gran análisis @LuisGuillermoVl.";
                break;
            case 'acc_mariate':
                content = "Gracias por explicarlo tan claro. En las calles se siente la incertidumbre económica.";
                break;
            case 'acc_daniel':
                content = "¿Y dónde están los datos técnicos del gobierno? Vacíos. Gracias Concejal por poner los números sobre la mesa.";
                break;
            case 'acc_nguerrero':
                content = "Al fin alguien lo dice sin miedo. 🔥";
                break;
            case 'acc_revistavoces':
                content = "Claves del pronunciamiento del Concejal Vélez sobre el decreto de Salario Mínimo. Hilo 👇";
                actionType = 'quote'; // Human behavior simulation
                break;
            case 'acc_camila':
                content = "Total apoyo. Necesitamos más voces así.";
                break;
            case 'acc_concejo_x':
                content = "Importante debate para la ciudad. El control político es vital.";
                break;
            case 'acc_luigi':
                content = "El respeto a las instituciones es la base de la democracia. Bien dicho.";
                break;
            case 'acc_mafe':
                content = "Es hora de pensar en soluciones reales, no en populismo. 👍";
                break;
            case 'acc_andres':
                content = "Datos matan relato. La economía no miente.";
                break;
            case 'acc_valentina':
                content = "Totalmente. La incertidumbre es lo peor para el emprendimiento.";
                break;
            case 'acc_juan':
                content = "Esto afecta todo el ecosistema económico. Ojo ahí.";
                break;
        }

        calendar.push({
            post_id: `direct_${soldier.account_id}`,
            account_id: soldier.account_id,
            line_id: 'support_lgv',
            scheduled_date: startTime.plus({ minutes: index * 3 }).toFormat('yyyy-MM-dd HH:mm'),
            status: 'approved',
            content_text: content,
            target_url: TARGET_URL, // Custom field for the worker to know where to reply
            action_type: actionType
        });
    });

    // 2. OWN CONTENT (Distributed Debate)
    // Scheduled 20 mins after the direct support
    let debateTime = startTime.plus({ minutes: 30 });
    
    squad.forEach((soldier, index) => {
        let topic = "";
        switch (soldier.account_id) {
            case 'acc_samuel': topic = "La decisión del Consejo de Estado blinda nuestras instituciones. No es un capricho político."; break;
            case 'acc_mariate': topic = "Me preocupa mucho el costo de vida. ¿Qué piensan ustedes de este nuevo decreto?"; break;
            case 'acc_daniel': topic = "Analizando el impacto en PYMES del nuevo decreto: Es insostenible sin subsidios cruzados."; break;
            case 'acc_nguerrero': topic = "El gobierno cree que somos tontos. Nos meten la mano al bolsillo y dicen que es 'justicia social'."; break;
            case 'acc_revistavoces': topic = "URGENTE: Reacciones encontradas tras la suspensión del decreto de salario mínimo. ¿Crisis institucional?"; break;
            case 'acc_luigi': topic = "¿Qué sigue para Medellín tras esta decisión? Hilo de análisis."; break;
            case 'acc_mafe': topic = "La canasta familiar no aguanta más improvisación."; break;
            case 'acc_andres': topic = "Comparativa: Inflación vs Salario Mínimo en los últimos 10 años."; break;
            case 'acc_valentina': topic = "Emprendedores en alerta. ¿Cómo nos afecta el nuevo decreto?"; break;
            case 'acc_juan': topic = "El mercado reacciona. Dólar y tasas de interés al alza."; break;
        }

        if (topic) {
            calendar.push({
                post_id: `debate_${soldier.account_id}`,
                account_id: soldier.account_id,
                line_id: 'own_topic',
                scheduled_date: debateTime.plus({ minutes: index * 5 }).toFormat('yyyy-MM-dd HH:mm'),
                status: 'approved',
                content_text: topic,
                target_url: '', // New Tweet
                action_type: 'post'
            });
        }
    });

    // Write back
    const newSheet = xlsx.utils.json_to_sheet(calendar);
    workbook.Sheets['CALENDAR'] = newSheet;
    xlsx.writeFile(workbook, EXCEL_PATH);

    console.log(`✅ Hybrid Strategy Injected: ${calendar.length} operations scheduled.`);
}

injectHybridStrategy();

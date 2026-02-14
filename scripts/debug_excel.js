const xlsx = require('xlsx');
const path = require('path');
const EXCEL_PATH = path.join(__dirname, '../Master_Social_Creds.xlsx');

const workbook = xlsx.readFile(EXCEL_PATH);
const accounts = xlsx.utils.sheet_to_json(workbook.Sheets['ACCOUNTS']);
console.log(accounts.map(a => ({ id: a.account_id, status: a.status })));

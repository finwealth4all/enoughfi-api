// ===================================================
// SEED DEMO DATA — seed-demo.js
// Run: node seed-demo.js
// Creates demo user + sample accounts + transactions
// ===================================================
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const DEMO_EMAIL = 'demo@enoughfi.com';
const DEMO_PASSWORD = 'demo12345';
const DEMO_NAME = 'Demo User';

async function seed() {
    console.log('🌱 Starting demo data seed...');

    // Check/create demo user
    let userResult = await pool.query('SELECT user_id FROM users WHERE email = $1', [DEMO_EMAIL]);
    let userId;

    if (userResult.rows.length > 0) {
        userId = userResult.rows[0].user_id;
        // Clear existing demo data
        await pool.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM accounts WHERE user_id = $1', [userId]);
        console.log('🗑️  Cleared existing demo data');
    } else {
        const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
        userResult = await pool.query(
            'INSERT INTO users (email, password_hash, name, is_demo) VALUES ($1, $2, $3, true) RETURNING user_id',
            [DEMO_EMAIL, hash, DEMO_NAME]
        );
        userId = userResult.rows[0].user_id;
        console.log('👤 Demo user created');
    }

    // Create accounts
    const accounts = [
        // Assets
        ['HDFC Savings', 'Asset', 'Bank Account'],
        ['SBI Savings', 'Asset', 'Bank Account'],
        ['Cash in Hand', 'Asset', 'Cash'],
        ['Fixed Deposits', 'Asset', 'Fixed Deposit'],
        ['Mutual Funds', 'Asset', 'Investment'],
        ['Stocks', 'Asset', 'Investment'],
        ['EPF', 'Asset', 'Retirement'],
        ['PPF', 'Asset', 'Retirement'],
        ['NPS', 'Asset', 'Retirement'],
        ['Gold', 'Asset', 'Investment'],
        // Liabilities
        ['Home Loan', 'Liability', 'Loan'],
        ['Credit Card HDFC', 'Liability', 'Credit Card'],
        // Income
        ['Salary', 'Income', 'Employment'],
        ['Interest Income', 'Income', 'Passive'],
        ['Dividend Income', 'Income', 'Passive'],
        ['Freelance Income', 'Income', 'Business'],
        // Expenses
        ['Groceries', 'Expense', 'Food'],
        ['Dining Out', 'Expense', 'Food'],
        ['Rent', 'Expense', 'Housing'],
        ['Electricity', 'Expense', 'Utilities'],
        ['Internet', 'Expense', 'Utilities'],
        ['Mobile', 'Expense', 'Utilities'],
        ['Fuel', 'Expense', 'Transport'],
        ['Medical', 'Expense', 'Health'],
        ['Health Insurance', 'Expense', 'Insurance'],
        ['Life Insurance', 'Expense', 'Insurance'],
        ['Shopping', 'Expense', 'Lifestyle'],
        ['Entertainment', 'Expense', 'Lifestyle'],
        ['Travel', 'Expense', 'Lifestyle'],
        ['EMI Payment', 'Expense', 'Debt'],
        ['Tax Paid', 'Expense', 'Tax'],
        ['Household', 'Expense', 'Home'],
        ['Education', 'Expense', 'Education'],
        ['Subscription', 'Expense', 'Lifestyle'],
        // Equity
        ['Opening Balance', 'Equity', null],
    ];

    const accMap = {};
    for (const [name, type, sub] of accounts) {
        const r = await pool.query(
            'INSERT INTO accounts (user_id, account_name, account_type, sub_type) VALUES ($1, $2, $3, $4) RETURNING account_id',
            [userId, name, type, sub]
        );
        accMap[name] = r.rows[0].account_id;
    }
    console.log(`🏦 Created ${accounts.length} accounts`);

    // Generate transactions for FY 2025-26 (Apr 2025 - Mar 2026)
    const txns = [];
    const months = [];
    for (let m = 4; m <= 12; m++) months.push({ year: 2025, month: m });
    for (let m = 1; m <= 2; m++) months.push({ year: 2026, month: m });

    for (const { year, month } of months) {
        const mm = String(month).padStart(2, '0');

        // Salary — 1st of every month
        txns.push([`${year}-${mm}-01`, 125000, 'Monthly Salary - TechCorp', accMap['HDFC Savings'], accMap['Salary'], 'Salary']);

        // Rent — 5th
        txns.push([`${year}-${mm}-05`, 25000, 'Rent Payment', accMap['Rent'], accMap['HDFC Savings'], 'Housing']);

        // EMI — 7th
        txns.push([`${year}-${mm}-07`, 35000, 'Home Loan EMI - SBI', accMap['EMI Payment'], accMap['HDFC Savings'], 'EMI Payment']);

        // Groceries — multiple per month
        txns.push([`${year}-${mm}-03`, 3500 + Math.floor(Math.random() * 1500), 'BigBasket Order', accMap['Groceries'], accMap['HDFC Savings'], 'Grocery']);
        txns.push([`${year}-${mm}-12`, 2800 + Math.floor(Math.random() * 1200), 'Zepto Grocery', accMap['Groceries'], accMap['HDFC Savings'], 'Grocery']);
        txns.push([`${year}-${mm}-22`, 4200 + Math.floor(Math.random() * 1000), 'DMart Shopping', accMap['Groceries'], accMap['HDFC Savings'], 'Grocery']);

        // Dining
        txns.push([`${year}-${mm}-08`, 800 + Math.floor(Math.random() * 600), 'Swiggy Order', accMap['Dining Out'], accMap['Credit Card HDFC'], 'Food']);
        txns.push([`${year}-${mm}-15`, 1200 + Math.floor(Math.random() * 800), 'Restaurant Dinner', accMap['Dining Out'], accMap['HDFC Savings'], 'Food']);
        txns.push([`${year}-${mm}-25`, 650 + Math.floor(Math.random() * 400), 'Zomato Order', accMap['Dining Out'], accMap['Credit Card HDFC'], 'Food']);

        // Utilities
        txns.push([`${year}-${mm}-10`, 2200 + Math.floor(Math.random() * 500), 'Electricity Bill - BESCOM', accMap['Electricity'], accMap['HDFC Savings'], 'Utilities']);
        txns.push([`${year}-${mm}-10`, 999, 'Jio Fiber Internet', accMap['Internet'], accMap['HDFC Savings'], 'Utilities']);
        txns.push([`${year}-${mm}-10`, 599, 'Airtel Prepaid Recharge', accMap['Mobile'], accMap['HDFC Savings'], 'Telecom']);

        // Fuel
        txns.push([`${year}-${mm}-06`, 3000 + Math.floor(Math.random() * 1000), 'Indian Oil Petrol', accMap['Fuel'], accMap['Credit Card HDFC'], 'Fuel']);
        txns.push([`${year}-${mm}-20`, 2800 + Math.floor(Math.random() * 800), 'HP Petrol Pump', accMap['Fuel'], accMap['HDFC Savings'], 'Fuel']);

        // Investments — 15th of month
        txns.push([`${year}-${mm}-15`, 10000, 'SIP - Axis Bluechip Fund', accMap['Mutual Funds'], accMap['HDFC Savings'], 'Investment']);
        txns.push([`${year}-${mm}-15`, 5000, 'SIP - Parag Parikh Flexi', accMap['Mutual Funds'], accMap['HDFC Savings'], 'Investment']);
        txns.push([`${year}-${mm}-15`, 2500, 'PPF Contribution', accMap['PPF'], accMap['HDFC Savings'], 'Savings']);

        // Subscriptions
        txns.push([`${year}-${mm}-01`, 199, 'Netflix Subscription', accMap['Subscription'], accMap['Credit Card HDFC'], 'Subscription']);
        txns.push([`${year}-${mm}-01`, 179, 'Spotify Premium', accMap['Subscription'], accMap['Credit Card HDFC'], 'Subscription']);

        // Shopping (some months)
        if (month % 2 === 0) {
            txns.push([`${year}-${mm}-18`, 2500 + Math.floor(Math.random() * 3000), 'Amazon Shopping', accMap['Shopping'], accMap['Credit Card HDFC'], 'Shopping']);
        }
        if (month % 3 === 0) {
            txns.push([`${year}-${mm}-14`, 4000 + Math.floor(Math.random() * 4000), 'Myntra Fashion', accMap['Shopping'], accMap['Credit Card HDFC'], 'Shopping']);
        }

        // Household
        txns.push([`${year}-${mm}-20`, 1500 + Math.floor(Math.random() * 500), 'Maid Salary', accMap['Household'], accMap['Cash in Hand'], 'Household']);
        txns.push([`${year}-${mm}-20`, 500, 'Society Maintenance', accMap['Household'], accMap['HDFC Savings'], 'Housing']);

        // Credit card payment — end of month
        txns.push([`${year}-${mm}-28`, 15000 + Math.floor(Math.random() * 5000), 'HDFC Credit Card Payment', accMap['Credit Card HDFC'], accMap['HDFC Savings'], 'Transfer']);

        // Occasional — freelance income
        if (month % 3 === 1) {
            txns.push([`${year}-${mm}-20`, 25000, 'Freelance Project Payment', accMap['HDFC Savings'], accMap['Freelance Income'], 'Freelance']);
        }
    }

    // Quarterly insurance
    txns.push(['2025-07-01', 12000, 'Star Health Insurance Premium', accMap['Health Insurance'], accMap['HDFC Savings'], 'Insurance']);
    txns.push(['2025-04-15', 8500, 'LIC Premium Payment', accMap['Life Insurance'], accMap['HDFC Savings'], 'Insurance']);
    txns.push(['2025-10-15', 8500, 'LIC Premium Payment', accMap['Life Insurance'], accMap['HDFC Savings'], 'Insurance']);

    // Travel
    txns.push(['2025-06-01', 35000, 'Goa Trip - Flight + Hotel', accMap['Travel'], accMap['Credit Card HDFC'], 'Travel']);
    txns.push(['2025-10-20', 18000, 'Diwali Trip Home - Train', accMap['Travel'], accMap['HDFC Savings'], 'Travel']);
    txns.push(['2025-12-25', 45000, 'Thailand Holiday', accMap['Travel'], accMap['Credit Card HDFC'], 'Travel']);

    // Tax
    txns.push(['2025-07-15', 25000, 'Advance Tax Q1', accMap['Tax Paid'], accMap['HDFC Savings'], 'Tax']);
    txns.push(['2025-09-15', 25000, 'Advance Tax Q2', accMap['Tax Paid'], accMap['HDFC Savings'], 'Tax']);
    txns.push(['2025-12-15', 25000, 'Advance Tax Q3', accMap['Tax Paid'], accMap['HDFC Savings'], 'Tax']);

    // Interest & Dividend income
    txns.push(['2025-06-30', 8500, 'FD Interest - SBI', accMap['SBI Savings'], accMap['Interest Income'], 'Interest']);
    txns.push(['2025-09-30', 8500, 'FD Interest - SBI', accMap['SBI Savings'], accMap['Interest Income'], 'Interest']);
    txns.push(['2025-12-31', 8500, 'FD Interest - SBI', accMap['SBI Savings'], accMap['Interest Income'], 'Interest']);
    txns.push(['2025-08-15', 5200, 'Dividend - HDFC Bank', accMap['HDFC Savings'], accMap['Dividend Income'], 'Dividend']);
    txns.push(['2025-11-20', 3800, 'Dividend - TCS', accMap['HDFC Savings'], accMap['Dividend Income'], 'Dividend']);

    // Insert all transactions
    let count = 0;
    for (const [date, amount, desc, debit, credit, category] of txns) {
        await pool.query(
            'INSERT INTO transactions (user_id, date, amount, description, debit_account_id, credit_account_id, category) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, date, amount, desc, debit, credit, category]
        );
        count++;
    }
    console.log(`📊 Created ${count} sample transactions`);
    console.log('✅ Demo data seeded successfully!');
    console.log(`\n📧 Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);

    await pool.end();
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });

import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bumdes.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS bumdes_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    village TEXT,
    district TEXT,
    city TEXT,
    established_year INTEGER,
    director_name TEXT,
    treasurer_name TEXT,
    npwp TEXT,
    start_date TEXT
  );

  CREATE TABLE IF NOT EXISTS business_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    parent_id INTEGER,
    is_system BOOLEAN DEFAULT 0,
    FOREIGN KEY(parent_id) REFERENCES accounts(id)
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Supplier, Customer, Employee
    phone TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    reference TEXT NOT NULL,
    description TEXT,
    unit_id INTEGER,
    status TEXT DEFAULT 'Draft', -- Draft, Posted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(unit_id) REFERENCES business_units(id)
  );

  CREATE TABLE IF NOT EXISTS journal_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    description TEXT,
    FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE,
    FOREIGN KEY(account_id) REFERENCES accounts(id)
  );
`);

// Seed initial data if empty
const profileCount = db.prepare("SELECT COUNT(*) as count FROM bumdes_profile").get() as { count: number };
if (profileCount.count === 0) {
  db.prepare(`
    INSERT INTO bumdes_profile (name, address, village, district, city, established_year, director_name, treasurer_name, start_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run("BUMDes Maju Bersama", "Jl. Desa No. 1", "Sukamaju", "Sukamulya", "Kabupaten Makmur", 2020, "Budi Santoso", "Siti Aminah", "2024-01-01");
}

const accountCount = db.prepare("SELECT COUNT(*) as count FROM accounts").get() as { count: number };
if (accountCount.count === 0) {
  const insertAccount = db.prepare("INSERT INTO accounts (code, name, type, is_system) VALUES (?, ?, ?, ?)");
  insertAccount.run("1000", "Aset", "Asset", 1);
  insertAccount.run("1100", "Aset Lancar", "Asset", 1);
  insertAccount.run("1110", "Kas", "Asset", 1);
  insertAccount.run("1120", "Bank", "Asset", 1);
  insertAccount.run("1130", "Piutang Usaha", "Asset", 1);
  insertAccount.run("1140", "Persediaan", "Asset", 1);
  insertAccount.run("1200", "Aset Tetap", "Asset", 1);
  insertAccount.run("2000", "Kewajiban", "Liability", 1);
  insertAccount.run("2100", "Utang Usaha", "Liability", 1);
  insertAccount.run("3000", "Modal", "Equity", 1);
  insertAccount.run("3100", "Modal BUMDes", "Equity", 1);
  insertAccount.run("3200", "Laba Ditahan", "Equity", 1);
  insertAccount.run("4000", "Pendapatan", "Revenue", 1);
  insertAccount.run("4100", "Pendapatan Usaha", "Revenue", 1);
  insertAccount.run("5000", "Beban", "Expense", 1);
  insertAccount.run("5100", "Beban Operasional", "Expense", 1);
}

const unitCount = db.prepare("SELECT COUNT(*) as count FROM business_units").get() as { count: number };
if (unitCount.count === 0) {
  db.prepare("INSERT INTO business_units (name, description) VALUES (?, ?)").run("Unit Perdagangan", "Perdagangan umum dan sembako");
  db.prepare("INSERT INTO business_units (name, description) VALUES (?, ?)").run("Unit Jasa", "Jasa pembayaran dan PPOB");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Dashboard Summary
  app.get("/api/dashboard", (req, res) => {
    try {
      // Calculate Total Kas (1110) + Bank (1120)
      const kasBank = db.prepare(`
        SELECT SUM(jd.debit - jd.credit) as balance
        FROM journal_details jd
        JOIN accounts a ON jd.account_id = a.id
        JOIN journals j ON jd.journal_id = j.id
        WHERE (a.code LIKE '1110%' OR a.code LIKE '1120%') AND j.status = 'Posted'
      `).get() as { balance: number };

      const aset = db.prepare(`
        SELECT SUM(jd.debit - jd.credit) as balance
        FROM journal_details jd
        JOIN accounts a ON jd.account_id = a.id
        JOIN journals j ON jd.journal_id = j.id
        WHERE a.type = 'Asset' AND j.status = 'Posted'
      `).get() as { balance: number };

      const kewajiban = db.prepare(`
        SELECT SUM(jd.credit - jd.debit) as balance
        FROM journal_details jd
        JOIN accounts a ON jd.account_id = a.id
        JOIN journals j ON jd.journal_id = j.id
        WHERE a.type = 'Liability' AND j.status = 'Posted'
      `).get() as { balance: number };

      const modal = db.prepare(`
        SELECT SUM(jd.credit - jd.debit) as balance
        FROM journal_details jd
        JOIN accounts a ON jd.account_id = a.id
        JOIN journals j ON jd.journal_id = j.id
        WHERE a.type = 'Equity' AND j.status = 'Posted'
      `).get() as { balance: number };

      const pendapatan = db.prepare(`
        SELECT SUM(jd.credit - jd.debit) as balance
        FROM journal_details jd
        JOIN accounts a ON jd.account_id = a.id
        JOIN journals j ON jd.journal_id = j.id
        WHERE a.type = 'Revenue' AND j.status = 'Posted'
      `).get() as { balance: number };

      const beban = db.prepare(`
        SELECT SUM(jd.debit - jd.credit) as balance
        FROM journal_details jd
        JOIN accounts a ON jd.account_id = a.id
        JOIN journals j ON jd.journal_id = j.id
        WHERE a.type = 'Expense' AND j.status = 'Posted'
      `).get() as { balance: number };

      const labaRugi = (pendapatan.balance || 0) - (beban.balance || 0);

      // Recent Transactions
      const recentTransactions = db.prepare(`
        SELECT j.id, j.date, j.reference, j.description, j.status,
               (SELECT SUM(debit) FROM journal_details WHERE journal_id = j.id) as amount
        FROM journals j
        ORDER BY j.date DESC, j.id DESC
        LIMIT 5
      `).all();

      res.json({
        totalKas: kasBank.balance || 0,
        totalAset: aset.balance || 0,
        totalKewajiban: kewajiban.balance || 0,
        totalModal: modal.balance || 0,
        labaRugi: labaRugi,
        recentTransactions
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Profile
  app.get("/api/profile", (req, res) => {
    try {
      const profile = db.prepare("SELECT * FROM bumdes_profile LIMIT 1").get();
      res.json(profile || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/profile", (req, res) => {
    const { name, address, village, district, city, established_year, director_name, treasurer_name, npwp, start_date } = req.body;
    const stmt = db.prepare(`
      UPDATE bumdes_profile 
      SET name = ?, address = ?, village = ?, district = ?, city = ?, established_year = ?, director_name = ?, treasurer_name = ?, npwp = ?, start_date = ?
      WHERE id = 1
    `);
    stmt.run(name, address, village, district, city, established_year, director_name, treasurer_name, npwp, start_date);
    res.json({ success: true });
  });

  // Accounts
  app.get("/api/accounts", (req, res) => {
    try {
      const accounts = db.prepare("SELECT * FROM accounts ORDER BY code ASC").all();
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/accounts", (req, res) => {
    const { code, name, type, parent_id } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)");
      const result = stmt.run(code, name, type, parent_id || null);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { code, name, type, parent_id } = req.body;
    try {
      const stmt = db.prepare("UPDATE accounts SET code = ?, name = ?, type = ?, parent_id = ? WHERE id = ? AND is_system = 0");
      const result = stmt.run(code, name, type, parent_id || null, id);
      if (result.changes === 0) {
        return res.status(400).json({ error: "Account not found or is a system account" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("DELETE FROM accounts WHERE id = ? AND is_system = 0");
      const result = stmt.run(id);
      if (result.changes === 0) {
        return res.status(400).json({ error: "Account not found or is a system account" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Business Units
  app.get("/api/units", (req, res) => {
    try {
      const units = db.prepare("SELECT * FROM business_units").all();
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/units", (req, res) => {
    const { name, description } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO business_units (name, description) VALUES (?, ?)");
      const result = stmt.run(name, description || null);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/units/:id", (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    try {
      const stmt = db.prepare("UPDATE business_units SET name = ?, description = ? WHERE id = ?");
      const result = stmt.run(name, description || null, id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/units/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("DELETE FROM business_units WHERE id = ?");
      const result = stmt.run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Journals
  app.get("/api/journals", (req, res) => {
    try {
      const journals = db.prepare(`
        SELECT j.*, u.name as unit_name,
               (SELECT SUM(debit) FROM journal_details WHERE journal_id = j.id) as total_amount
        FROM journals j
        LEFT JOIN business_units u ON j.unit_id = u.id
        ORDER BY j.date DESC, j.id DESC
      `).all();
      res.json(journals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/journals/:id", (req, res) => {
    try {
      const journal = db.prepare("SELECT * FROM journals WHERE id = ?").get(req.params.id);
      if (!journal) return res.status(404).json({ error: "Not found" });
      const details = db.prepare(`
        SELECT jd.*, a.code as account_code, a.name as account_name 
        FROM journal_details jd
        JOIN accounts a ON jd.account_id = a.id
        WHERE jd.journal_id = ?
      `).all(req.params.id);
      res.json({ ...journal, details });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/journals", (req, res) => {
    const { date, reference, description, unit_id, status, details } = req.body;
    
    // Validate debit = credit
    const totalDebit = details.reduce((sum: number, d: any) => sum + (Number(d.debit) || 0), 0);
    const totalCredit = details.reduce((sum: number, d: any) => sum + (Number(d.credit) || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: "Debit and Credit must be equal" });
    }

    const insertJournal = db.prepare("INSERT INTO journals (date, reference, description, unit_id, status) VALUES (?, ?, ?, ?, ?)");
    const insertDetail = db.prepare("INSERT INTO journal_details (journal_id, account_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)");
    
    const transaction = db.transaction(() => {
      const result = insertJournal.run(date, reference, description, unit_id || null, status || 'Draft');
      const journalId = result.lastInsertRowid;
      
      for (const d of details) {
        insertDetail.run(journalId, d.account_id, d.debit || 0, d.credit || 0, d.description || '');
      }
      return journalId;
    });

    try {
      const id = transaction();
      res.json({ id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/journals/:id/post", (req, res) => {
    const stmt = db.prepare("UPDATE journals SET status = 'Posted' WHERE id = ?");
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Reports - Ledger
  app.get("/api/reports/ledger", (req, res) => {
    try {
      const { account_id, start_date, end_date } = req.query;
      if (!account_id) return res.status(400).json({ error: "account_id is required" });

      // Calculate opening balance
      const openingBalanceRow = db.prepare(`
        SELECT SUM(jd.debit - jd.credit) as balance
        FROM journal_details jd
        JOIN journals j ON jd.journal_id = j.id
        WHERE jd.account_id = ? AND j.date < ? AND j.status = 'Posted'
      `).get(account_id, start_date) as { balance: number };
      
      const openingBalance = openingBalanceRow?.balance || 0;

      const transactions = db.prepare(`
        SELECT j.date, j.reference, j.description as journal_desc, jd.description as detail_desc, jd.debit, jd.credit
        FROM journal_details jd
        JOIN journals j ON jd.journal_id = j.id
        WHERE jd.account_id = ? AND j.date >= ? AND j.date <= ? AND j.status = 'Posted'
        ORDER BY j.date ASC, j.id ASC
      `).all(account_id, start_date, end_date);

      res.json({ openingBalance, transactions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reports - Balance Sheet
  app.get("/api/reports/balance-sheet", (req, res) => {
    try {
      const { as_of_date } = req.query;
      const date = as_of_date || new Date().toISOString().split('T')[0];

      const balances = db.prepare(`
        SELECT a.id, a.code, a.name, a.type, a.parent_id,
               SUM(jd.debit) as total_debit, SUM(jd.credit) as total_credit
        FROM accounts a
        LEFT JOIN journal_details jd ON a.id = jd.account_id
        LEFT JOIN journals j ON jd.journal_id = j.id AND j.date <= ? AND j.status = 'Posted'
        WHERE a.type IN ('Asset', 'Liability', 'Equity')
        GROUP BY a.id
        ORDER BY a.code ASC
      `).all(date);

      // Also need retained earnings (Laba Ditahan) from Revenue - Expense
      const pl = db.prepare(`
        SELECT a.type, SUM(jd.credit - jd.debit) as balance
        FROM accounts a
        JOIN journal_details jd ON a.id = jd.account_id
        JOIN journals j ON jd.journal_id = j.id AND j.date <= ? AND j.status = 'Posted'
        WHERE a.type IN ('Revenue', 'Expense')
        GROUP BY a.type
      `).all(date) as { type: string, balance: number }[];

      let currentEarnings = 0;
      pl.forEach(row => {
        if (row.type === 'Revenue') currentEarnings += row.balance;
        if (row.type === 'Expense') currentEarnings += row.balance; // Expense is credit-debit, so it's negative
      });

      res.json({ balances, currentEarnings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reports - Income Statement
  app.get("/api/reports/income-statement", (req, res) => {
    try {
      const { start_date, end_date } = req.query;

      const balances = db.prepare(`
        SELECT a.id, a.code, a.name, a.type, a.parent_id,
               SUM(jd.credit - jd.debit) as balance
        FROM accounts a
        JOIN journal_details jd ON a.id = jd.account_id
        JOIN journals j ON jd.journal_id = j.id AND j.date >= ? AND j.date <= ? AND j.status = 'Posted'
        WHERE a.type IN ('Revenue', 'Expense')
        GROUP BY a.id
        ORDER BY a.code ASC
      `).all(start_date, end_date);

      res.json({ balances });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

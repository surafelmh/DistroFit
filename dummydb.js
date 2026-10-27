const mysql = require('mysql2/promise');

async function main() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'distro_user',
      password: 'password123',
      database: 'distrofit_db',
      multipleStatements: true,
    });

    console.log('Connected to database successfully!\n');


    const query = 
    `
      DROP TABLE IF EXISTS users;

      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL
      );

      INSERT INTO users (name, email) VALUES
        ('Lisa', 'lisa@test.com'),
        ('Bob', 'bob@test.com');
    `
    ;
    await db.query(query);

    const [rows] = await db.query('SELECT * FROM users;');
    console.table(rows);

    await db.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.febnwdvhwzmpcgraznfs:0vY6gk9rPVEyhG70@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
  });

  try {
    await client.connect();

    await client.query("BEGIN");
    const result = await client.query(`
        SELECT
          c.email,
          s.id AS subscription_id,
          s.status,
          s.provider_status,
          s.current_period_end,
          sp.name AS plan_name,
          sp.duration_months
        FROM subscriptions s
        JOIN clients c ON c.id = s.client_id
        JOIN subscription_plans sp ON sp.id = s.plan_id
        WHERE c.email = $1
      `, ["arvind366a@gmail.com"]);
      
      console.table(result.rows);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database error:", error);
  } finally {
    await client.end();
  }
}

main();
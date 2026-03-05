import {neon} from "@neondatabase/serverless";

import "dotenv/config";
//this will work bc of type: module in package.json
//loads environment variables from .env file into process.env

export const sql = neon(process.env.DATABASE_URL);
//creates a Neon client using the DATABASE_URL from environment variables
//sql can be used to interact with the PostgreSQL database
//@neondatabase/serverless is a package that provides a serverless client for Neon, a serverless Postgres database
//it allows connecting to Neon databases in serverless environments like Vercel, Netlify, AWS Lambda

export async function initDB() {
    try {
        await sql `
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(255) NOT NULL,
                created_at DATE NOT NULL DEFAULT CURRENT_DATE
            )
        `;
        console.log("✅ Database initialized");
    } catch (error) {
        console.log("❌ Error creating transactions table:", error);
        process.exit(1); // Stop server if DB setup fails
    }
}
import express from 'express';
import dotenv, {
    parse
} from 'dotenv';
import cors from 'cors';
import rateLimiter from './middleware/rateLimiter.js';

dotenv.config();
// Loads variables from .env file into process.env

const app = express();
const PORT = process.env.PORT || 5001;

import transactionsRoute from './routes/transactionsRoute.js';

app.use(cors());
app.use(rateLimiter);
/* 
  ---------------------------
  DATABASE INITIALIZATION
  ---------------------------
  This function runs ONCE when the server starts.
  It ensures the 'transactions' table exists.
*/

//import database function to create table if not exists
import {
    initDB
} from './config/db.js';

/*
  ---------------------------
  BODY PARSER MIDDLEWARE
  ---------------------------
  This is CRITICAL.
  Without this, req.body will ALWAYS be undefined.

  It reads incoming JSON and converts it into a JS object.
*/
app.use(express.json());

/*
  ---------------------------
  REQUEST LOGGER MIDDLEWARE
  ---------------------------
  This runs for EVERY request.
  It helps us see which endpoint is being hit.
*/
app.use((req, res, next) => {
    console.log(`➡️  ${req.method} ${req.url}`);
    next(); // VERY IMPORTANT — allows request to continue
});

// Call the function to initialize the database and create the table if it doesn't exist

/*
  ---------------------------
  ROOT ENDPOINT
  ---------------------------
  Used just to check if server is alive.
*/
app.get('/', (req, res) => {
    res.send('The server is up and running yay!');
});

app.use("/api/transactions", transactionsRoute);
// Mount transactions routes at /api/transactions
//app.use ("/api/products", productRoute);
// Mount product routes at /api/products


/*
  ---------------------------
  START SERVER
  ---------------------------
  Database initializes first,
  then server starts listening.
*/
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
});

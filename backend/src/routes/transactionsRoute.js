import express from 'express';
import {
    sql
} from '../config/db.js';


import {
    getTransactionsByUserID,
    createTransaction,
    deleteTransaction,
    getSummaryByUserID      
} from '../CONTROLLERS/transactionsControllers.js';


const router = express.Router();

//since each route has /api/transactions, 

router.get('/', (req, res) => {
    res.send('The server is up and running yay!');
});

//summarize the user's transactions by balance, income, expenses
// MUST be before /:user_id so Express doesn't treat "summary" as a user_id
router.get('/summary/:user_id', getSummaryByUserID);

//crete a fetch endpoint to get all transactions for a user
router.get('/:user_id', getTransactionsByUserID);

//delete a transaction by id (not user_id since we want to delete a specific transaction)
//earlier it worked only for string type
router.delete('/:id', deleteTransaction);

/*
          ---------------------------
          CREATE TRANSACTION API
          ---------------------------
          This handles POST requests with JSON body.
        */
router.post('/', createTransaction);

export default router;

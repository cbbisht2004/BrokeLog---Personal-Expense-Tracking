import {
    sql
} from '../config/db.js';


export async function getTransactionsByUserID (req,res) {
    try {
        const {
            user_id
        } = req.params;

        console.log(`📥 Fetching transactions for user_id: ${user_id}`);

        //assign to array of transactions
        const transactions = await sql `
                    SELECT * FROM transactions
                    WHERE user_id = ${user_id} ORDER BY created_at DESC
                `;
        res.status(200).json(transactions);

    } catch (error) {
        console.error("❌ Error fetching transactions:");
        console.error(error.message);
        console.error(error.stack);

    }
}

export async function createTransaction (req, res) {
        
    try {
        /*
          Destructure values from request body.
          Example body expected:
          {
            "title": "Food",
            "amount": 200,
            "category": "Expense",
            "user_id": "user123"
          }
        */
        const {
            title,
            amount,
            category,
            user_id
        } = req.body;

        // Log what we ACTUALLY received (very useful for debugging)
        console.log("📦 Incoming request body:", req.body);

        /*
          Validation check:
          - title, category, user_id must exist
          - amount must not be undefined or null
        */
        if (!title || !category || !user_id || amount == null) {
            return res.status(400).json({
                error: "Missing required fields",
                received: req.body
            });
        }

        /*
          Insert data into database safely.
          sql`` automatically prevents SQL injection.
        */
        const transaction = await sql `
            INSERT INTO transactions (title, amount, category, user_id)
            VALUES (${title}, ${amount}, ${category}, ${user_id})
            RETURNING *;
        `;

        console.log("✅ Transaction created:", transaction);

        // Send success response
        return res.status(201).json({
            message: "Transaction created successfully",
            transaction
        });

    } catch (error) {
        console.error("❌ Error creating transaction:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

export async function deleteTransaction (req, res) {
{
    try {
        const {
            id
        } = req.params;

        //console.log(`type of id: ${typeof id} with value: ${id}`);
        //check for valid id type (should be a number)
        if (isNaN(parseInt(id))) {
            //parseInt returns NaN for non-numeric strings, so we check for that
            res.status(400).json({
                message: "Invalid transaction id type. Expected a number."
            });
            return;
        } //due to this, the server doesn't crash when the sql query receives invalid input



        console.log(`🗑️ Deleting transaction with id: ${id}`);
        const deletedTransaction = await sql `
                    DELETE FROM transactions
                    WHERE id = ${id} RETURNING *;
                `;
        if (deletedTransaction.length === 0) {
            res.status(404).json({
                message: "Transaction not found"
            });
            return;
        }
        //else transaction was deleted successfully 
        res.status(200).json({
            message: `Transaction with "id" ${id} deleted successfully`
        });
    } catch (error) {
        console.log("❌ Error deleting transaction:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}
}

export async function getSummaryByUserID (req, res)
{
    try {
        const {
            user_id
        } = req.params;
        console.log(`📊 Summarizing transactions for user_id: ${user_id}`);

        const result = await sql `
            SELECT
                COALESCE(SUM(amount), 0) AS balance,
                COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) AS expense
            FROM transactions
            WHERE user_id = ${user_id};
        `;

        res.status(200).json(result[0]);

    } catch (error) {
        console.error("❌ Error summarizing transactions:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}
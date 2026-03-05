//react custom hook file
import {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';

const API_URL = 'http://172.17.13.117:5001/api/transactions';

export const useTransactions = (userId) => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({balance: 0, income: 0, expenses: 0});
    const [loading, setLoading] = useState(true);
    //what this does is fetches the transactions for a user and sets the transactions state, also fetches the summary and sets the summary state, and sets loading to false when done

    const fetchTransactions = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/${userId}`);
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }, [userId]);
    //we use this useCallback to memoize the function so that it doesn't get recreated on every render,
    //which can cause infinite loops in useEffect if we put it there (Cache)

    //we'll get the summary now
    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/summary/${userId}`);
            const data = await response.json();
            setSummary(data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    }, [userId]);

    const loadData = useCallback(async () => {
        if (!userId) return; //if userId is not available, don't fetch
        setLoading(true);

        try {
            await Promise.all([fetchTransactions(), fetchSummary()]);
        }
        catch (error) {
            console.error('Error fetching summary:', error);
        }
        finally {
            setLoading(false);
        }
    }, [userId, fetchTransactions, fetchSummary]);

    //do not call fetchTransactions and fetchSummary directly in useEffect,
    //  because they are async functions and useEffect does not expect that, 
    // so we create a new function loadData that calls them and then we call 
    // loadData in useEffect
    //promise.all allows us to run both fetchTransactions and fetchSummary in parallel,
    //and wait for both to finish before setting loading to false

    const deleteTransaction = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete transaction');
            //after deleting, we need to refresh the transactions and summary, so we call loadData
            await loadData();
            Alert.alert('Success', 'Transaction deleted successfully');
        }
        catch (error) {
            console.error('Error deleting transaction:', error);
            Alert.alert('Error', error.message || 'Failed to delete transaction');
        }
    };

    return {
        transactions,
        summary,
        loading,
        deleteTransaction,
        loadData
    };
};



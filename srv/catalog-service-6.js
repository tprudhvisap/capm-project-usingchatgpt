const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');
const axios = require('axios');

// Program: Add Stock Management Feature
// Add a new stock field to the Books entity.
// Create an action to update stock when a book is sold.
// Create an action to restock books directly using API input.
// Return an error if stock falls below zero.

module.exports = (srv) => {
    const { Books, Authors } = srv.entities;

    srv.on('importBooks', async (req) => {
        const { isbn } = req.data;
        if (!isbn) req.error(401, 'ISBN is required');

        try {
            // ✅ Step 1: Fetch book data from Open Library API
            const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
            const { title, authors, number_of_pages } = response.data;

            if (!title || !authors) {
                req.error(404, `Book not found for ISBN: ${isbn}`);
            }

            let author = 'Unknown';
            let authorID;

            // ✅ Step 2: Fetch author details if available
            if (authors && authors.length > 0 && authors[0].key) {
                const authorKey = authors[0].key;
                console.log(`📖 Fetching author details from key: ${authorKey}`);

                const authorResponse = await axios.get(`https://openlibrary.org${authorKey}.json`);
                author = authorResponse.data.name || 'Unknown';

                // ✅ Step 3: Check if author exists or create it
                const existingAuthor = await SELECT.one.from(Authors).where({ name: author });
                if (existingAuthor) {
                    authorID = existingAuthor.ID;
                } else {
                    authorID = cds.utils.uuid();
                    await INSERT.into(Authors).entries({ ID: authorID, name: author });
                }
            }

            // ✅ Step 4: Check if book exists, create if not
            const existingBook = await SELECT.one.from(Books).where({ title });
            if (!existingBook) {
                await INSERT.into(Books).entries({
                    ID: cds.utils.uuid(),
                    title,
                    price: 20.0,
                    author: { ID: authorID } // ✅ Fixed association field
                });
                console.log(`✅ Imported book: ${title}`);
                return 1;
            } else {
                req.error(400, `Book '${title}' already exists`);
            }
        } catch (error) {
            console.error(`❌ Import failed:`, error);
            req.error(500, `Failed to import book: ${error.message}`);
        }
    });

    srv.on('updateStock', async(req)=>{
        const {bookID, quantity} = req.data;

        const book = await SELECT.one.from(Books).where({ID: bookID});
        if(!book) req.error(400, `Book with ID ${bookID} is not found`);

        const oldStock = book.stock;
        const newStock = book.stock - quantity;
        if (newStock < 0) {
            req.error(400, `Not enough stock for '${book.title}'`);
        }

        await UPDATE(Books).set({stock: newStock}).where({ID: bookID});
        await srv.emit ('onStockUpdate',{
            bookID: bookID,
            oldStock: oldStock,
            newStock: newStock
        });
        console.log(`✅ Stock updated for '${book.title}': New stock = ${newStock}`);
        return newStock;
    })

    srv.on('restockBook', async(req)=>{
        const {bookID, quantity} = req.data;

        if (quantity <= 0) req.error(400, 'Invalid quantity');

        const book = await SELECT.one.from(Books).where({ID: bookID});
        if(!book) req.error(400, `Book with ID ${bookID} is not found`);

        const oldStock = book.stock;
        const newStock = book.stock + quantity;
        
        await UPDATE(Books).set({stock: newStock}).where({ID: bookID});
        await srv.emit ('onStockUpdate',{
            bookID: bookID,
            oldStock: oldStock,
            newStock: newStock
        });
        console.log(`✅ Restocked '${book.title}': New stock = ${newStock}`);
        return newStock;
    })

    srv.on('onStockUpdate', (event)=>{
        const { bookID, oldStock, newStock } = event.data || {};
        console.log(`📢 Stock updated for bookID: ${bookID}`);
        console.log(`💰 Old Stock: ${oldStock}, New Stock: ${newStock}`);
    })
};

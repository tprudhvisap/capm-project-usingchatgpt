const cds = require('@sap/cds');
const axios = require('axios');

module.exports = (srv)=>{
    const { Books } = srv.entities;
    // Custom action to apply discount
    srv.on('discount', async(req)=>{
        const { bookID } = req.data;

        // Read Book Data
        const book = await SELECT.one.from(Books).where({ ID: bookID });
        if(book){
            const newPrice = Math.round(book.price * 0.9 * 100) / 100;
            await UPDATE(Books).set({ price: newPrice }).where ({ ID: bookID });
            console.log(`Discount applied: New price = ${newPrice}`);
            return 1; // Success status
        }else {
            req.error(404, `Book with ID ${bookID} not found`);
        };
    })

    // Action to import books from External API
    srv.on('importBooks', async(req)=>{
        const{isbn} = req.data;
        if(!isbn) req.error(401, 'ISBN is Required');
        try {
             // Fetch book data from Open Library API
             const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
             const { title, authors, number_of_pages } = response.data;
 
             if (!title || !authors) {
                 req.error(404, `Book not found for ISBN: ${isbn}`);
             }
             // Insert into the database
            // const author = authors[0]?.name || 'Unknown';
            let author = 'Unknown';

            // ✅ Step 2: Check if authors array exists and has a key
            if (authors && authors.length > 0 && authors[0].key) {
                const authorKey = authors[0].key;
                // console.log (number_of_pages);
                console.log(`Fetching author details from key: ${authorKey}`);

                // ✅ Step 3: Fetch author details
                const authorResponse = await axios.get(`https://openlibrary.org${authorKey}.json`);
                author = authorResponse.data.name || 'Unknown';
            }
            const existingBook = await SELECT.one.from(Books).where({ title });

            if (!existingBook) {
                await INSERT.into(Books).entries({
                    ID: cds.utils.uuid(),
                    title,
                    author,
                    price: 20.0 // Default price
                });
                console.log(`Imported book: ${title}`);
                return 1;
            } else {
                req.error(400, `Book '${title}' already exists`);
            }
        } catch (error) {
            console.error(error);
            req.error(500, `Failed to import book: ${error.message}`);
        }
    })
}
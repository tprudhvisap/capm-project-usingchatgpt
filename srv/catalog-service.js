const cds = require('@sap/cds');
const axios = require('axios');

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
};

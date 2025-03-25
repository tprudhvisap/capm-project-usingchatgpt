const cds = require('@sap/cds');

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
}
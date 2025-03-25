const cds = require('@sap/cds');
const sendEmail = require('./email-service');

module.exports = (srv)=>{
    const { Books } = srv.entities;
    // Custom action to apply discount
    srv.on('discount', async(req)=>{
        const { bookID } = req.data;

        // Read Book Data
        const book = await SELECT.one.from(Books).where({ ID: bookID });
        if(book){
            const oldPrice = book.price;
            const newPrice = Math.round(book.price * 0.9 * 100) / 100;
            await UPDATE(Books).set({ price: newPrice }).where ({ ID: bookID });
            console.log(`Discount applied: Old Price=${oldPrice}, New Price = ${newPrice}`);
    // ✅ Emit the custom event
             await srv.emit('onPriceUpdate', {
                bookID: bookID,
                oldPrice: oldPrice,
                newPrice: newPrice
            });
            return 1; // Success status
        }else {
            req.error(404, `Book with ID ${bookID} not found`);
        };
    })
    // ✅ Handle the custom event
    srv.on('onPriceUpdate', async(event) => {
    // console.log(event);
        const { bookID, oldPrice, newPrice } = event.data || {};
        console.log(`📢 Price updated for bookID: ${bookID}`);
        console.log(`💰 Old price: ${oldPrice}, New price: ${newPrice}`);

    // ✅ Send Email Notification
        const emailText = `The price for book with ID ${bookID} has changed from $${oldPrice} to $${newPrice}.`;
        await sendEmail('recipient@example.com', 'Book Price Updated', emailText);

    // ✅ Simulate sending a notification
        console.log(`🚀 Notification sent for book ${bookID}`);
    });
}
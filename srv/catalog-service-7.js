const cds = require('@sap/cds');
const axios = require('axios');

// Implement Book Reservation System
/* 1. Allow users to reserve a book if it's in stock.
2. Reduce the stock when a reservation is made.
3. If the stock is unavailable, return an error.
4. Add a status field to track if a reservation is pending or completed.
5. Create an action to cancel a reservation and restore stock.*/

module.exports = (srv) => {
    const { Books, Authors, Reservations } = srv.entities;

    // ✅ Action to reserve a book
    srv.on('reserveBook', async(req)=>{
        const {bookID, quantity} = req.data;
        if (quantity<0) req.error(400,'Invalid Quantity');
        
        const book = await SELECT.one.from(Books).where({ID: bookID});
        if(!book) req.error(400,`Book with ID ${bookID} is not found`);

        if(book.stock<quantity) req.error(400,`Not Enough Stock for Book ID ${bookID}`);

        // Reduce Stock
        const newStock = book.stock-quantity;
        await UPDATE(Books).set({stock: newStock}).where({ID: bookID});

        //Create Reservation
        const reservationID = cds.utils.uuid();

        await INSERT.into(Reservations).entries({
            ID: reservationID,
            book_ID: bookID,
            quantity,
            status: 'PENDING'
        });

        console.log(`✅ Reserved '${book.title}': Reserved = ${quantity}, Remaining stock = ${newStock}`);
        return reservationID;
    });

    //// ✅ Action to cancel a reservation
    srv.on('cancelReservation', async(req)=>{
        const{ reservationID } = req.data;
        const reservation = await SELECT.one.from(Reservations).where({ID: reservationID});

        if(!reservation) return req.error(400,'Reservation not Found');

        if(reservation.status != 'PENDING') return req.error(400,'Reservation already Completed');

        // Restore Stock
        const book = await SELECT.one(Books).where({ID: reservation.book_ID});
        if(book){
            const restoreStock = book.stock + reservation.quantity;
            await UPDATE(Books).set({stock: restoreStock}).where({ID: book.ID});
            console.log(`✅ Stock restored for '${book.title}': New stock = ${restoreStock}`);
        }

        // Update reservation status
        await UPDATE(Reservations).set({ status: 'COMPLETED' }).where({ ID: reservationID });

        console.log(`✅ Reservation with ID ${reservationID} canceled`);
        return reservationID;
    })
};

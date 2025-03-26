const cds = require('@sap/cds');

/* Implement Auto-Stock Replenishment:
Add a minimum stock level for each book.
If stock drops below this level after a sale, automatically create a replenishment request.
Create a separate Replenishments entity to store replenishment requests.
Create an action to approve or reject replenishment:
Approve → Increase stock.
Reject → Mark replenishment as rejected.
*/
module.exports = (srv) => {
    const { Books, Replenishments } = srv.entities;

    // ✅ Automatically create replenishment request if stock drops below minimum
    srv.before('UPDATE', Books, async (req) => {
        const { ID, stock } = req.data;

        if (stock !== undefined) {
            const book = await SELECT.one.from(Books).where({ ID });
            if (book && stock < book.minStockLevel) {
                const existingRequest = await SELECT.one.from(Replenishments).where({
                    book_ID: ID,
                    status: 'PENDING'
                });

                if (!existingRequest) {
                    console.log(`⚠️ Stock below minimum for '${book.title}' — Creating replenishment request`);
                    await INSERT.into(Replenishments).entries({
                        ID: cds.utils.uuid(),
                        book_ID: ID,
                        quantity: book.minStockLevel - stock,
                        status: 'PENDING'
                    });
                }
            }
        }
    });

    // ✅ Approve Replenishment Request
    srv.on('approveReplenishment', async (req) => {
        const { replenishmentID } = req.data;

        const replenishment = await SELECT.one.from(Replenishments).where({ ID: replenishmentID });
        if (!replenishment) req.error(404, `Replenishment with ID ${replenishmentID} not found`);

        if (replenishment.status !== 'PENDING') {
            req.error(400, `Replenishment already processed`);
        }

        // Update stock
        await UPDATE(Books).set({ stock: { '+=': replenishment.quantity } }).where({ ID: replenishment.book_ID });

        // Update replenishment status
        await UPDATE(Replenishments).set({ status: 'APPROVED' }).where({ ID: replenishmentID });

        console.log(`✅ Approved replenishment for book ID ${replenishment.book_ID}`);
        return replenishmentID;
    });

    // ✅ Reject Replenishment Request
    srv.on('rejectReplenishment', async (req) => {
        const { replenishmentID } = req.data;

        const replenishment = await SELECT.one.from(Replenishments).where({ ID: replenishmentID });
        if (!replenishment) req.error(404, `Replenishment with ID ${replenishmentID} not found`);

        if (replenishment.status !== 'PENDING') {
            req.error(400, `Replenishment already processed`);
        }

        // Update replenishment status to REJECTED
        await UPDATE(Replenishments).set({ status: 'REJECTED' }).where({ ID: replenishmentID });

        console.log(`❌ Rejected replenishment for book ID ${replenishment.book_ID}`);
        return replenishmentID;
    });
};

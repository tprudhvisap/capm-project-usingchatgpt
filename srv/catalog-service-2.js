const cds = require('@sap/cds');

module.exports = (srv)=>{
    const { Books } = srv.entities;
    srv.before('CREATE',Books,(req)=>{
        const{ title, author, price } = req.data;
        if (!title) {
            req.error(400, 'Title is Required' )
        }
        if (!author) {
            req.error(400, 'Author is Required' )
        }
        if (price < 0) {
            req.error(400, 'Price Cannot be Negative' )
        }
    })
    srv.before('UPDATE', Books, (req) => {
        const { title, author, price } = req.data;

        if (!title) req.error(400, 'Title is required');
        if (!author) req.error(400, 'Author is required');
        if (price < 0) req.error(400, 'Price cannot be negative');
    });
}
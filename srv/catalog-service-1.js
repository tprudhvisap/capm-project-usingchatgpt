const cds = require('@sap/cds');

module.exports = (srv)=>{
    const { Books } = srv.entities;
    // console.log(Books);
    srv.before('CREATE', Books, (req) => {
        // console.log(req);
        if (req.data.price < 0) {
            req.data.price = 0;
            req.data.title = 'Test Book Negative';
            console.log(`Negative price detected. Setting to 0.`);
        }
    });
    srv.before('UPDATE', Books,(req)=>{
        if (req.data.price < 0) {
            req.data.price = 0;
            req.data.title = 'Test Book Negative';
            console.log(`Negative price detected. Setting to 0.`);
        }
    })
}
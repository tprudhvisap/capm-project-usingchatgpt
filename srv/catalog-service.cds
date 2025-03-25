using { bookshop as db } from '../db/schema';

// @requires: 'authenticated-user'
service CatalogService {
    entity Books as projection on db.Books;
    entity Authors as projection on db.Authors;

    // @requires: 'admin'
    action discount(bookID: UUID) returns Integer;

    action importBooks(isbn: String) returns Integer;

    event onPriceUpdate {
        bookID: UUID;
        oldPrice: Decimal;
        newPrice: Decimal;
    }
}

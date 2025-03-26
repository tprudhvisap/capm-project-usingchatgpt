namespace bookshop;

entity Books {
    key ID    : UUID;
    title     : String;
    price     : Decimal;
    stock     : Integer;
    author    : Association to Authors;
}

entity Authors {
    key ID: UUID;
    name  : String;
}


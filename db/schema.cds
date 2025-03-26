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

entity Reservations {
    key ID  :   UUID;
    book    :   Association to Books;
    quantity:   Integer;
    status  :   String; // Pending or Completed
}

entity Replenishments {
  key ID     : UUID;
  book       : Association to Books;
  quantity   : Integer;
  status     : String; // "PENDING", "APPROVED", "REJECTED"
}


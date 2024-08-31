module data {
  type Data {
    required key: str;
    required value: str {
      default := "";
    };

    constraint exclusive on ((.key));
    index on ((.key));
  }
}

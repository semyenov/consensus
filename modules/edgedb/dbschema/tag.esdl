module tag {
  abstract type Taggable {
    multi link tags -> Tag;
  }

  type Tag extending default::BaseObject {
    constraint exclusive on (.name);
  }
}

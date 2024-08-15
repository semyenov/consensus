using extension auth;

module default {
  global current_user := (
    assert_single((
      select User { id, name }
      filter .identity = global ext::auth::ClientTokenIdentity
    ))
  );

  type User {
    required name: str;
    required identity: ext::auth::Identity;
  }

  type Blogpost {
    property content: str {
      default := 'My blog post content.';
    };
    property title: str {
      default := 'My blog post';
    };
    required author: User;

    access policy author_has_full_access
      allow all
      using (.author ?= global current_user);

    access policy others_read_only
      allow select;
  }
}

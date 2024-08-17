CREATE MIGRATION m1lba6lrked3zydr3677pzssse2nk4eafl4wnvqizk3fexu3ucbn5q
    ONTO initial
{
  CREATE EXTENSION pgcrypto VERSION '1.3';
  CREATE EXTENSION auth VERSION '1.0';
  CREATE TYPE default::User {
      CREATE REQUIRED LINK identity: ext::auth::Identity;
      CREATE REQUIRED PROPERTY name: std::str;
  };
  CREATE GLOBAL default::current_user := (std::assert_single((SELECT
      default::User {
          id,
          name
      }
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
  CREATE TYPE default::Issue {
      CREATE REQUIRED LINK author: default::User;
      CREATE ACCESS POLICY author_has_full_access
          ALLOW ALL USING ((.author ?= GLOBAL default::current_user));
      CREATE ACCESS POLICY others_read_only
          ALLOW SELECT ;
      CREATE PROPERTY content: std::str {
          SET default := 'My blog post content.';
      };
      CREATE PROPERTY title: std::str {
          SET default := 'My blog post';
      };
  };
};

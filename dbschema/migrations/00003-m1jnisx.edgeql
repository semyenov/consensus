CREATE MIGRATION m1jnisxjcnbjymbi2bgdwwsk5ed6iaqowais2qpcobvxribwzfpm2q
    ONTO m1usy7n5dy4h6pugqaqu76dvxyazpv7gedsrvayqmz52if2ojplgxq
{
  ALTER TYPE default::Issue {
      ALTER LINK author {
          SET default := (GLOBAL default::current_user);
      };
      ALTER PROPERTY content {
          SET default := 'My super blog post.';
      };
      CREATE PROPERTY description: std::str {
          SET default := 'My blog post description.';
      };
      ALTER PROPERTY title {
          SET default := 'My blog super blog post title.';
      };
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK posts: default::Issue {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
};

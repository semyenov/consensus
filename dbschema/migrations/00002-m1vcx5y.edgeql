CREATE MIGRATION m1vcx5yblws3y6szee3wx3rhuqjk4xd3zxnhard3w7m4xdxja4t7ua
    ONTO m1w3ye5c5kes4futtaq5zzmirewzplxaskxzn7yakpvfousdp2cyha
{
  ALTER TYPE user::User {
      DROP ACCESS POLICY project_owner_can_select;
  };
  ALTER TYPE user::User {
      DROP ACCESS POLICY user_can_select;
  };
  ALTER TYPE user::User {
      CREATE ACCESS POLICY user_has_full_access
          ALLOW ALL USING ((.identity ?= GLOBAL ext::auth::ClientTokenIdentity));
  };
};

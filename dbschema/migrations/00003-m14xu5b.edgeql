CREATE MIGRATION m14xu5brfmo5cp7q7rzu3tcrwamlbt664gzfnfh2d3rdjllg2igfba
    ONTO m1vcx5yblws3y6szee3wx3rhuqjk4xd3zxnhard3w7m4xdxja4t7ua
{
  ALTER TYPE user::User {
      DROP ACCESS POLICY user_has_full_access;
  };
};

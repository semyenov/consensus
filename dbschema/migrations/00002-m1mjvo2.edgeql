CREATE MIGRATION m1mjvo2zxiyjk26phnhlwp4hcx3onq4zswelwdyp4rxcir5jkcnypa
    ONTO m14catbjp727zeq25rjqvmpbjy63utzdbovzowtw5qj4kwvy7x2toq
{
  ALTER GLOBAL default::current_user USING (std::assert_single((SELECT
      default::User {
          id,
          name,
          email,
          identity
      }
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
};

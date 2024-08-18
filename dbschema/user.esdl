module user {
  # User type representing a system user
  type User extending default::BaseObject, default::Auditable {
    # Required properties
    required email: str {
      constraint exclusive;  # Ensure unique email addresses
    }
    required identity: ext::auth::Identity;

    # Links
    multi link projects := .<owner[is project::Project];
    multi link assigned_issues := .<assignee[is issue::Issue];
    multi link teams := .<members[is project::Team];

    # Computed properties
    property total_issues := count(.assigned_issues);
    property workload := count(.assigned_issues filter .status != issue::IssueStatus.Closed);

    # Indexes
    index on (.identity);
    index on (.email);

    # Access policies
    access policy user_can_select
      allow select
      using (.identity ?= global ext::auth::ClientTokenIdentity);

    access policy project_owner_can_select
      allow select
      using (.<owner[is project::Project] ?= global user::current_user);
  }

  global current_user := (
    assert_single((
      select User { id, name }
      filter .identity = global ext::auth::ClientTokenIdentity
    ))
  );
}
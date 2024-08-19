module default {
  abstract type BaseObject extending std::Object {
    required name: str;
    required description: str;

    index on (.name);
  }

  abstract type Auditable {
    required created_at: datetime {
      default := datetime_current();
    }
    required updated_at: datetime {
      default := datetime_current();
    }
  }

   # User type representing a system user
  type User extending BaseObject, Auditable {
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
  }

  global current_user := (
    assert_single((
      select User { id, name, email, identity }
      filter .identity = global ext::auth::ClientTokenIdentity
    ))
  );
}

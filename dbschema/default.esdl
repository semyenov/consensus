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
    multi link posts -> Issue {
      on source delete delete target;
    }
  }

  enum Status {
    open,
    closed,
    merged,
    reopened,
    locked,
    unlocked,
    labeled,
    unlabeled,
    milestoned,
    demilestoned,
  }

  enum MilestoneStatus {
    planned,
    in_progress,
    completed,
    overdue,
  }

  type Milestone {
    required name: str;
    required start_date: datetime;
    required due_date: datetime;
    required status: MilestoneStatus;
    multi link issues -> Issue {
      on source delete delete target;
    }
  }

  type Issue {
    property content: str {
      default := 'Issue content.';
    };
    property description: str {
      default := 'Issue description.';
    };
    property title: str {
      default := 'Issue title.';
    };
    required author: User {
      default := global current_user;
    };
    required status: Status;
    optional link labels -> Label {
      on source delete delete target;
    }
    required link milestone -> Milestone {
      on source delete delete target;
    }
    optional link assignee -> User {
      on source delete delete target;
    }
    optional link comments -> Comment {
      on source delete delete target;
    }
    property resolution_notes: str;
    property date_resolved: datetime;
    access policy author_has_full_access
      allow all
      using (.author ?= global current_user);
    access policy others_read_only
      allow select;
  }
}

using extension auth;

module default {
  type User {
    required name: str;
    required identity: ext::auth::Identity;
    multi link projects -> Project {
      # On deleting a User, delete all associated Projects
      on source delete delete target;
    };
  }

  global current_user := (
    # Fetch the current user based on the provided auth token
    assert_single((
      select User { id, name }
      filter .identity = global ext::auth::ClientTokenIdentity
    ))
  );

  type Project {
    # Project name
    required name: str;
    # Project description
    required description: str;
    # User who owns the project
    required link owner -> User;
    multi link issues -> Issue {
      # On deleting a Project, delete all associated Issues
      on source delete delete target;
    }
  }

  # Enum to represent various statuses that an Issue can have
  scalar type Status extending enum<Open, Closed, Merged, Reopened,
    Locked, Unlocked, Labeled, Unlabeled, Milestoned, Demilestoned>;

  # Enum to represent status of a Milestone
  scalar type MilestoneStatus extending enum<
    Planned, InProgress, Completed, Overdue>;

  type Budget {
    # Total amount allocated for the budget
    required total_amount: float64;
    required remaining_balance: float64 {
      # Remaining balance initialized to total amount
      default := .total_amount;
    }
    # Associated project
    required link project -> Project;
  }

  type Expense {
    # Amount spent
    required amount: float64;
    # Description of expense
    required description: str;
    # Associated budget
    required link budget -> Budget;
  }

  type Payment {
    # Amount paid
    required amount: float64;
    # Description of payment
    required description: str;
    # User who receives payment
    required link recipient -> User;
    # Related issue
    required link associated_issue -> Issue;
  }

  type Milestone {
    # Name of the milestone
    required name: str;
    # Start date of the milestone
    required start_date: datetime;
    # Due date of the milestone
    required due_date: datetime;
    # Status of the milestone
    required status: MilestoneStatus;
    multi link issues -> Issue {
      # On deleting a Milestone, delete all linked Issues
      on source delete delete target;
    }
    # Associated budget
    required link budget -> Budget;
  }

  type Label {
    # Label name
    required name: str;
    # Description of the label
    required description: str;
    # Color code of the label
    required color: str;
    optional multi link issues -> Issue;
  }

  type Issue {
    property content: str {
      # Default content of the issue
      default := 'Issue content.';
    };
    property description: str {
      # Default description of the issue
      default := 'Issue description.';
    };
    property title: str {
      # Default title of the issue
      default := 'Issue title.';
    };
    required link author -> User {
      # Default author is the current user
      default := global current_user;
    };
    # Status of the issue
    required status: Status;
    optional multi link labels -> Label {
      # On deleting an Issue, delete associated Labels
      on source delete delete target;
    }
    # Associated milestone
    required link milestone -> Milestone;
    optional link assignee -> User;
    optional multi link comments -> Comment {
      # On deleting an Issue, delete associated Comments
      on source delete delete target;
    }
    # Notes on how the issue was resolved
    property resolution_notes: str;
    # Date when the issue was resolved
    property date_resolved: datetime;
    access policy author_has_full_access
      allow all
      # Full access to the author
      using (.author ?= global current_user);
    access policy others_read_only
    # Read-only access to others
      allow select;
  }

  type Comment {
    # Content of the comment
    required content: str;
    # Date when the comment was created
    required created_at: datetime;
    # Author of the comment
    required link author -> User;
    # Related issue
    required link issue -> Issue;
  }
}

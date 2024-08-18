using extension auth;
using extension pgvector;

module default {
  abstract type NamedAndDescribed {
    required name: str;
    required description: str;
    index on (.name);
  }

  abstract type Timestamped {
    required created_at: datetime {
      default := datetime_current();
    }
    required updated_at: datetime {
      default := datetime_current();
    }
  }

  abstract type Financial {
    required amount: decimal;
    constraint expression on (.amount >= 0);
  }

  abstract type Categorized {
    property category: str;
    index on (.category);
  }

  abstract type Titled {
    required property title: str;
  }

  abstract type Statused {
    required property status: str;
    index on (.status);
  }

  abstract type VectorSearchable {
    required embedding: ext::pgvector::vector<1536>;
  }

  abstract type Taggable {
    multi link tags -> Tag;
  }

  type Tag extending NamedAndDescribed {
    constraint exclusive on (.name);
  }

  type User extending Timestamped, NamedAndDescribed {
    required email: str;
    required identity: ext::auth::Identity;
    multi link projects -> Project {
      on source delete delete target;
    }
    multi link assigned_issues -> Issue;
    property total_issues := count(.assigned_issues);
    constraint exclusive on (.name);
    constraint exclusive on (.email);
    index on (.email);
    multi link teams := .<members[is Team];
    property workload := count(.assigned_issues filter .status != IssueStatus.Closed);
  }

  global current_user := (
    assert_single((
      select User { id, name }
      filter .identity = global ext::auth::ClientTokenIdentity
    ))
  );

  scalar type ProjectStatus extending enum<Active, Archived, Completed>;

  type Project extending Timestamped, NamedAndDescribed, Statused, VectorSearchable, Taggable {
    multi link issues -> Issue {
      on source delete delete target;
    }
    overloaded required property status: ProjectStatus {
      default := ProjectStatus.Active;
    }
    property total_issues := count(.issues);
    required link owner -> User;
    constraint exclusive on ((.name, .owner));
    property open_issues := count((select .issues filter .status = IssueStatus.Open));
    property estimated_completion_date: datetime;
    property actual_completion_date: datetime;
    property progress_percentage := count((select .issues filter .status = IssueStatus.Closed)) / count(.issues) * 100;
    property health_score := calculate_project_health(this);
  }

  scalar type IssueStatus extending enum<Open, Closed, Merged, Reopened,
    Locked, Unlocked, Labeled, Unlabeled, Milestoned, Demilestoned>;

  scalar type MilestoneStatus extending enum<Planned, InProgress, Completed, Overdue>;

  scalar type Priority extending enum<Low, Medium, High, Critical>;

  type Budget extending Timestamped, Financial {
    required total_amount: decimal;
    required remaining_balance: decimal {
      default := .total_amount;
    }
    required link project -> Project;
    property spent_amount := .total_amount - .remaining_balance;
    constraint expression on (.remaining_balance <= .total_amount);
  }

  type Expense extending Timestamped, Financial, NamedAndDescribed, Categorized {
    required link budget -> Budget;
    required link created_by -> User;
  }

  scalar type PaymentStatus extending enum<Pending, Approved, Rejected, Paid>;

  type Payment extending Timestamped, Financial, NamedAndDescribed, Statused {
    required link recipient -> User;
    required link associated_issue -> Issue;
    required link approved_by -> User;
    overloaded required property status: PaymentStatus {
      default := PaymentStatus.Pending;
    }
  }

  type Milestone extending Timestamped, NamedAndDescribed, Statused, VectorSearchable {
    required start_date: datetime;
    required due_date: datetime;
    overloaded required property status: MilestoneStatus;
    multi link issues -> Issue {
      on source delete delete target;
    }
    required link budget -> Budget;
    required link project -> Project;
    index on (.due_date);
    property completion_percentage := count((select .issues filter .status = IssueStatus.Closed)) / count(.issues) * 100;
    constraint expression on (.start_date <= .due_date);
  }

  type Label extending Timestamped, NamedAndDescribed, VectorSearchable {
    required color: str;
    optional multi link issues -> Issue;
    constraint exclusive on ((.name, .color));
  }

  type Issue extending Timestamped, Titled, NamedAndDescribed, Statused, VectorSearchable, Taggable {
    property content: str {
      default := 'Issue content.';
    }
    required link author -> User {
      default := global current_user;
    }
    overloaded required property status: IssueStatus;
    required priority: Priority;
    property estimated_hours: float64;
    property actual_hours: float64;
    index on (.priority);
    optional multi link labels -> Label {
      on source delete delete target;
    }
    required link milestone -> Milestone {
      on target delete allow;
    }
    optional link assignee -> User;
    optional multi link comments -> Comment {
      on source delete delete target;
    }
    property resolution_notes: str;
    property date_resolved: datetime;
    access policy author_has_full_access
      allow all
      using (.author ?= global current_user);
    access policy project_members_can_edit
      allow select, update
      using (global current_user in .milestone.project.owner);
    access policy others_read_only
      allow select;
    property is_blocked: bool {
      default := false;
    }
    multi link blocking_issues -> Issue;
    multi link related_issues -> Issue;
    property time_spent: duration;
    property story_points: int16;
  }

  type Comment extending Timestamped, VectorSearchable {
    required content: str;
    property is_edited: bool {
      default := false;
    }
    required link author -> User;
    required link issue -> Issue;
  }

  type Sprint extending Timestamped, NamedAndDescribed {
    required start_date: datetime;
    required end_date: datetime;
    required link project -> Project;
    multi link issues -> Issue;
    property completed_story_points := sum((select .issues { story_points } filter .status = IssueStatus.Closed).story_points);
    property total_story_points := sum(.issues.story_points);
    property completion_percentage := .completed_story_points / .total_story_points * 100;
  }

  type Team extending NamedAndDescribed {
    multi link members -> User;
    multi link projects -> Project;
    property team_size := count(.members);
  }

  function vector_search(
    search_vector: ext::pgvector::vector<1536>,
    search_limit: int64
  ) -> set of (
    tuple<
      item: VectorSearchable,
      similarity: float64
    >
  ) {
    using (
      with
        matches := (
          select VectorSearchable {
            similarity := ext::pgvector::cosine_distance(.embedding, search_vector)
          }
          order by .similarity
          limit search_limit
        )
      select (
        item := matches,
        similarity := matches.similarity
      )
    )
  }

  function calculate_project_health(project: Project) -> float64 {
    using (
      with
        total_issues := count(project.issues),
        completed_issues := count((select project.issues filter .status = IssueStatus.Closed)),
        overdue_issues := count((select project.issues filter .milestone.due_date < datetime_current() and .status != IssueStatus.Closed)),
        budget_details := (select project.budget { spent_amount, total_amount }),
        budget_usage := (budget_details.spent_amount / budget_details.total_amount * 100)
      select (
        (completed_issues / total_issues * 0.4) +
        ((1 - (overdue_issues / total_issues)) * 0.3) +
        ((1 - (budget_usage / 100)) * 0.3)
      ) * 100
    )
  }
}

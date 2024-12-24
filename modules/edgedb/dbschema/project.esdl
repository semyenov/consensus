module project {
  scalar type ProjectStatus extending enum<Active, Archived, Completed>;

  type Project extending default::BaseObject, default::Auditable, tag::Taggable {
    # Required properties
    required property status: ProjectStatus {
      default := ProjectStatus.Active;
    };
    property estimated_completion_date: datetime;
    property actual_completion_date: datetime;

    # Links
    required link owner -> default::User {
      default := global default::current_user;
      constraint exclusive;
    };
    required link budget -> finance::Budget;
    multi link issues -> issue::Issue {
      on source delete delete target;
    };
    multi link teams -> project::Team;

    # Computed properties
    property total_issues := count(.issues);
    property open_issues := count((select .issues filter .status = issue::IssueStatus.Open));
    property progress_percentage :=
      count((select .issues filter .status = issue::IssueStatus.Closed)) /
      <decimal>count(.issues) * 100;

    # Constraints
    constraint expression on (.estimated_completion_date <= .actual_completion_date);

    # Access policies
    access policy project_owner_has_full_access
      allow all
      using (.owner ?= global default::current_user);
  }

  scalar type MilestoneStatus extending enum<Planned, InProgress, Completed, Overdue>;

  type Milestone extending default::BaseObject, default::Auditable {
    # Required properties
    required start_date: datetime;
    required due_date: datetime;
    required property status: MilestoneStatus {
      default := MilestoneStatus.Planned;
    };

    # Links
    required link budget -> finance::Budget;
    required link project -> project::Project;
    multi link issues -> issue::Issue {
      on source delete delete target;
    };

    # Computed properties
    property completion_percentage := count((select .issues filter .status = issue::IssueStatus.Closed)) / count(.issues) * 100;

    # Indexes
    index on (.due_date);
    index on (.status);

    # Constraints
    constraint expression on (.start_date <= .due_date);

    # Access policies
    access policy project_owner_has_full_access
      allow all
      using (.project.owner ?= global default::current_user);
    access policy milestone_budget_owner
      allow all
      using (.budget.owner ?= global default::current_user);
  }

  type Sprint extending default::Auditable, default::BaseObject {
    # Required properties
    required start_date: datetime;
    required end_date: datetime;

    # Links
    required link project -> project::Project;
    multi link issues -> issue::Issue;

    # Computed properties
    property completed_story_points := sum((select .issues { story_points } filter .status = issue::IssueStatus.Closed).story_points);
    property total_story_points := sum(.issues.story_points);
    property completion_percentage := .completed_story_points / .total_story_points * 100;
  }

  type Team extending default::BaseObject {
    # Links
    required link owner -> default::User;
    multi link members -> default::User;
    multi link projects -> project::Project;

    # Computed properties
    property team_size := count(.members);

    # Access policies
    access policy project_owner_has_full_access
      allow all
      using (.owner ?= global default::current_user);
  }

  function calculate_project_health(project: project::Project) -> decimal {
    using (
      with
        total_issues := <decimal>count(project.issues),
        completed_issues := <decimal>count((select project.issues filter .status = issue::IssueStatus.Closed)),
        overdue_issues := <decimal>count((select project.issues filter .milestone.due_date < datetime_of_statement() and .status != issue::IssueStatus.Closed)),
        budget_details := (select project.budget { spent_amount, total_amount }),
        budget_usage := <decimal>(budget_details.spent_amount / budget_details.total_amount * 100)
      select (
        (completed_issues / total_issues * <decimal>0.4) +
        ((1 - (overdue_issues / total_issues)) * <decimal>0.3) +
        ((1 - (budget_usage / 100)) * <decimal>0.3)
      ) * <decimal>100
    )
  }
}

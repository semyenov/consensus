module issue {
  scalar type IssueStatus extending enum<
    Open,
    Closed,
    Merged,
    Reopened,
    Locked,
    Unlocked,
    Labeled,
    Unlabeled,
    Milestoned,
    Demilestoned
  >;

  scalar type IssuePriority extending enum<
    Low,
    Medium,
    High,
    Critical
  >;

  type Issue extending default::BaseObject, default::Auditable, tag::Taggable, search::VectorSearchable {
    # Required properties
    required property content: str;
    required property priority: IssuePriority;
    required property status: IssueStatus {
      default := IssueStatus.Open;
    };

    # Optional properties
    property actual_hours: float64;
    property date_resolved: datetime;
    property estimated_hours: float64;
    property is_blocked: bool {
      default := false;
    }
    property resolution_notes: str;
    property story_points: int16;
    property time_spent: duration;

    # Links
    required link author -> user::User {
      default := global user::current_user;
    };
    required link milestone -> project::Milestone {
      on target delete allow;
    }
    optional link assignee -> user::User;
    optional multi link blocking_issues -> Issue;
    optional multi link comments -> Comment { on source delete delete target; }
    optional multi link labels -> Label { on source delete delete target; }
    optional multi link related_issues -> Issue;

    # Indexes
    index on (.priority);
    index on (.status);
    index on (.content);

    # Access policies
    access policy author_has_full_access
      allow all
      using (.author ?= global user::current_user);
    access policy project_members_can_edit
      allow select, update
      using (.milestone.project.owner ?= global user::current_user);
    access policy issue_assignee_can_edit
      allow update
      using (.assignee ?= global user::current_user);
    access policy others_read_only
      allow select;
  }

  type Label extending default::Auditable, default::BaseObject, search::VectorSearchable {
    required color: str;
    optional multi link issues -> Issue;
    constraint exclusive on ((.name, .color));
  }

  type Comment extending default::Auditable, search::VectorSearchable {
    required content: str;
    property is_edited: bool {
      default := false;
    }
    required link author -> user::User;
    required link issue -> Issue;
  }
}

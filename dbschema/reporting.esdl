module reporting {
  type ProjectHealthReport extending default::BaseObject, default::Auditable {
    required link project -> project::Project;
    required property period_start: datetime;
    required property period_end: datetime;

    # Computed properties
    property total_issues := count(.project.issues);
    property open_issues_count := count((select .project.issues filter .status = issue::IssueStatus.Open));
    property closed_issues_count := count((select .project.issues filter .status = issue::IssueStatus.Closed));
  }
}

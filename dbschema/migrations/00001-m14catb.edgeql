CREATE MIGRATION m14catbjp727zeq25rjqvmpbjy63utzdbovzowtw5qj4kwvy7x2toq
    ONTO initial
{
  CREATE EXTENSION pgvector VERSION '0.5';
  CREATE EXTENSION pgcrypto VERSION '1.3';
  CREATE EXTENSION auth VERSION '1.0';
  CREATE EXTENSION ai VERSION '1.0';
  CREATE MODULE finance IF NOT EXISTS;
  CREATE MODULE issue IF NOT EXISTS;
  CREATE MODULE project IF NOT EXISTS;
  CREATE MODULE search IF NOT EXISTS;
  CREATE MODULE tag IF NOT EXISTS;
  CREATE ABSTRACT TYPE default::Auditable {
      CREATE REQUIRED PROPERTY created_at: std::datetime {
          SET default := (std::datetime_current());
      };
      CREATE REQUIRED PROPERTY updated_at: std::datetime {
          SET default := (std::datetime_current());
      };
  };
  CREATE ABSTRACT TYPE default::BaseObject {
      CREATE REQUIRED PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY name: std::str;
      CREATE INDEX ON (.name);
  };
  CREATE SCALAR TYPE issue::IssueStatus EXTENDING enum<Open, Closed, Merged, Reopened, Locked, Unlocked, Labeled, Unlabeled, Milestoned, Demilestoned>;
  CREATE TYPE default::User EXTENDING default::BaseObject, default::Auditable {
      CREATE REQUIRED LINK identity: ext::auth::Identity;
      CREATE REQUIRED PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE INDEX ON (.identity);
      CREATE INDEX ON (.email);
  };
  CREATE GLOBAL default::current_user := (std::assert_single((SELECT
      default::User {
          id,
          name
      }
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
  CREATE ABSTRACT TYPE finance::Monetary {
      CREATE REQUIRED PROPERTY amount: std::decimal;
      CREATE CONSTRAINT std::expression ON ((.amount >= 0));
  };
  CREATE TYPE finance::Budget EXTENDING default::BaseObject, default::Auditable, finance::Monetary {
      CREATE REQUIRED LINK owner: default::User;
      CREATE REQUIRED PROPERTY total_amount: std::decimal;
      CREATE REQUIRED PROPERTY remaining_balance: std::decimal {
          SET default := (.total_amount);
      };
      CREATE PROPERTY spent_amount := ((.total_amount - .remaining_balance));
      CREATE ACCESS POLICY budget_owner_can_select
          ALLOW SELECT USING ((.owner ?= GLOBAL default::current_user));
      CREATE CONSTRAINT std::expression ON ((.remaining_balance >= 0));
      CREATE CONSTRAINT std::expression ON ((.remaining_balance <= .total_amount));
      CREATE CONSTRAINT std::expression ON ((.total_amount >= 0));
      CREATE INDEX ON (.remaining_balance);
      CREATE INDEX ON (.total_amount);
  };
  CREATE TYPE tag::Tag EXTENDING default::BaseObject {
      CREATE CONSTRAINT std::exclusive ON (.name);
  };
  CREATE ABSTRACT TYPE tag::Taggable {
      CREATE MULTI LINK tags: tag::Tag;
  };
  CREATE SCALAR TYPE issue::IssuePriority EXTENDING enum<Low, Medium, High, Critical>;
  CREATE TYPE issue::Issue EXTENDING default::BaseObject, default::Auditable, tag::Taggable {
      CREATE REQUIRED LINK author: default::User {
          SET default := (GLOBAL default::current_user);
      };
      CREATE REQUIRED PROPERTY status: issue::IssueStatus {
          SET default := (issue::IssueStatus.Open);
      };
      CREATE ACCESS POLICY author_has_full_access
          ALLOW ALL USING ((.author ?= GLOBAL default::current_user));
      CREATE OPTIONAL LINK assignee: default::User;
      CREATE ACCESS POLICY issue_assignee_can_edit
          ALLOW UPDATE USING ((.assignee ?= GLOBAL default::current_user));
      CREATE PROPERTY story_points: std::int16;
      CREATE ACCESS POLICY others_read_only
          ALLOW SELECT ;
      CREATE REQUIRED PROPERTY priority: issue::IssuePriority;
      CREATE INDEX ON (.priority);
      CREATE REQUIRED PROPERTY content: std::str;
      CREATE INDEX ON (.content);
      CREATE INDEX ON (.status);
      CREATE OPTIONAL MULTI LINK blocking_issues: issue::Issue;
      CREATE OPTIONAL MULTI LINK related_issues: issue::Issue;
      CREATE PROPERTY actual_hours: std::float64;
      CREATE PROPERTY date_resolved: std::datetime;
      CREATE PROPERTY estimated_hours: std::float64;
      CREATE PROPERTY is_blocked: std::bool {
          SET default := false;
      };
      CREATE PROPERTY resolution_notes: std::str;
      CREATE PROPERTY time_spent: std::duration;
  };
  CREATE SCALAR TYPE project::MilestoneStatus EXTENDING enum<Planned, InProgress, Completed, Overdue>;
  CREATE TYPE project::Milestone EXTENDING default::Auditable, default::BaseObject {
      CREATE REQUIRED LINK budget: finance::Budget;
      CREATE REQUIRED PROPERTY due_date: std::datetime;
      CREATE ACCESS POLICY milestone_budget_owner
          ALLOW ALL USING ((.budget.owner ?= GLOBAL default::current_user));
      CREATE MULTI LINK issues: issue::Issue {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED PROPERTY start_date: std::datetime;
      CREATE CONSTRAINT std::expression ON ((.start_date <= .due_date));
      CREATE INDEX ON (.due_date);
      CREATE REQUIRED PROPERTY status: project::MilestoneStatus {
          SET default := (project::MilestoneStatus.Planned);
      };
      CREATE INDEX ON (.status);
  };
  ALTER TYPE issue::Issue {
      CREATE REQUIRED LINK milestone: project::Milestone {
          ON TARGET DELETE ALLOW;
      };
  };
  CREATE SCALAR TYPE project::ProjectStatus EXTENDING enum<Active, Archived, Completed>;
  CREATE TYPE project::Project EXTENDING default::Auditable, default::BaseObject, tag::Taggable {
      CREATE REQUIRED LINK budget: finance::Budget;
      CREATE MULTI LINK issues: issue::Issue {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED LINK owner: default::User {
          SET default := (GLOBAL default::current_user);
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE ACCESS POLICY project_owner_has_full_access
          ALLOW ALL USING ((.owner ?= GLOBAL default::current_user));
      CREATE PROPERTY actual_completion_date: std::datetime;
      CREATE PROPERTY estimated_completion_date: std::datetime;
      CREATE CONSTRAINT std::expression ON ((.estimated_completion_date <= .actual_completion_date));
      CREATE REQUIRED PROPERTY status: project::ProjectStatus {
          SET default := (project::ProjectStatus.Active);
      };
  };
  ALTER TYPE project::Milestone {
      CREATE REQUIRED LINK project: project::Project;
      CREATE ACCESS POLICY project_owner_has_full_access
          ALLOW ALL USING ((.project.owner ?= GLOBAL default::current_user));
      CREATE PROPERTY completion_percentage := (((std::count((SELECT
          .issues
      FILTER
          (.status = issue::IssueStatus.Closed)
      )) / std::count(.issues)) * 100));
  };
  CREATE FUNCTION project::calculate_project_health(project: project::Project) ->  std::decimal USING (WITH
      total_issues :=
          <std::decimal>std::count(project.issues)
      ,
      completed_issues :=
          <std::decimal>std::count((SELECT
              project.issues
          FILTER
              (.status = issue::IssueStatus.Closed)
          ))
      ,
      overdue_issues :=
          <std::decimal>std::count((SELECT
              project.issues
          FILTER
              ((.milestone.due_date < std::datetime_of_statement()) AND (.status != issue::IssueStatus.Closed))
          ))
      ,
      budget_details :=
          (SELECT
              project.budget {
                  spent_amount,
                  total_amount
              }
          )
      ,
      budget_usage :=
          <std::decimal>((budget_details.spent_amount / budget_details.total_amount) * 100)
  SELECT
      (((((completed_issues / total_issues) * <std::decimal>0.4) + ((1 - (overdue_issues / total_issues)) * <std::decimal>0.3)) + ((1 - (budget_usage / 100)) * <std::decimal>0.3)) * <std::decimal>100)
  );
  CREATE SCALAR TYPE search::EmbeddingVector EXTENDING ext::pgvector::vector<1536>;
  CREATE ABSTRACT TYPE search::VectorSearchable {
      CREATE REQUIRED PROPERTY embedding: search::EmbeddingVector;
      CREATE INDEX ext::pgvector::ivfflat_cosine(lists := 100) ON (.embedding);
  };
  CREATE FUNCTION search::vector_search(search_vector: search::EmbeddingVector, search_limit: std::int64) -> SET OF tuple<item: search::VectorSearchable, similarity: std::float64> USING (WITH
      matches :=
          (SELECT
              search::VectorSearchable {
                  similarity := ext::pgvector::cosine_distance(.embedding, search_vector)
              } ORDER BY
                  .similarity ASC
          LIMIT
              search_limit
          )
  SELECT
      (
          item := matches,
          similarity := matches.similarity
      )
  );
  CREATE TYPE finance::Expense EXTENDING default::BaseObject, default::Auditable, finance::Monetary {
      CREATE REQUIRED LINK created_by: default::User;
      CREATE ACCESS POLICY expense_creator_can_select
          ALLOW SELECT USING ((.created_by ?= GLOBAL default::current_user));
      CREATE REQUIRED LINK budget: finance::Budget;
  };
  CREATE SCALAR TYPE finance::PaymentStatus EXTENDING enum<Pending, Approved, Rejected, Paid>;
  CREATE TYPE finance::Payment EXTENDING default::BaseObject, default::Auditable, finance::Monetary {
      CREATE REQUIRED LINK approved_by: default::User;
      CREATE ACCESS POLICY payment_approver_can_select
          ALLOW SELECT USING ((.approved_by ?= GLOBAL default::current_user));
      CREATE REQUIRED LINK recipient: default::User;
      CREATE REQUIRED LINK associated_issue: issue::Issue;
      CREATE REQUIRED PROPERTY status: finance::PaymentStatus {
          SET default := (finance::PaymentStatus.Pending);
      };
  };
  ALTER TYPE issue::Issue {
      CREATE ACCESS POLICY project_members_can_edit
          ALLOW SELECT, UPDATE USING ((.milestone.project.owner ?= GLOBAL default::current_user));
  };
  CREATE TYPE project::Team EXTENDING default::BaseObject {
      CREATE REQUIRED LINK owner: default::User;
      CREATE ACCESS POLICY project_owner_has_full_access
          ALLOW ALL USING ((.owner ?= GLOBAL default::current_user));
      CREATE MULTI LINK members: default::User;
      CREATE PROPERTY team_size := (std::count(.members));
      CREATE MULTI LINK projects: project::Project;
  };
  CREATE TYPE project::Sprint EXTENDING default::Auditable, default::BaseObject {
      CREATE MULTI LINK issues: issue::Issue;
      CREATE PROPERTY completed_story_points := (std::sum(((SELECT
          .issues {
              story_points
          }
      FILTER
          (.status = issue::IssueStatus.Closed)
      )).story_points));
      CREATE PROPERTY total_story_points := (std::sum(.issues.story_points));
      CREATE PROPERTY completion_percentage := (((.completed_story_points / .total_story_points) * 100));
      CREATE REQUIRED LINK project: project::Project;
      CREATE REQUIRED PROPERTY end_date: std::datetime;
      CREATE REQUIRED PROPERTY start_date: std::datetime;
  };
  ALTER TYPE project::Project {
      CREATE PROPERTY open_issues := (std::count((SELECT
          .issues
      FILTER
          (.status = issue::IssueStatus.Open)
      )));
      CREATE PROPERTY progress_percentage := (((std::count((SELECT
          .issues
      FILTER
          (.status = issue::IssueStatus.Closed)
      )) / <std::decimal>std::count(.issues)) * 100));
      CREATE PROPERTY total_issues := (std::count(.issues));
      CREATE MULTI LINK teams: project::Team;
  };
  CREATE TYPE issue::Comment EXTENDING default::Auditable {
      CREATE REQUIRED LINK author: default::User;
      CREATE REQUIRED LINK issue: issue::Issue;
      CREATE REQUIRED PROPERTY content: std::str;
      CREATE PROPERTY is_edited: std::bool {
          SET default := false;
      };
  };
  CREATE TYPE issue::Label EXTENDING default::Auditable, default::BaseObject {
      CREATE OPTIONAL MULTI LINK issues: issue::Issue;
      CREATE REQUIRED PROPERTY color: std::str;
      CREATE CONSTRAINT std::exclusive ON ((.name, .color));
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK assigned_issues := (.<assignee[IS issue::Issue]);
      CREATE PROPERTY total_issues := (std::count(.assigned_issues));
      CREATE PROPERTY workload := (std::count(.assigned_issues FILTER
          (.status != issue::IssueStatus.Closed)
      ));
      CREATE MULTI LINK projects := (.<owner[IS project::Project]);
      CREATE MULTI LINK teams := (.<members[IS project::Team]);
  };
  ALTER TYPE finance::Budget {
      CREATE REQUIRED LINK project: project::Project;
  };
  ALTER TYPE issue::Issue {
      CREATE OPTIONAL MULTI LINK comments: issue::Comment {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE OPTIONAL MULTI LINK labels: issue::Label {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
};

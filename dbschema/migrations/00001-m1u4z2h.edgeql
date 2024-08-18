CREATE MIGRATION m1u4z2hyhlqr36m73fueevazbhin5ihb7eo2plxdmwlbd3chgjwxjq
    ONTO initial
{
  CREATE EXTENSION pgcrypto VERSION '1.3';
  CREATE EXTENSION auth VERSION '1.0';
  CREATE TYPE default::User {
      CREATE REQUIRED LINK identity: ext::auth::Identity;
      CREATE REQUIRED PROPERTY name: std::str;
  };
  CREATE GLOBAL default::current_user := (std::assert_single((SELECT
      default::User {
          id,
          name
      }
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
  CREATE SCALAR TYPE default::Status EXTENDING enum<Open, Closed, Merged, Reopened, Locked, Unlocked, Labeled, Unlabeled, Milestoned, Demilestoned>;
  CREATE TYPE default::Issue {
      CREATE REQUIRED LINK author: default::User {
          SET default := (GLOBAL default::current_user);
      };
      CREATE ACCESS POLICY author_has_full_access
          ALLOW ALL USING ((.author ?= GLOBAL default::current_user));
      CREATE ACCESS POLICY others_read_only
          ALLOW SELECT ;
      CREATE OPTIONAL LINK assignee: default::User;
      CREATE PROPERTY content: std::str {
          SET default := 'Issue content.';
      };
      CREATE PROPERTY date_resolved: std::datetime;
      CREATE PROPERTY description: std::str {
          SET default := 'Issue description.';
      };
      CREATE PROPERTY resolution_notes: std::str;
      CREATE REQUIRED PROPERTY status: default::Status;
      CREATE PROPERTY title: std::str {
          SET default := 'Issue title.';
      };
  };
  CREATE TYPE default::Project {
      CREATE MULTI LINK issues: default::Issue {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED LINK owner: default::User;
      CREATE REQUIRED PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY name: std::str;
  };
  CREATE TYPE default::Budget {
      CREATE REQUIRED LINK project: default::Project;
      CREATE REQUIRED PROPERTY total_amount: std::float64;
      CREATE REQUIRED PROPERTY remaining_balance: std::float64 {
          SET default := (.total_amount);
      };
  };
  CREATE TYPE default::Expense {
      CREATE REQUIRED LINK budget: default::Budget;
      CREATE REQUIRED PROPERTY amount: std::float64;
      CREATE REQUIRED PROPERTY description: std::str;
  };
  CREATE SCALAR TYPE default::MilestoneStatus EXTENDING enum<Planned, InProgress, Completed, Overdue>;
  CREATE TYPE default::Milestone {
      CREATE REQUIRED LINK budget: default::Budget;
      CREATE MULTI LINK issues: default::Issue {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED PROPERTY due_date: std::datetime;
      CREATE REQUIRED PROPERTY name: std::str;
      CREATE REQUIRED PROPERTY start_date: std::datetime;
      CREATE REQUIRED PROPERTY status: default::MilestoneStatus;
  };
  CREATE TYPE default::Comment {
      CREATE REQUIRED LINK author: default::User;
      CREATE REQUIRED LINK issue: default::Issue;
      CREATE REQUIRED PROPERTY content: std::str;
      CREATE REQUIRED PROPERTY created_at: std::datetime;
  };
  ALTER TYPE default::Issue {
      CREATE OPTIONAL MULTI LINK comments: default::Comment {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  CREATE TYPE default::Label {
      CREATE OPTIONAL MULTI LINK issues: default::Issue;
      CREATE REQUIRED PROPERTY color: std::str;
      CREATE REQUIRED PROPERTY description: std::str;
      CREATE REQUIRED PROPERTY name: std::str;
  };
  ALTER TYPE default::Issue {
      CREATE OPTIONAL MULTI LINK labels: default::Label {
          ON SOURCE DELETE DELETE TARGET;
      };
      CREATE REQUIRED LINK milestone: default::Milestone;
  };
  CREATE TYPE default::Payment {
      CREATE REQUIRED LINK associated_issue: default::Issue;
      CREATE REQUIRED LINK recipient: default::User;
      CREATE REQUIRED PROPERTY amount: std::float64;
      CREATE REQUIRED PROPERTY description: std::str;
  };
  ALTER TYPE default::User {
      CREATE MULTI LINK projects: default::Project {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
};

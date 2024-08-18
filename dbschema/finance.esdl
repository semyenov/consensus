module finance {
  abstract type Monetary {
    required amount: decimal;
    constraint expression on (.amount >= 0);
  }

  type Budget extending default::BaseObject, default::Auditable, finance::Monetary {
    # Required properties
    required total_amount: decimal;
    required remaining_balance: decimal {
      default := .total_amount;
    };

    # Links
    required link project -> project::Project;
    required link owner -> user::User;

    # Computed properties
    property spent_amount := .total_amount - .remaining_balance;

    # Indexes
    index on (.total_amount);
    index on (.remaining_balance);

    # Access policies
    access policy budget_owner_can_select
      allow select
      using (.owner ?= global user::current_user);

    # Constraints
    constraint expression on (.remaining_balance <= .total_amount);
    constraint expression on (.remaining_balance >= 0);
    constraint expression on (.total_amount >= 0);
  }

  type Expense extending default::BaseObject, default::Auditable, finance::Monetary {
    # Links
    required link budget -> Budget;
    required link created_by -> user::User;

    # Access policies
    access policy expense_creator_can_select
      allow select
      using (.created_by ?= global user::current_user);
  }

  scalar type PaymentStatus extending enum<Pending, Approved, Rejected, Paid>;

  type Payment extending default::BaseObject, default::Auditable, finance::Monetary {
    # Required properties
    required property status: PaymentStatus {
      default := PaymentStatus.Pending;
    }

    # Links
    required link recipient -> user::User;
    required link associated_issue -> issue::Issue;
    required link approved_by -> user::User;

    # Access policies
    access policy payment_approver_can_select
      allow select
      using (.approved_by ?= global user::current_user);
  }
}
